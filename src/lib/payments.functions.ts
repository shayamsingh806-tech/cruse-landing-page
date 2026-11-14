import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Parses "₹2,500 per person" / "From ₹3,500" -> rupees, or null when on request.
function priceToRupees(price: string): number | null {
  const m = price.replace(/,/g, "").match(/₹\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

function basicAuth() {
  const id = process.env["RAZORPAY_KEY_ID"];
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  if (!id || !secret) throw new Error("Payments are not configured");
  return { id, secret, header: "Basic " + btoa(`${id}:${secret}`) };
}

async function loadExperience(title: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("experiences").select("title,price,price_note,hidden").eq("title", title).maybeSingle();
  if (data && !data.hidden) return { title: data.title, price: data.price, priceNote: data.price_note ?? undefined } as { title: string; price: string; priceNote?: string };
  const { experiences } = await import("@/lib/site-data");
  const s = experiences.find((x) => x.title === title);
  return s ? { title: s.title, price: s.price, priceNote: s.priceNote } : null;
}

const orderInput = z.object({
  experience: z.string().min(1).max(200),
  guests: z.number().int().min(1).max(200),
  adults: z.number().int().min(1).max(200).optional(),
  children: z.number().int().min(0).max(200).optional(),
  infants: z.number().int().min(0).max(200).optional(),
});

export const createPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => orderInput.parse(d))
  .handler(async ({ data }) => {
    const exp = await loadExperience(data.experience);
    if (!exp) return { payable: false as const };
    const rupees = priceToRupees(exp.price);
    if (!rupees) return { payable: false as const };
    const { guestPricingMode, rupees: childPrice } = await import("@/lib/cart");
    const pricingMode = guestPricingMode(exp);
    const usesAgePricing = pricingMode !== "standard";
    const adults = data.adults ?? data.guests;
    const children = data.children ?? 0;
    const infants = data.infants ?? 0;
    if (usesAgePricing && adults + children + infants !== data.guests) throw new Error("Guest totals do not match");
    const childRupees = pricingMode === "child-rate" ? childPrice(exp.priceNote) : null;
    if (pricingMode === "child-rate" && childRupees === null) throw new Error("Child pricing is not configured");
    const amount = (pricingMode === "child-rate" ? adults * rupees + children * (childRupees ?? 0) : pricingMode === "infant-free" ? (adults + children) * rupees : rupees * data.guests) * 100;
    const { id, header } = basicAuth();
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: header, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        notes: {
          experience: data.experience,
          guests: String(data.guests),
          ...(usesAgePricing ? { adults: String(adults), children: String(children), infants: String(infants) } : {}),
        },
      }),
    });
    if (!res.ok) throw new Error("Could not start payment");
    const order = (await res.json()) as { id: string; amount: number };
    return { payable: true as const, orderId: order.id, amount: order.amount, keyId: id };
  });

const sourceField = z.enum(["direct", "chat"]).default("direct");

const bookingInput = z.object({
  experience: z.string().trim().min(1).max(200),
  booking_date: z.string().trim().min(1).max(20),
  guest_count: z.number().int().min(1).max(200),
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200),
  notes: z.string().max(2000).default(""),
  source: sourceField,
});

function prettyDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const submitBookingRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => bookingInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("bookings").insert(data as never).select("id").single();
    if (error || !row) throw new Error("Your request could not be saved");
    const id = (row as { id: string }).id;
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("booking-request-received", data.email, {
        templateData: {
          name: data.name,
          experience: data.experience,
          bookingDate: prettyDate(data.booking_date),
          guests: data.guest_count,
          phone: data.phone,
          notes: data.notes || undefined,
          reference: id.slice(0, 8).toUpperCase(),
        },
        idempotencyKey: `booking-request-received-${id}`,
        replyTo: "management@canopusmarineserv.com",
      });
    } catch (e) {
      console.error("Booking request email failed", e);
    }
    return { ok: true };
  });

const verifyInput = z.object({
  order_id: z.string().min(1),
  payment_id: z.string().min(1),
  signature: z.string().min(1),
  booking: z.object({
    experience: z.string().min(1).max(200),
    booking_date: z.string().min(1).max(20),
    guest_count: z.number().int().min(1).max(200),
    name: z.string().min(1).max(200),
    phone: z.string().min(1).max(40),
    email: z.string().email().max(200),
    notes: z.string().max(2000).default(""),
    source: sourceField,
  }),
});

export const confirmPaidBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => verifyInput.parse(d))
  .handler(async ({ data }) => {
    const { secret, header } = basicAuth();
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", secret).update(`${data.order_id}|${data.payment_id}`).digest("hex");
    const a = Buffer.from(expected), b = Buffer.from(data.signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Payment could not be verified");
    const res = await fetch(`https://api.razorpay.com/v1/orders/${data.order_id}`, { headers: { Authorization: header } });
    if (!res.ok) throw new Error("Payment could not be verified");
    const order = (await res.json()) as { amount: number; amount_paid: number; notes?: Record<string, string> };
    const exp = await loadExperience(data.booking.experience);
    const adultPrice = exp ? priceToRupees(exp.price) : null;
    if (!exp || !adultPrice) throw new Error("Booking price could not be verified");
    const { guestPricingMode, rupees: childPrice } = await import("@/lib/cart");
    const pricingMode = guestPricingMode(exp);
    const usesAgePricing = pricingMode !== "standard";
    const adults = Number(order.notes?.["adults"] ?? data.booking.guest_count);
    const children = Number(order.notes?.["children"] ?? 0);
    const infants = Number(order.notes?.["infants"] ?? 0);
    const expectedGuests = adults + children + infants;
    const childRupees = pricingMode === "child-rate" ? childPrice(exp.priceNote) : null;
    const expectedAmount = (pricingMode === "child-rate" ? adults * adultPrice + children * (childRupees ?? 0) : pricingMode === "infant-free" ? (adults + children) * adultPrice : adultPrice * data.booking.guest_count) * 100;
    if (
      order.notes?.["experience"] !== data.booking.experience ||
      Number(order.notes?.["guests"]) !== data.booking.guest_count ||
      (pricingMode === "child-rate" && childRupees === null) ||
      (usesAgePricing && expectedGuests !== data.booking.guest_count) ||
      order.amount !== expectedAmount ||
      order.amount_paid !== expectedAmount
    ) throw new Error("Paid amount does not match booking");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bookings").insert({
      ...data.booking,
      payment_status: "paid",
      amount_paise: order.amount_paid,
      razorpay_order_id: data.order_id,
      razorpay_payment_id: data.payment_id,
    } as never);
    if (error && !error.message.includes("duplicate")) throw new Error("Payment received but booking save failed — we will contact you.");
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const b = data.booking;
      const date = new Date(b.booking_date + "T00:00:00");
      await sendTemplateEmail("booking-confirmation", b.email, {
        templateData: {
          name: b.name,
          experience: b.experience,
          bookingDate: isNaN(date.getTime()) ? b.booking_date : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          guests: b.guest_count,
          amount: "₹" + (order.amount_paid / 100).toLocaleString("en-IN"),
          paymentStatus: "Paid",
          paymentId: data.payment_id,
          bookingRef: data.order_id,
        },
        idempotencyKey: `booking-confirmation-${data.payment_id}`,
        replyTo: "management@canopusmarineserv.com",
      });
    } catch (e) {
      console.error("Booking confirmation email failed", e);
    }
    return { ok: true };
  });

// ---- Multi-experience cart: one Razorpay payment for several bookings ----
const cartItem = z.object({
  experience: z.string().trim().min(1).max(200),
  booking_date: z.string().trim().min(1).max(20),
  guest_count: z.number().int().min(1).max(200),
  adults: z.number().int().min(0).max(200).optional(),
  children: z.number().int().min(0).max(200).optional(),
  infants: z.number().int().min(0).max(200).optional(),
});
const cartItems = z.array(cartItem).min(1).max(20);
type CartLine = z.infer<typeof cartItem>;

// Server-side price per line in paise; never trusts client totals.
async function priceLines(items: CartLine[]) {
  const { itemTotal, hasAgePricing } = await import("@/lib/cart");
  const out: number[] = [];
  for (const it of items) {
    const exp = await loadExperience(it.experience);
    if (!exp) throw new Error("Unknown experience");
    if (hasAgePricing(exp) && (it.adults ?? it.guest_count) + (it.children ?? 0) + (it.infants ?? 0) !== it.guest_count) throw new Error("Guest totals do not match");
    const r = itemTotal(exp, { guests: it.guest_count, adults: it.adults ?? it.guest_count, children: it.children ?? 0 });
    if (!r) throw new Error(`${it.experience} cannot be paid online`);
    out.push(r * 100);
  }
  return out;
}

export const createCartOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ items: cartItems }).parse(d))
  .handler(async ({ data }) => {
    const lines = await priceLines(data.items);
    const amount = lines.reduce((a, b) => a + b, 0);
    const { id, header } = basicAuth();
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: header, "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "INR", notes: { cart: data.items.map((i) => `${i.experience} x${i.guest_count} ${i.booking_date}`).join("; ").slice(0, 250) } }),
    });
    if (!res.ok) throw new Error("Could not start payment");
    const order = (await res.json()) as { id: string; amount: number };
    return { orderId: order.id, amount: order.amount, keyId: id };
  });

const contact = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200),
  notes: z.string().max(2000).default(""),
  source: sourceField,
});

// Shared finalizer: verifies the paid amount against server-side prices, saves the
// bookings and sends confirmations. Razorpay payment ids are unique per booking row,
// so a repeated call for the same payment is a no-op (no duplicate bookings/emails).
async function finalizeCartBooking(orderId: string, paymentId: string, items: CartLine[], contactInfo: z.infer<typeof contact>, savedRef?: string) {
  const { header } = basicAuth();
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, { headers: { Authorization: header } });
  const order = (await res.json()) as { amount_paid: number };
  const lines = await priceLines(items);
  if (lines.reduce((x, y) => x + y, 0) !== order.amount_paid) throw new Error("Paid amount does not match cart — we will contact you.");
  const rows = items.map((it, i) => ({
    experience: it.experience,
    booking_date: it.booking_date,
    guest_count: it.guest_count,
    name: contactInfo.name,
    phone: contactInfo.phone,
    email: contactInfo.email,
    source: contactInfo.source,
    notes: [contactInfo.notes, it.adults !== undefined ? `Guests: ${it.adults} adult(s), ${it.children ?? 0} child(ren), ${it.infants ?? 0} infant(s)` : "", `Cart order ${orderId} (item ${i + 1} of ${items.length})`].filter(Boolean).join("\n"),
    payment_status: "paid",
    amount_paise: lines[i],
    razorpay_order_id: orderId,
    // payment id is unique per row; suffix extra items of the same payment
    razorpay_payment_id: i === 0 ? paymentId : `${paymentId}#${i + 1}`,
  }));
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("bookings").insert(rows as never);
  if (error && !error.message.includes("duplicate")) throw new Error("Payment received but booking save failed — we will contact you.");
  if (savedRef) {
    try {
      const { markSavedCartConverted } = await import("@/lib/saved-carts.functions");
      await markSavedCartConverted(savedRef, orderId, order.amount_paid);
    } catch (e) { console.error("saved cart conversion", e); }
  }
  try {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    for (const [i, r] of rows.entries()) {
      await sendTemplateEmail("booking-confirmation", r.email, {
        templateData: {
          name: r.name,
          experience: r.experience,
          bookingDate: prettyDate(r.booking_date),
          guests: r.guest_count,
          amount: "₹" + (lines[i]! / 100).toLocaleString("en-IN"),
          paymentStatus: "Paid",
          paymentId,
          bookingRef: orderId,
        },
        idempotencyKey: `booking-confirmation-${paymentId}-${i}`,
        replyTo: "management@canopusmarineserv.com",
      });
    }
  } catch (e) {
    console.error("Cart confirmation email failed", e);
  }
  return { ok: true };
}

export const confirmCartBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ order_id: z.string().min(1), payment_id: z.string().min(1), signature: z.string().min(1), items: cartItems, contact, saved_ref: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { secret } = basicAuth();
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", secret).update(`${data.order_id}|${data.payment_id}`).digest("hex");
    const a = Buffer.from(expected), b = Buffer.from(data.signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Payment could not be verified");
    return finalizeCartBooking(data.order_id, data.payment_id, data.items, data.contact, data.saved_ref);
  });

// Recovery path: if the payment succeeded but the client-side confirmation failed
// (network drop, closed tab), the guest retries with the SAME order. We ask Razorpay
// whether that order is already paid and finalize it — no new order, no second charge.
export const recoverCartOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ order_id: z.string().min(1), items: cartItems, contact, saved_ref: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { header } = basicAuth();
    const res = await fetch(`https://api.razorpay.com/v1/orders/${data.order_id}/payments`, { headers: { Authorization: header } });
    if (!res.ok) throw new Error("Could not check payment status");
    const { items: payments } = (await res.json()) as { items: { id: string; status: string }[] };
    const paid = payments.find((p) => p.status === "captured" || p.status === "authorized");
    if (!paid) return { paid: false as const };
    await finalizeCartBooking(data.order_id, paid.id, data.items, data.contact, data.saved_ref);
    return { paid: true as const };
  });
