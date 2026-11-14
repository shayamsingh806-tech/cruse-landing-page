import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Ship, X, RotateCcw, LayoutList, ArrowRight, ShoppingCart, Pencil, Check, Minus, Plus, Lock, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createCartOrder, confirmCartBooking, recoverCartOrder } from "@/lib/payments.functions";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { images } from "@/lib/assets";
import { cart, guestPricingMode, hasAgePricing, itemTotal, useCart } from "@/lib/cart";
import { chatAttribution, chatSessionId, markChatConverted, markChatUsed, resetChatSession } from "@/lib/chat-attribution";
import { trackChatEvent } from "@/lib/chat-events";
import { experiences } from "@/lib/site-data";
import { useStickToBottomContext } from "use-stick-to-bottom";

// Keeps the conversation pinned to the newest message — whenever a message is
// sent or the assistant replies, the view jumps to the bottom.
function AutoScrollToLatest({ dep }: { dep: unknown }) {
  const { scrollToBottom } = useStickToBottomContext();
  useEffect(() => {
    scrollToBottom("instant");
  }, [dep, scrollToBottom]);
  return null;
}

const STORAGE_KEY = "canopus-chat-v1";
const CHAT_ID = "canopus-concierge";

const QUICK_PROMPTS = [
  "Which cruise is best for sunset?",
  "What watersports do you have?",
  "How do I book and pay?",
];

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const CRUISES = experiences.filter((x) => x.kind === "Cruise");
const ACTIVITIES = experiences.filter((x) => x.kind === "Activity");

function OptionGroup({
  label,
  items,
  onAsk,
}: {
  label: string;
  items: typeof CRUISES;
  onAsk: (title: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-1">
        {items.map((x) => (
          <div key={x.slug} className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 transition hover:bg-muted">
            <button
              type="button"
              onClick={() => onAsk(x.title)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-xs font-semibold">{x.title}</span>
              <span className="block text-[11px] text-muted-foreground">{x.price} · {x.duration}</span>
            </button>
            <Link
              to="/experiences/$slug"
              params={{ slug: x.slug }}
              aria-label={`Open ${x.title} page`}
              className="grid size-7 shrink-0 place-items-center rounded-md text-primary hover:bg-primary/10"
            >
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
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

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid size-5 place-items-center rounded border bg-background disabled:opacity-40"><Minus className="size-3" /></button>
      <span className="w-4 text-center text-[11px] font-bold">{value}</span>
      <button type="button" aria-label={`More ${label}`} disabled={value >= 50} onClick={() => onChange(value + 1)} className="grid size-5 place-items-center rounded border bg-background disabled:opacity-40"><Plus className="size-3" /></button>
    </div>
  );
}

const REF_KEY = "canopus-saved-cart-ref";
const PENDING_KEY = "canopus-chat-pending-order";

type PendingOrder = {
  orderId: string;
  items: { experience: string; booking_date: string; guest_count: number; adults?: number; children?: number; infants?: number }[];
  contact: { name: string; phone: string; email: string; notes: string; source: string };
  ref?: string;
};

function loadPending(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingOrder) : null;
  } catch { return null; }
}
function savePending(p: PendingOrder | null) {
  try {
    if (p) localStorage.setItem(PENDING_KEY, JSON.stringify(p));
    else localStorage.removeItem(PENDING_KEY);
  } catch { /* ignore */ }
}

function ChatCheckoutBar({ onCheckout }: { onCheckout: () => void }) {
  const items = useCart();
  const createOrder = useServerFn(createCartOrder);
  const confirm = useServerFn(confirmCartBooking);
  const recover = useServerFn(recoverCartOrder);
  const [editing, setEditing] = useState<string | null>(null);
  const [step, setStep] = useState<"cart" | "details">("cart");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [paid, setPaid] = useState(false);
  // "failed" = payment attempt failed/cancelled (no charge); "uncertain" = payment may
  // have gone through but confirmation didn't finish — retry must check first.
  const [failure, setFailure] = useState<null | { kind: "failed" | "uncertain"; text: string }>(null);
  const [pending, setPending] = useState<PendingOrder | null>(() => loadPending());

  if (paid) {
    return (
      <div className="border-t bg-muted/40 px-4 py-3 text-xs">
        <p className="flex items-center gap-1.5 font-bold text-primary"><CheckCircle2 className="size-4" /> Payment successful — you're booked!</p>
        <p className="mt-1 text-muted-foreground">A confirmation email is on its way. See you on the water.</p>
        <button type="button" onClick={() => setPaid(false)} className="mt-2 text-[11px] font-semibold text-primary underline">Close</button>
      </div>
    );
  }
  if (items.length === 0 && !pending) return null;

  const total = items.reduce((sum, it) => sum + (itemTotal(experiences.find((x) => x.slug === it.slug), it) ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);

  function finishSuccess() {
    savePending(null);
    setPending(null);
    try { localStorage.removeItem(REF_KEY); } catch { /* ignore */ }
    cart.clear();
    setStep("cart");
    setMsg("");
    setFailure(null);
    setPaid(true);
    markChatConverted();
  }

  // Before charging again, ask the server whether the previous order was already paid.
  // If it was, we finalize that booking — the guest is never charged twice.
  async function retry(p: PendingOrder) {
    setBusy(true);
    setMsg("Checking your previous payment…");
    try {
      const r = await recover({ data: { order_id: p.orderId, items: p.items, contact: p.contact, ...(p.ref ? { saved_ref: p.ref } : {}) } });
      if (r.paid) {
        finishSuccess();
        setBusy(false);
        return;
      }
    } catch {
      setBusy(false);
      setFailure({ kind: "uncertain", text: "We couldn't check your previous payment. Please call +91 99332 46262 before paying again — your money is safe." });
      return;
    }
    // Previous order was not paid — safe to start a fresh payment.
    setMsg("");
    openRazorpay(p);
  }

  function openRazorpay(p: PendingOrder) {
    setBusy(true);
    setMsg("Preparing secure payment…");
    void (async () => {
      try {
        const o = await createOrder({ data: { items: p.items } });
        const next = { ...p, orderId: o.orderId };
        savePending(next);
        setPending(next);
        if (!(await loadRzp()) || !window.Razorpay) throw new Error("load");
        setMsg("");
        const rzp = new window.Razorpay({
          key: o.keyId,
          amount: o.amount,
          currency: "INR",
          order_id: o.orderId,
          name: "Canopus Marine",
          description: `${p.items.length} experience(s)`,
          prefill: { name: p.contact.name, email: p.contact.email, contact: p.contact.phone },
          theme: { color: "#0C417B" },
          handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            setMsg("Confirming payment…");
            try {
              await confirm({ data: { order_id: r.razorpay_order_id, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature, items: p.items, contact: p.contact, ...(p.ref ? { saved_ref: p.ref } : {}) } });
              finishSuccess();
            } catch {
              setFailure({ kind: "uncertain", text: "Your payment may have gone through, but we couldn't confirm it here. Tap \"Check my payment\" — we will complete your booking without charging you again." });
            }
            setBusy(false);
          },
          modal: { ondismiss: () => { setBusy(false); setFailure({ kind: "failed", text: "Payment was cancelled — no money was taken. You can try again whenever you're ready." }); } },
        });
        (rzp as unknown as { on(event: string, cb: (resp: { error?: { description?: string } }) => void): void }).on("payment.failed", (resp) => {
          setBusy(false);
          const reason = resp?.error?.description;
          setFailure({ kind: "failed", text: `Payment failed${reason ? ` (${reason})` : ""} — no money was taken. Please try again or use a different payment method.` });
        });
        rzp.open();
      } catch {
        setBusy(false);
        setFailure({ kind: "failed", text: "Payment could not be started — please try again or call us on +91 99332 46262." });
      }
    })();
  }

  async function pay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return;
    const contact = { name: String(f.get("name")).trim(), phone: String(f.get("phone")).trim(), email: String(f.get("email")).trim(), notes: "Booked via chat assistant", source: chatAttribution() };
    const payload = items.map((i) => {
      const exp = experiences.find((x) => x.slug === i.slug);
      const agePriced = hasAgePricing(exp);
      return {
        experience: i.title,
        booking_date: i.date,
        guest_count: i.guests,
        ...(agePriced ? { adults: i.adults ?? i.guests, children: i.children ?? 0, infants: i.infants ?? 0 } : {}),
      };
    });
    let ref: string | undefined;
    try { ref = localStorage.getItem(REF_KEY) ?? undefined; } catch { /* ignore */ }
    setFailure(null);
    onCheckout();
    trackChatEvent("checkout_start", { items: payload.length, experiences: payload.map((p) => p.experience), total, via_chat: true, path: "chat" });
    // If an earlier attempt already has an order, check it before charging again.
    if (pending) {
      await retry({ ...pending, items: payload, contact, ...(ref ? { ref } : {}) });
      return;
    }
    openRazorpay({ orderId: "", items: payload, contact, ...(ref ? { ref } : {}) });
  }

  // Cart was cleared or reloaded while a payment was still being confirmed —
  // offer to check it instead of starting over.
  if (items.length === 0 && pending) {
    return (
      <div className="border-t bg-muted/40 px-4 py-3 text-xs">
        <p className="font-bold">You have a payment in progress</p>
        <p className="mt-1 text-muted-foreground">If you already paid, we'll confirm your booking without charging you again.</p>
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={busy} onClick={() => void retry(pending)} className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-60">{busy ? "Checking…" : "Check my payment"}</button>
          <button type="button" disabled={busy} onClick={() => { savePending(null); setPending(null); setFailure(null); }} className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold">Dismiss</button>
        </div>
        {failure && <p className="mt-1.5 text-[11px] text-destructive">{failure.text}</p>}
      </div>
    );
  }

  return (
    <div className="max-h-[55%] overflow-y-auto border-t bg-muted/40 px-4 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold">
          {step === "details" ? (
            <button type="button" onClick={() => setStep("cart")} aria-label="Back to cart" className="grid size-5 place-items-center rounded hover:bg-muted"><ChevronLeft className="size-3.5" /></button>
          ) : <ShoppingCart className="size-3.5 text-primary" />}
          {step === "details" ? "Secure payment" : `Your cart · ${items.length} item${items.length > 1 ? "s" : ""}`}
        </p>
        {total > 0 && <p className="text-xs font-bold text-primary">₹{total.toLocaleString("en-IN")}</p>}
      </div>

      {step === "cart" ? (
        <>
          <div className="mb-2 flex flex-col gap-1.5">
            {items.map((it) => {
              const exp = experiences.find((x) => x.slug === it.slug);
              const agePriced = hasAgePricing(exp);
               const hasChildRate = guestPricingMode(exp) === "child-rate";
              const setAge = (patch: Partial<typeof it>) => {
                const next = { ...it, ...patch };
                next.guests = (next.adults ?? 0) + (next.children ?? 0) + (next.infants ?? 0);
                cart.update(it.id, next);
              };
               const payingGuests = (it.adults ?? it.guests) + (it.children ?? 0);
              const isEditing = editing === it.id;
              return (
                <div key={it.id} className="rounded-md bg-background/70 px-2 py-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{it.title}</span>
                    <span className="shrink-0">{it.date} · {it.guests} guest{it.guests > 1 ? "s" : ""}</span>
                    <button type="button" onClick={() => setEditing(isEditing ? null : it.id)} aria-label={`Edit ${it.title}`} className="grid size-5 shrink-0 place-items-center rounded text-primary hover:bg-primary/10">
                      {isEditing ? <Check className="size-3" /> : <Pencil className="size-3" />}
                    </button>
                    <button type="button" onClick={() => cart.remove(it.id)} aria-label={`Remove ${it.title} from cart`} className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </div>
                  {isEditing && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <input type="date" aria-label="Date" value={it.date} min={today} onChange={(e) => e.target.value && cart.update(it.id, { date: e.target.value })} className="h-6 rounded border bg-background px-1 text-[11px]" />
                      {agePriced ? (
                        <>
                           <Stepper label={hasChildRate ? "Adults" : "Age 3+"} value={hasChildRate ? it.adults ?? 1 : payingGuests} min={1} onChange={(n) => setAge({ adults: n, ...(hasChildRate ? {} : { children: 0 }) })} />
                           {hasChildRate && <Stepper label="Kids" value={it.children ?? 0} min={0} onChange={(n) => setAge({ children: n })} />}
                           <Stepper label={hasChildRate ? "Infants <4" : "Infants <3"} value={it.infants ?? 0} min={0} onChange={(n) => setAge({ infants: n })} />
                        </>
                      ) : (
                        <Stepper label="Guests" value={it.guests} min={1} onChange={(n) => cart.update(it.id, { guests: n })} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => { setStep("details"); setMsg(""); }} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90">
            <Lock className="size-3.5" /> Pay securely here
          </button>
          <Link to="/cart" onClick={onCheckout} className="mt-1.5 block text-center text-[11px] font-semibold text-primary underline">Open full cart page</Link>
        </>
      ) : (
        <form onSubmit={pay} className="flex flex-col gap-1.5">
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <input name="name" required minLength={2} maxLength={100} placeholder="Full name" autoComplete="name" className="h-8 rounded-md border bg-background px-2 text-xs" />
          <input name="phone" required type="tel" pattern="[0-9+\- ]{7,20}" maxLength={20} placeholder="Phone (WhatsApp)" autoComplete="tel" className="h-8 rounded-md border bg-background px-2 text-xs" />
          <input name="email" required type="email" maxLength={255} placeholder="Email for confirmation" autoComplete="email" className="h-8 rounded-md border bg-background px-2 text-xs" />
          <button type="submit" disabled={busy} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            <Lock className="size-3.5" /> {busy ? "Please wait…" : `Pay ₹${total.toLocaleString("en-IN")}`}
          </button>
          <p className="text-center text-[10px] text-muted-foreground">Secured by Razorpay · UPI, cards & netbanking</p>
        </form>
      )}
      {failure && (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2">
          <p className="text-[11px] font-semibold text-destructive">{failure.text}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {failure.kind === "uncertain" && pending ? (
              <button type="button" disabled={busy} onClick={() => { setFailure(null); void retry(pending); }} className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-60">
                {busy ? "Checking…" : "Check my payment"}
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={() => { setFailure(null); if (pending) void retry(pending); }} className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-60">
                {busy ? "Please wait…" : "Retry payment"}
              </button>
            )}
            <a href="tel:+919933246262" className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold">Call us</a>
          </div>
        </div>
      )}
      {msg && <p className="mt-1.5 text-center text-[11px] text-muted-foreground">{msg}</p>}
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat", body: () => ({ sessionId: chatSessionId() }) }));
  const { messages, setMessages, sendMessage, status, stop } = useChat({
    id: CHAT_ID,
    transport: transport.current,
    messages: loadMessages(),
    onError: (e) => setError(e.message || "Something went wrong. Please try again or call +91 99332 46262."),
  });
  const busy = status === "submitted" || status === "streaming";

  // Persist the single conversation in this browser.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage full or unavailable — chat still works for the session */
    }
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    setError(null);
    markChatUsed();
    trackChatEvent("chat_message", { length: text.trim().length });
    sendMessage({ text: text.trim() });
  };

  const askAbout = (title: string) => {
    setShowOptions(false);
    send(`Tell me about the ${title} — price, timing, what's included and how to book it.`);
  };

  const toggleOpen = () => {
    setOpen((v) => {
      if (!v) trackChatEvent("chat_open", { returning: messages.length > 0 });
      return !v;
    });
  };

  // Track clicks on links the assistant recommends (experience pages, booking, cart).
  const onConversationClick = (e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") ?? "";
    trackChatEvent("recommendation_click", { href, text: anchor.textContent?.slice(0, 80) ?? "" });
  };

  const reset = () => {
    stop();
    setMessages([]);
    resetChatSession();
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Floating launcher — sits above the WhatsApp button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={open ? "Close booking assistant" : "Open booking assistant"}
        className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <Ship className="size-6" />}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-40 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[26rem]">
          <div className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <img src={images.logo} alt="" className="h-9 w-auto rounded bg-card p-1" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold leading-tight">Canopus Booking Assistant</p>
              <p className="text-xs text-primary-foreground/75">Ask about cruises, activities & checkout</p>
            </div>
            <button
              type="button"
              onClick={() => setShowOptions((v) => !v)}
              aria-label="Browse cruises and activities"
              title="Browse cruises and activities"
              className={`grid size-8 place-items-center rounded-md hover:bg-primary-foreground/10 ${showOptions ? "bg-primary-foreground/15" : ""}`}
            >
              <LayoutList className="size-4" />
            </button>
            <button type="button" onClick={reset} aria-label="Start a new conversation" title="Start a new conversation" className="grid size-8 place-items-center rounded-md hover:bg-primary-foreground/10">
              <RotateCcw className="size-4" />
            </button>
          </div>

          <Conversation className="min-h-0 flex-1" resize="instant" onClick={onConversationClick}>
            <AutoScrollToLatest dep={`${messages.length}-${status}-${open}-${messageText(messages[messages.length - 1] ?? { id: "", role: "user", parts: [] }).length}`} />
            <ConversationContent className="gap-4 p-4">
              {messages.length === 0 && (
                <ConversationEmptyState
                  icon={<img src={images.logo} alt="Canopus Marine" className="h-14 w-auto" />}
                  title="Planning your Andaman trip?"
                  description="I can help you pick cruises and activities, explain prices, and walk you through booking and payment."
                />
              )}
              {messages.map((m) => {
                const text = messageText(m);
                if (!text) return null;
                return (
                  <Message key={m.id} from={m.role}>
                    <MessageContent
                      className={
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent p-0 text-foreground"
                      }
                    >
                      {m.role === "assistant" ? <MessageResponse>{text}</MessageResponse> : text}
                    </MessageContent>
                  </Message>
                );
              })}
              {status === "submitted" && <Shimmer className="text-sm">Thinking…</Shimmer>}
              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {(showOptions || messages.length === 0) && (
            <div className="max-h-56 overflow-y-auto border-t px-4 py-3">
              <div className="flex flex-col gap-3">
                <OptionGroup label="Cruises" items={CRUISES} onAsk={askAbout} />
                <OptionGroup label="Activities" items={ACTIVITIES} onAsk={askAbout} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Tap an option to ask about it, or the arrow to open its page.</p>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 border-t px-4 pt-3">
              {QUICK_PROMPTS.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} className="rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted">
                  {q}
                </button>
              ))}
            </div>
          )}

          <ChatCheckoutBar
            onCheckout={() => {
              trackChatEvent("recommendation_click", { href: "/cart", text: "Proceed to checkout (chat)" });
              setOpen(false);
            }}
          />

          <div className="border-t p-3">
            <PromptInput onSubmit={(msg) => send(msg.text)}>
              <PromptInputTextarea placeholder="Ask about packages, prices, booking…" autoFocus disabled={busy} />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} onStop={stop} disabled={busy && status !== "streaming"} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </>
  );
}
