import { ExperienceLink } from "@/components/site/ExperienceLink";
import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle, Link2, Mail, Trash2 } from "lucide-react";
import { seo } from "@/lib/seo";
import { HeroBanner, SectionHeading } from "@/components/site/sections";
import { MiniSuggestions } from "@/components/site/CartBits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useExperiences } from "@/lib/use-experiences";
import { createSavedCart, trackSavedCartOpen } from "@/lib/saved-carts.functions";
import { cart, decodeSavedCart, encodeCart, guestPricingMode, hasAgePricing, itemTotal, suggestFor, useCart } from "@/lib/cart";
import { createCartOrder, confirmCartBooking } from "@/lib/payments.functions";
import { chatAttribution, markChatConverted } from "@/lib/chat-attribution";
import { trackChatEvent } from "@/lib/chat-events";

export const Route = createFileRoute("/cart")({
  validateSearch: (s: Record<string, unknown>): { saved?: string; ref?: string } => ({
    ...(typeof s["saved"] === "string" ? { saved: s["saved"] } : {}),
    ...(typeof s["ref"] === "string" ? { ref: s["ref"] } : {}),
  }),
  head: () =>
    seo("/cart", [
      { title: "Your Trip Cart | Canopus Marine" },
      { name: "description", content: "Review your selected Andaman cruises and activities and pay for them together in one checkout." },
      { property: "og:title", content: "Your Trip Cart | Canopus Marine" },
      { property: "og:description", content: "Book several Canopus Marine cruises and watersports in a single payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ]),
  component: Page,
});

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

const REF_KEY = "canopus-saved-cart-ref";
function savedRef(): string | undefined {
  try { return localStorage.getItem(REF_KEY) ?? undefined; } catch { return undefined; }
}

function Page() {
  const items = useCart();
  const all = useExperiences();
  const navigate = useNavigate();
  const { saved, ref } = Route.useSearch();
  const createOrder = useServerFn(createCartOrder);
  const confirm = useServerFn(confirmCartBooking);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [savedLink, setSavedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const createSaved = useServerFn(createSavedCart);
  const trackOpen = useServerFn(trackSavedCartOpen);

  // Restore a cart shared via a "saved" link, record the open, then strip the params.
  useEffect(() => {
    if (!saved) return;
    const restored = decodeSavedCart(saved);
    const n = cart.merge(restored);
    setStatus(n ? `Restored ${n} saved experience(s) to your cart.` : "That saved cart is already here or could not be read.");
    if (ref && /^[0-9a-f-]{36}$/i.test(ref)) {
      try { localStorage.setItem(REF_KEY, ref); } catch { /* ignore */ }
      trackOpen({ data: { id: ref } }).catch(() => {});
    }
    navigate({ to: "/cart", search: () => ({}), replace: true });
  }, [saved, ref, navigate, trackOpen]);

  async function saveForLater() {
    let refPart = "";
    try {
      const r = await createSaved({ data: { items: items.map(({ id: _id, slug: _s, ...rest }) => rest) } });
      if (r.id) refPart = `&ref=${r.id}`;
    } catch { /* link still works without tracking */ }
    const link = `${window.location.origin}/cart?saved=${encodeCart(items)}${refPart}`;
    setSavedLink(link);
    setCopied(false);
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(savedLink);
      setCopied(true);
    } catch {
      window.prompt("Copy your cart link:", savedLink);
    }
  }

  const lines = items.map((it) => ({ it, exp: all.find((x) => x.title === it.title), total: itemTotal(all.find((x) => x.title === it.title), it) ?? 0 }));
  const grand = lines.reduce((a, l) => a + l.total, 0);
  const suggestions = suggestFor(all, items.map((i) => i.title), lines[0]?.exp?.kind);

  async function pay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return;
    const contact = { name: String(f.get("name")), phone: String(f.get("phone")), email: String(f.get("email")), notes: String(f.get("notes") ?? ""), source: chatAttribution() };
    const payload = items.map((i) => {
      const exp = all.find((x) => x.title === i.title);
      const agePriced = hasAgePricing(exp);
      return {
        experience: i.title,
        booking_date: i.date,
        guest_count: i.guests,
        ...(agePriced ? { adults: i.adults ?? i.guests, children: i.children ?? 0, infants: i.infants ?? 0 } : {}),
      };
    });
    setBusy(true);
    setStatus("Preparing payment…");
    trackChatEvent("checkout_start", { items: payload.length, experiences: payload.map((p) => p.experience), total: grand, via_chat: contact.source === "chat", path: "cart" });
    try {
      const o = await createOrder({ data: { items: payload } });
      if (!(await loadRzp()) || !window.Razorpay) throw new Error("load");
      setStatus("");
      new window.Razorpay({
        key: o.keyId,
        amount: o.amount,
        currency: "INR",
        order_id: o.orderId,
        name: "Canopus Marine",
        description: `${items.length} experience(s)`,
        prefill: { name: contact.name, email: contact.email, contact: contact.phone },
        theme: { color: "#0C417B" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setStatus("Confirming payment…");
          try {
            await confirm({ data: { order_id: r.razorpay_order_id, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature, items: payload, contact, ...(savedRef() ? { saved_ref: savedRef() } : {}) } });
            try { localStorage.removeItem(REF_KEY); } catch { /* ignore */ }
            cart.clear();
            markChatConverted();
            setDone(true);
          } catch {
            setStatus("Payment received but confirmation failed — please call us, your money is safe.");
          }
          setBusy(false);
        },
        modal: { ondismiss: () => { setBusy(false); setStatus("Payment cancelled — you can try again."); } },
      }).open();
    } catch {
      setBusy(false);
      setStatus("Payment could not be started — please try again or call us.");
    }
  }

  return (
    <>
      <HeroBanner title="Your Trip Cart" eyebrow="Canopus Marine" />
      <section className="py-16">
        <div className="mx-auto max-w-[1100px] px-6">
          {done ? (
            <div className="bg-card p-10 text-center shadow-lg">
              <CheckCircle className="mx-auto size-14 text-primary" />
              <h2 className="mt-5 text-2xl font-bold">Payment successful — all bookings confirmed</h2>
              <p className="mt-3 text-muted-foreground">Confirmation emails are on their way. Our team will contact you with trip details.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-card p-10 text-center shadow-lg">
              <h2 className="text-2xl font-bold">Your cart is empty</h2>
              <p className="mt-3 text-muted-foreground">Pick a cruise or activity, choose a date and tap “Add to cart”.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild><Link to="/cruises">Browse cruises</Link></Button>
                <Button asChild variant="outline"><Link to="/activities">Browse activities</Link></Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
              <div className="grid h-fit gap-4">
                {lines.map(({ it, exp, total }) => {
                  const agePriced = hasAgePricing(exp);
                   const pricingMode = guestPricingMode(exp);
                   const hasChildRate = pricingMode === "child-rate";
                  const num = (v: string, min: number) => {
                    const n = parseInt(v, 10);
                    return Number.isFinite(n) && n >= min ? n : min;
                  };
                  const setGuests = (patch: Partial<typeof it>) => {
                    const next = { ...it, ...patch };
                    if (agePriced) next.guests = (next.adults ?? 0) + (next.children ?? 0) + (next.infants ?? 0);
                    cart.update(it.id, next);
                  };
                   const payingGuests = (it.adults ?? it.guests) + (it.children ?? 0);
                  return (
                    <div key={it.id} className="flex gap-4 bg-card p-4 shadow">
                      {exp?.image && <img src={exp.image} alt={exp.alt} className="size-24 shrink-0 rounded object-cover" />}
                      <div className="flex-1">
                        <p className="text-xs uppercase text-muted-foreground">{exp?.kind}</p>
                        <ExperienceLink slug={it.slug} className="text-lg font-bold hover:text-primary">{it.title}</ExperienceLink>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1 text-xs text-muted-foreground">
                            Date
                            <Input type="date" value={it.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => e.target.value && cart.update(it.id, { date: e.target.value })} />
                          </label>
                          {agePriced ? (
                            <div className={`grid gap-2 ${hasChildRate ? "grid-cols-3" : "grid-cols-2"}`}>
                              <label className="grid gap-1 text-xs text-muted-foreground">
                                {hasChildRate ? "Adults" : "Guests age 3+"}
                                <Input type="number" min={1} value={hasChildRate ? it.adults ?? it.guests : payingGuests} onChange={(e) => setGuests({ adults: num(e.target.value, 1), ...(hasChildRate ? {} : { children: 0 }) })} />
                              </label>
                              {hasChildRate && <label className="grid gap-1 text-xs text-muted-foreground">
                                Children
                                <Input type="number" min={0} value={it.children ?? 0} onChange={(e) => setGuests({ children: num(e.target.value, 0) })} />
                              </label>}
                              <label className="grid gap-1 text-xs text-muted-foreground">
                                Infants below 3
                                <Input type="number" min={0} value={it.infants ?? 0} onChange={(e) => setGuests({ infants: num(e.target.value, 0) })} />
                              </label>
                            </div>
                          ) : (
                            <label className="grid gap-1 text-xs text-muted-foreground">
                              Guests
                              <Input type="number" min={1} value={it.guests} onChange={(e) => cart.update(it.id, { guests: num(e.target.value, 1) })} />
                            </label>
                          )}
                        </div>
                        <p className="mt-2 font-bold">₹{total.toLocaleString("en-IN")}</p>
                        {exp?.kind === "Combo" && <p className="mt-1 text-xs text-muted-foreground">{exp.priceNote}</p>}
                      </div>
                      <Button variant="ghost" size="icon" aria-label={`Remove ${it.title}`} onClick={() => cart.remove(it.id)}><Trash2 /></Button>
                    </div>
                  );
                })}
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild variant="outline" className="w-fit"><Link to="/activities">+ Add more experiences</Link></Button>
                  <Button type="button" variant="outline" className="w-fit" onClick={saveForLater}>Save cart for later</Button>
                </div>
                {savedLink && (
                  <div className="grid gap-2 rounded-md bg-muted p-4 text-sm">
                    <p className="font-semibold">Your cart is saved. Keep this link to return to it anytime, from any device:</p>
                    <p className="break-all text-muted-foreground">{savedLink}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={copyLink}><Link2 className="size-4" /> {copied ? "Copied!" : "Copy link"}</Button>
                      <Button type="button" size="sm" variant="secondary" asChild>
                        <a href={`mailto:?subject=${encodeURIComponent("My Canopus Marine trip cart")}&body=${encodeURIComponent(`Here is my saved trip cart. Open this link to return to it:\n\n${savedLink}`)}`}><Mail className="size-4" /> Email me the link</a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={pay} className="relative grid h-fit gap-4 bg-card p-6 shadow-lg">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                <h2 className="text-xl font-bold">Your details</h2>
                <Input name="name" placeholder="Your name" required />
                <Input name="phone" type="tel" placeholder="Phone" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Textarea name="notes" placeholder="Notes or special requests" className="min-h-20" />
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="text-muted-foreground">{items.length} experience(s)</p>
                  <p className="text-lg font-bold">Total: ₹{grand.toLocaleString("en-IN")}</p>
                </div>
                <Button size="lg" disabled={busy || !grand}>Pay ₹{grand.toLocaleString("en-IN")} & Book All</Button>
                {status && <p role="status" className="text-sm">{status}</p>}
              </form>
            </div>
          )}

          {!done && suggestions.length > 0 && (
            <div className="mt-16">
              <SectionHeading kicker="Make a Day of It" title="Add These to Your Trip" />
              <div className="mt-8"><MiniSuggestions items={suggestions} /></div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
