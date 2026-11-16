import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { cart, guestPricingMode, suggestFor } from "@/lib/cart";
import { MiniSuggestions } from "@/components/site/CartBits";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { useExperiences } from "@/lib/use-experiences";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { createPaymentOrder, confirmPaidBooking, submitBookingRequest } from "@/lib/payments.functions";
import { chatAttribution, markChatConverted } from "@/lib/chat-attribution";
import { trackChatEvent } from "@/lib/chat-events";
import { openWhatsApp, whatsappLink } from "@/lib/whatsapp";
import { trackLead } from "@/lib/analytics";

type RzpResp = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}
function loadRzp() {
  return new Promise<boolean>((r) => {
    if (window.Razorpay) return r(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => r(true);
    s.onerror = () => r(false);
    document.body.appendChild(s);
  });
}
function rupees(price: string) {
  const m = price.replace(/,/g, "").match(/₹\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

export function BookingForm({ lockedTitle, compact }: { lockedTitle?: string | undefined; compact?: boolean | undefined }) {
  const experiences = useExperiences();
  const createOrder = useServerFn(createPaymentOrder);
  const confirm = useServerFn(confirmPaidBooking);
  const submitRequest = useServerFn(submitBookingRequest);
  const [sel, setSel] = useState(lockedTitle ?? "");
  const [guestsRaw, setGuestsRaw] = useState("2");
  const [adultsRaw, setAdultsRaw] = useState("2");
  const [childrenRaw, setChildrenRaw] = useState("0");
  const [infantsRaw, setInfantsRaw] = useState("0");
  const num = (v: string, min: number) => Math.min(200, Math.max(min, Math.floor(Number(v)) || min));
  const guests = num(guestsRaw, 1);
  const adults = num(adultsRaw, 1);
  const children = num(childrenRaw, 0);
  const infants = num(infantsRaw, 0);
  const [done, setDone] = useState<{ message: string; paid: boolean } | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function addToCart() {
    const form = formRef.current;
    const dateEl = form?.elements.namedItem("date") as HTMLInputElement | null;
    if (!chosen) return setStatus("Please choose an experience first.");
    if (!dateEl?.value) {
      dateEl?.reportValidity();
      return;
    }
    cart.add({
      slug: chosen.slug,
      title: chosen.title,
      date: dateEl.value,
      guests: guestCount,
      ...(hasAgePricing ? { adults, children: hasChildRate ? children : 0, infants } : {}),
    });
    setStatus("");
    setAdded(true);
  }

  const chosen = experiences.find((x) => x.title === sel);
  const unit = chosen ? rupees(chosen.price) : null;
  const pricingMode = guestPricingMode(chosen);
  const hasAgePricing = pricingMode !== "standard";
  const hasChildRate = pricingMode === "child-rate";
  const childUnit = hasChildRate && chosen?.priceNote ? rupees(chosen.priceNote) : null;
  const guestCount = hasAgePricing ? adults + children + infants : Math.max(1, guests);
  const total = hasChildRate
    ? (unit ?? 0) * adults + (childUnit ?? 0) * children
    : pricingMode === "infant-free"
      ? (unit ?? 0) * adults
    : unit
      ? unit * guestCount
      : null;

  // Both buttons: validate the form, then send every filled-in detail to WhatsApp.
  function sendToWhatsApp(kind: "booking" | "enquiry") {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;
    const f = new FormData(form);
    if (f.get("website")) {
      setDone({ message: "", paid: false });
      return;
    }
    const notesText = String(f.get("notes") ?? "").trim();
    const guestLine = hasAgePricing
      ? hasChildRate
        ? `${guestCount} (${adults} adult(s), ${children} child(ren), ${infants} infant(s))`
        : `${guestCount} (${adults} guest(s) aged 3+, ${infants} infant(s) below 3)`
      : String(guestCount);
    const experience = String(f.get("experience") ?? "");
    const date = String(f.get("date") ?? "");
    const prettyDate = date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";
    const lines = [
      kind === "booking" ? "*New Booking Request — Canopus Marine website*" : "*New Enquiry — Canopus Marine website*",
      "",
      `*Experience:* ${experience}`,
      `*Date:* ${prettyDate || date}`,
      `*Guests:* ${guestLine}`,
      ...(total ? [`*Total:* ₹${total.toLocaleString("en-IN")}`] : []),
      "",
      `*Name:* ${String(f.get("name") ?? "")}`,
      `*Phone:* ${String(f.get("phone") ?? "")}`,
      `*Email:* ${String(f.get("email") ?? "")}`,
      ...(notesText ? [`*Notes:* ${notesText}`] : []),
      "",
      kind === "booking" ? "Please confirm availability and share payment details." : "Please check availability and get back to me.",
    ];
    const message = lines.join("\n");
    openWhatsApp(message);
    trackLead("whatsapp", kind === "booking" ? "booking_form" : "booking_form_enquiry", { item_name: experience, value: total ?? undefined, guests: guestCount, booking_date: date });
    trackChatEvent("checkout_start", { experience, guests: guestCount, total: total ?? 0, via_chat: chatAttribution() === "chat", path: `booking_form_whatsapp_${kind}` });
    // Also keep a copy in the database when the server allows it (ignored if not configured).
    submitRequest({
      data: {
        experience,
        booking_date: date,
        guest_count: guestCount,
        name: String(f.get("name")),
        phone: String(f.get("phone")),
        email: String(f.get("email")),
        notes: `${notesText}${hasAgePricing ? `${notesText ? "\n" : ""}Guests: ${guestLine}` : ""}`,
        source: chatAttribution(),
      },
    }).catch(() => {});
    markChatConverted();
    setDone({ message, paid: false });
  }

  function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendToWhatsApp("booking");
  }

  if (done) {
    return (
      <div className="bg-card p-8 text-center shadow-lg">
        <CheckCircle className="mx-auto size-14 text-primary" />
        <h2 className="mt-5 text-2xl font-bold">{done.paid ? "Payment successful — booking confirmed" : "Almost done — send it on WhatsApp"}</h2>
        <p className="mt-3 text-muted-foreground">
          {done.paid ? "Thank you! Our team will contact you with your trip details." : "WhatsApp has opened with your details filled in — just press Send. Our team will confirm availability."}
        </p>
        <Button asChild size="lg" className="mt-6">
          <a href={whatsappLink(done.message)} target="_blank" rel="noreferrer" data-lead-skip>
            Open WhatsApp again
          </a>
        </Button>
      </div>
    );
  }

  return (
    <>
    <form ref={formRef} onSubmit={send} className={`relative grid gap-4 ${compact ? "" : "bg-card p-7 shadow-lg md:p-10"}`}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {lockedTitle ? (
        <input type="hidden" name="experience" value={lockedTitle} />
      ) : (
        <div>
          <label className="mb-2 block text-sm font-semibold">Experience</label>
          <select name="experience" value={sel} onChange={(e) => setSel(e.target.value)} required className="h-11 w-full rounded-md border border-input bg-background px-3">
            <option value="" disabled>
              Choose an experience
            </option>
            {experiences.map((x) => (
              <option key={x.slug} value={x.title}>
                {x.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className={`grid gap-4 ${hasAgePricing ? "" : "sm:grid-cols-2"}`}>
        <label className="text-sm font-semibold">
          Date
          <Input name="date" type="date" className="mt-2" required />
        </label>
        {hasAgePricing ? (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Guests</legend>
             <div className={`grid gap-2 ${hasChildRate ? "grid-cols-3" : "grid-cols-2"}`}>
              <label className="rounded-md border border-input bg-background p-3 text-sm font-semibold">
                 {hasChildRate ? "Adults" : "Guests"}
                 <span className="mt-1 block text-xs font-normal text-muted-foreground">{hasChildRate ? "12+" : "Age 3+"} · ₹{unit?.toLocaleString("en-IN")}</span>
                 <Input aria-label={hasChildRate ? "Adults, age 13 and above" : "Guests, age 3 and above"} type="number" min="1" max="200" value={adultsRaw} onChange={(e) => setAdultsRaw(e.target.value)} onBlur={() => setAdultsRaw(String(adults))} className="mt-2" />
              </label>
               {hasChildRate && <label className="rounded-md border border-input bg-background p-3 text-sm font-semibold">
                Children
                <span className="mt-1 block text-xs font-normal text-muted-foreground">4–12 · ₹{childUnit?.toLocaleString("en-IN")}</span>
                <Input aria-label="Children, ages 4 to 12" type="number" min="0" max="200" value={childrenRaw} onChange={(e) => setChildrenRaw(e.target.value)} onBlur={() => setChildrenRaw(String(children))} className="mt-2" />
               </label>}
              <label className="rounded-md border border-input bg-background p-3 text-sm font-semibold">
                Infants
                 <span className="mt-1 block text-xs font-normal text-muted-foreground">Below {hasChildRate ? "4" : "3"} · Free</span>
                 <Input aria-label="Infants, below age 3" type="number" min="0" max="200" value={infantsRaw} onChange={(e) => setInfantsRaw(e.target.value)} onBlur={() => setInfantsRaw(String(infants))} className="mt-2" />
              </label>
            </div>
          </fieldset>
        ) : (
          <label className="text-sm font-semibold">
            Guests
            <Input name="guests" type="number" min="1" max="200" value={guestsRaw} onChange={(e) => setGuestsRaw(e.target.value)} onBlur={() => setGuestsRaw(String(guests))} className="mt-2" required />
          </label>
        )}
      </div>
      <Input name="name" placeholder="Your name" required />
      <Input name="phone" type="tel" placeholder="Phone" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Textarea name="notes" placeholder="Notes or special requests" className="min-h-24" />
      {total && (
        <div className="rounded-md bg-muted p-3 text-sm">
           {hasAgePricing ? (
            <div className="mb-2 space-y-1 text-muted-foreground">
               <p>{hasChildRate ? "Adults" : "Guests age 3+"}: {adults} × ₹{unit?.toLocaleString("en-IN")}</p>
               {hasChildRate && <p>Children: {children} × ₹{childUnit?.toLocaleString("en-IN")}</p>}
              <p>Infants: {infants} × Free</p>
            </div>
          ) : unit ? (
            <p className="mb-1 text-muted-foreground">₹{unit.toLocaleString("en-IN")} × {guests}</p>
          ) : null}
          <p className="font-bold">Total: ₹{total.toLocaleString("en-IN")}</p>
          {chosen?.kind === "Combo" && <p className="mt-1 text-xs text-muted-foreground">{chosen.priceNote}</p>}
        </div>
      )}
      <Button type="button" size="lg" disabled={busy} onClick={() => sendToWhatsApp("booking")}>
        {total ? `Book ₹${total.toLocaleString("en-IN")} on WhatsApp` : "Book on WhatsApp"}
      </Button>
      <Button type="button" size="lg" variant="outline" disabled={busy} onClick={() => sendToWhatsApp("enquiry")}>
        Enquire on WhatsApp
      </Button>
      {status && (
        <p role="status" className="text-sm">
          {status}
        </p>
      )}
    </form>
    <Dialog open={added} onOpenChange={setAdded}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{chosen?.title} added to your cart</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Make a day of it — guests often pair this with:</p>
        <MiniSuggestions items={suggestFor(experiences, [chosen?.title ?? ""], chosen?.kind)} onPick={() => setAdded(false)} />
        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => setAdded(false)}>Continue browsing</Button>
          <Button asChild><Link to="/cart" onClick={() => setAdded(false)}>Go to cart & pay</Link></Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
