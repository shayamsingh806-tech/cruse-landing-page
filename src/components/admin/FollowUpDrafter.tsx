import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Mail, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { draftFollowUp } from "@/lib/followup.functions";

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

type BookingRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  booking_date: string;
  guest_count: number;
  notes: string | null;
};

export function FollowUpDrafter() {
  const draft = useServerFn(draftFollowUp);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [f, setF] = useState({
    guestName: "", experience: "", tripDate: "", guests: "", highlights: "", offer: "",
    channel: "email" as "email" | "whatsapp", tone: "warm" as "warm" | "professional" | "playful",
    contact: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    supabase
      .from("bookings")
      .select("id, name, email, phone, experience, booking_date, guest_count, notes")
      .order("booking_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setBookings((data as BookingRow[]) ?? []));
  }, []);

  const fillFromBooking = (id: string) => {
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    setF({
      ...f,
      guestName: b.name,
      experience: b.experience,
      tripDate: b.booking_date,
      guests: `${b.guest_count} guest${b.guest_count === 1 ? "" : "s"}`,
      highlights: b.notes ?? "",
      contact: f.channel === "email" ? b.email : b.phone,
    });
  };

  async function go() {
    setBusy(true); setErr("");
    try {
      const { contact: _c, ...data } = f;
      const r = await draft({ data });
      setMsg(r.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not draft the message.");
    } finally { setBusy(false); }
  }

  const subjectMatch = msg.match(/^Subject:\s*(.+)\n+/);
  const mailto = `mailto:${encodeURIComponent(f.contact)}?subject=${encodeURIComponent(subjectMatch?.[1] ?? "Thank you from Canopus Marine")}&body=${encodeURIComponent(subjectMatch ? msg.slice(subjectMatch[0].length) : msg)}`;
  const wa = `https://wa.me/${f.contact.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-2">
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-display text-xl font-bold">Post-trip follow-up</h2>
        <p className="text-sm text-muted-foreground">Enter the guest's trip details and AI drafts a personal thank-you message you can edit and send.</p>
        <select className={sel} defaultValue="" onChange={(e) => fillFromBooking(e.target.value)}>
          <option value="" disabled>Fill from a saved booking…</option>
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} — {b.experience} · {b.booking_date}
            </option>
          ))}
        </select>
        <Input placeholder="Guest name *" value={f.guestName} onChange={set("guestName")} />
        <Input placeholder="Experience (e.g. Sunset Cruise) *" value={f.experience} onChange={set("experience")} />
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={f.tripDate} onChange={set("tripDate")} />
          <Input placeholder="Group (e.g. couple, family of 4)" value={f.guests} onChange={set("guests")} />
        </div>
        <Textarea rows={4} placeholder="Trip notes — anniversary, saw dolphins, first-time snorkeller…" value={f.highlights} onChange={set("highlights")} />
        <Input placeholder="Offer to include (optional)" value={f.offer} onChange={set("offer")} />
        <div className="grid grid-cols-2 gap-3">
          <select className={sel} value={f.channel} onChange={set("channel")}>
            <option value="email">Email</option><option value="whatsapp">WhatsApp</option>
          </select>
          <select className={sel} value={f.tone} onChange={set("tone")}>
            <option value="warm">Warm</option><option value="professional">Professional</option><option value="playful">Playful</option>
          </select>
        </div>
        <Button onClick={go} disabled={busy || !f.guestName.trim() || !f.experience.trim()}>
          <Sparkles className="size-4" /> {busy ? "Drafting…" : msg ? "Redraft" : "Draft message"}
        </Button>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </div>
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <h3 className="font-semibold">Draft</h3>
        <Textarea rows={14} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Your drafted message will appear here." />
        {msg && (
          <>
            <Input placeholder={f.channel === "email" ? "Guest email" : "Guest WhatsApp number with country code"} value={f.contact} onChange={set("contact")} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(msg)}><Copy className="size-4" /> Copy</Button>
              {f.channel === "email"
                ? <Button asChild variant="outline"><a href={mailto}><Mail className="size-4" /> Open in email</a></Button>
                : <Button asChild variant="outline"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Open in WhatsApp</a></Button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
