import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowUpDrafter } from "@/components/admin/FollowUpDrafter";
import { AssistantLearning } from "@/components/admin/AssistantLearning";
import {
  deleteExperience,
  getSiteContent,
  listAllExperiences,
  setSiteContent,
  upsertExperience,
  type ExperienceRow,
} from "@/lib/content.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Lead Dashboard | Canopus Marine" },
      { name: "description", content: "Staff dashboard for tracking Canopus Marine bookings and enquiries." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Lead Dashboard | Canopus Marine" },
      { property: "og:description", content: "Staff dashboard for tracking leads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const STATUSES = ["new", "contacted", "confirmed", "lost"] as const;
const statusStyle: Record<string, string> = {
  new: "bg-sun text-sun-foreground",
  contacted: "bg-ocean-light text-primary",
  confirmed: "bg-primary text-primary-foreground",
  lost: "bg-muted text-muted-foreground",
};

type Source = "bookings" | "enquiries" | "contact_messages";
type Lead = {
  id: string;
  source: Source;
  created_at: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  detail: string;
  message: string | null;
  viaChat?: boolean;
};

const sourceLabel: Record<Source, string> = {
  bookings: "Booking",
  enquiries: "Group enquiry",
  contact_messages: "Contact form",
};

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return setIsAdmin(null);
    supabase.rpc("claim_first_admin").then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const signIn = async () => {
    await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/admin` });
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!ready) return <Center>Loading…</Center>;

  if (!user)
    return (
      <Center>
        <h1 className="font-display text-3xl font-bold text-primary">Canopus Marine Staff</h1>
        <p className="mt-2 text-muted-foreground">Sign in to view and manage your leads.</p>
        <Button size="lg" className="mt-6" onClick={signIn}>Sign in with Google</Button>
        <Link to="/" className="mt-6 text-sm text-muted-foreground underline">Back to website</Link>
      </Center>
    );

  if (isAdmin === null) return <Center>Checking access…</Center>;

  if (!isAdmin)
    return (
      <Center>
        <h1 className="font-display text-2xl font-bold text-primary">No access yet</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          You're signed in as {user.email}. Ask an existing admin to add this email in the Team section.
        </p>
        <Button variant="outline" className="mt-6" onClick={signOut}>Sign out</Button>
      </Center>
    );

  return <Dashboard email={user.email ?? ""} onSignOut={signOut} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">{children}</main>;
}

function Dashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<"leads" | "experiences" | "content" | "saved" | "followup" | "learning" | "visitors">("leads");
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-[3px] border-sun bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="font-display text-xl font-bold">Canopus Marine · Dashboard</p>
            <p className="text-xs opacity-80">{email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outlineLight" size="sm" onClick={onSignOut}><LogOut className="size-4" /> Sign out</Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {([["leads", "Leads"], ["experiences", "Experiences"], ["content", "Page Content"], ["saved", "Saved Carts"], ["followup", "Follow-ups"], ["learning", "Assistant Learning"], ["visitors", "Visitors"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === v ? "bg-sun text-sun-foreground" : "bg-primary-foreground/10 hover:bg-primary-foreground/20"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      {tab === "leads" && <LeadsPanel />}
      {tab === "experiences" && <ExperienceManager />}
      {tab === "content" && <ContentEditor />}
      {tab === "saved" && <SavedCartsPanel />}
      {tab === "followup" && <FollowUpDrafter />}
      {tab === "learning" && <AssistantLearning />}
      {tab === "visitors" && <VisitorsPanel />}
    </div>
  );
}

function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    const [b, e, c, ev] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("chat_events").select("event_type"),
    ]);
    const fc: Record<string, number> = {};
    (ev.data ?? []).forEach((r) => { fc[r.event_type] = (fc[r.event_type] ?? 0) + 1; });
    setFunnel(fc);
    const all: Lead[] = [
      ...(b.data ?? []).map((r) => ({
        id: r.id, source: "bookings" as const, created_at: r.created_at, status: r.status,
        name: r.name, email: r.email, phone: r.phone, type: r.experience,
        viaChat: (r as { source?: string }).source === "chat",
        detail: `${r.booking_date} · ${r.guest_count} guests${(r as { payment_status?: string }).payment_status === "paid" ? ` · PAID ₹${(((r as { amount_paise?: number }).amount_paise ?? 0) / 100).toLocaleString("en-IN")}` : ""}`, message: r.notes,
      })),
      ...(e.data ?? []).map((r) => ({
        id: r.id, source: "enquiries" as const, created_at: r.created_at, status: r.status,
        name: `${r.first_name} ${r.last_name}`, email: r.email, phone: r.phone, type: r.enquiry_type,
        detail: `${r.requested_date ?? "No date"} · ${r.guest_count} guests`, message: r.message,
      })),
      ...(c.data ?? []).map((r) => ({
        id: r.id, source: "contact_messages" as const, created_at: r.created_at, status: r.status,
        name: r.name, email: r.email, phone: r.phone, type: r.subject, detail: "", message: r.message,
      })),
    ].sort((a, z) => z.created_at.localeCompare(a.created_at));
    setLeads(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (lead: Lead, status: string) => {
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    await supabase.from(lead.source).update({ status }).eq("id", lead.id);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length };
    STATUSES.forEach((s) => (c[s] = leads.filter((l) => l.status === s).length));
    return c;
  }, [leads]);

  // Chatbot attribution: bookings placed by visitors who used the assistant.
  const chatStats = useMemo(() => {
    const bookings = leads.filter((l) => l.source === "bookings");
    const viaChat = bookings.filter((l) => l.viaChat);
    const paid = viaChat.filter((l) => l.detail.includes("PAID"));
    const revenue = paid.reduce((sum, l) => sum + (Number(l.detail.match(/PAID ₹([\d,]+)/)?.[1]?.replace(/,/g, "")) || 0), 0);
    return { total: bookings.length, chat: viaChat.length, paid: paid.length, revenue };
  }, [leads]);

  const shown = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  return (
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="size-4" /> Refresh</Button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {(["all", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-xl border p-4 text-left transition ${filter === s ? "border-primary ring-2 ring-primary" : "bg-card"}`}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s === "all" ? "All leads" : s}</p>
              <p className="font-display text-3xl font-bold text-primary">{counts[s] ?? 0}</p>
            </button>
          ))}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Booking assistant conversions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Bookings from visitors who chatted with the assistant before booking.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Total bookings</p><p className="font-display text-2xl font-bold text-primary">{chatStats.total}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Via assistant</p><p className="font-display text-2xl font-bold text-primary">{chatStats.chat}{chatStats.total > 0 && <span className="ml-1 text-sm font-normal text-muted-foreground">({Math.round((chatStats.chat / chatStats.total) * 100)}%)</span>}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Paid via assistant</p><p className="font-display text-2xl font-bold text-primary">{chatStats.paid}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue via assistant</p><p className="font-display text-2xl font-bold text-primary">₹{chatStats.revenue.toLocaleString("en-IN")}</p></div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Assistant funnel</h2>
          <p className="mt-1 text-sm text-muted-foreground">Where visitors drop off between opening the assistant and completing a booking.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {([
              ["chat_open", "Opened assistant"],
              ["chat_message", "Sent a message"],
              ["recommendation_click", "Clicked a recommendation"],
              ["checkout_start", "Started checkout"],
            ] as const).map(([key, label], i, arr) => {
              const n = funnel[key] ?? 0;
              const prev = i > 0 ? (funnel[arr[i - 1]?.[0] ?? ""] ?? 0) : 0;
              return (
                <div key={key}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="font-display text-2xl font-bold text-primary">{n}</p>
                  {i > 0 && prev > 0 && <p className="text-xs text-muted-foreground">{Math.round((n / prev) * 100)}% of previous step</p>}
                </div>
              );
            })}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Booked</p>
              <p className="font-display text-2xl font-bold text-primary">{chatStats.total}</p>
              {(funnel["checkout_start"] ?? 0) > 0 && <p className="text-xs text-muted-foreground">{Math.round((chatStats.total / (funnel["checkout_start"] ?? 1)) * 100)}% of checkouts</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Abandoned checkout</p>
              <p className="font-display text-2xl font-bold text-destructive">{Math.max(0, (funnel["checkout_start"] ?? 0) - chatStats.total)}</p>
              {(funnel["checkout_start"] ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {Math.round((Math.max(0, (funnel["checkout_start"] ?? 0) - chatStats.total) / (funnel["checkout_start"] ?? 1)) * 100)}% abandonment rate
                </p>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Abandoned checkout = visitors who started checkout but never completed a booking.</p>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {STATUSES.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Received</th><th className="p-3">Name</th><th className="p-3">Contact</th>
                <th className="p-3">Source</th><th className="p-3">Interest</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && shown.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No leads here yet.</td></tr>}
              {shown.map((l) => (
                <Fragment key={l.id}>
                  <tr key={l.id} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => setOpen(open === l.id ? null : l.id)}>
                    <td className="whitespace-nowrap p-3">{new Date(l.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="p-3 font-semibold">{l.name}</td>
                    <td className="p-3"><div>{l.phone}</div><div className="text-muted-foreground">{l.email}</div></td>
                    <td className="p-3">{sourceLabel[l.source]}{l.viaChat && <span className="ml-2 rounded-full bg-ocean-light px-2 py-0.5 text-xs font-semibold text-primary">via Assistant</span>}</td>
                    <td className="p-3"><div>{l.type}</div><div className="text-muted-foreground">{l.detail}</div></td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <select value={l.status} onChange={(e) => updateStatus(l, e.target.value)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle[l.status] ?? ""}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                  {open === l.id && (
                    <tr key={`${l.id}-d`} className="bg-muted/30">
                      <td colSpan={6} className="p-4">
                        <p className="whitespace-pre-wrap">{l.message || "No message."}</p>
                        <div className="mt-3 flex gap-3 text-sm">
                          {l.phone && <a className="text-primary underline" href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                          {l.phone && <a className="text-primary underline" href={`tel:${l.phone}`}>Call</a>}
                          <a className="text-primary underline" href={`mailto:${l.email}`}>Email</a>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <Team />
      </main>
  );
}

function Team() {
  const [admins, setAdmins] = useState<{ user_id: string; email: string }[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => supabase.rpc("list_admins").then(({ data }) => setAdmins(data ?? []));
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.rpc("add_admin_by_email", { _email: email });
    if (error) setMsg("Could not add this person.");
    else if (data === "not_found") setMsg("This person needs to sign in once at this page with Google first.");
    else { setMsg("Added."); setEmail(""); load(); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.rpc("remove_admin", { _user_id: id });
    if (error) setMsg(error.message); else load();
  };

  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="font-display text-xl font-bold text-primary">Team</h2>
      <p className="text-sm text-muted-foreground">Staff who can see leads. New staff sign in here once with Google, then you add their email.</p>
      <ul className="mt-4 divide-y">
        {admins.map((a) => (
          <li key={a.user_id} className="flex items-center justify-between py-2 text-sm">
            {a.email}
            <button onClick={() => remove(a.user_id)} aria-label={`Remove ${a.email}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex max-w-md gap-2">
        <Input type="email" required placeholder="staff@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
    </section>
  );
}

// ---------- Experiences manager ----------

type Draft = Omit<ExperienceRow, "id"> & { id?: string };

const emptyDraft: Draft = {
  slug: "", title: "", full_title: null, kind: "Activity", category: "Adventure",
  image: "", alt: "", location: "", timing: "", duration: "", price: "", price_note: null,
  limits: "", overview: "", reporting: null, inclusions: null, exclusions: null, add_ons: null,
  sort_order: 100, hidden: false,
};

function ExperienceManager() {
  const [rows, setRows] = useState<ExperienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listAllExperiences());
    } catch {
      setMsg("Could not load experiences.");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (r: ExperienceRow) => {
    if (!window.confirm(`Delete "${r.title}" permanently? Its page will disappear from the website.`)) return;
    await deleteExperience({ data: { id: r.id } });
    load();
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Experiences</h2>
          <p className="text-sm text-muted-foreground">Edit prices, timings, text and photos for every cruise and activity. Changes go live on the website immediately.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="size-4" /> Refresh</Button>
          <Button size="sm" onClick={() => setEditing({ ...emptyDraft })}><Plus className="size-4" /> Add new</Button>
        </div>
      </div>
      {msg && <p className="text-sm text-destructive">{msg}</p>}

      {editing && <ExperienceForm draft={editing} onClose={(saved) => { setEditing(null); if (saved) load(); }} />}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Title</th><th className="p-3">Kind</th><th className="p-3">Price</th><th className="p-3">Timing</th><th className="p-3">Visible</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-semibold">{r.title}<div className="text-xs font-normal text-muted-foreground">/{r.slug}</div></td>
                <td className="p-3">{r.kind}</td>
                <td className="p-3">{r.price}</td>
                <td className="p-3">{r.timing}</td>
                <td className="p-3">{r.hidden ? "Hidden" : "Live"}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button aria-label={`Edit ${r.title}`} onClick={() => setEditing({ ...r })} className="rounded p-1.5 text-primary hover:bg-muted"><Pencil className="size-4" /></button>
                    <button aria-label={`Delete ${r.title}`} onClick={() => remove(r)} className="rounded p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function ExperienceForm({ draft, onClose }: { draft: Draft; onClose: (saved: boolean) => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const listToText = (a: string[] | null) => (a ?? []).join("\n");
  const textToList = (s: string) => { const v = s.split("\n").map((x) => x.trim()).filter(Boolean); return v.length ? v : null; };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await upsertExperience({ data: { ...d, full_title: d.full_title || null, price_note: d.price_note || null, reporting: d.reporting || null } });
      onClose(true);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not save. Check the fields and try again.");
    }
    setSaving(false);
  };

  const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border-2 border-primary bg-card p-6">
      <h3 className="font-display text-xl font-bold text-primary">{d.id ? `Edit: ${d.title}` : "New experience"}</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold">Title<Input className="mt-1" value={d.title} onChange={(e) => set("title", e.target.value)} required /></label>
        <label className="text-sm font-semibold">Web address slug<Input className="mt-1" value={d.slug} onChange={(e) => set("slug", e.target.value)} required placeholder="sunset-cruise" disabled={!!d.id} /></label>
        <label className="text-sm font-semibold">Kind
          <select className={`mt-1 ${field}`} value={d.kind} onChange={(e) => set("kind", e.target.value as Draft["kind"])}>
            <option>Cruise</option><option>Activity</option><option>Combo</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Category
          <select className={`mt-1 ${field}`} value={d.category} onChange={(e) => set("category", e.target.value)}>
            <option>Cruise</option><option>Adventure</option><option>Underwater</option><option>Group Rides</option><option>Combo</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Price<Input className="mt-1" value={d.price} onChange={(e) => set("price", e.target.value)} placeholder="₹2,500 per person" /></label>
        <label className="text-sm font-semibold">Price note<Input className="mt-1" value={d.price_note ?? ""} onChange={(e) => set("price_note", e.target.value)} placeholder="Children: ₹1,500 · Infants free" /></label>
        <label className="text-sm font-semibold">Location<Input className="mt-1" value={d.location} onChange={(e) => set("location", e.target.value)} /></label>
        <label className="text-sm font-semibold">Timing<Input className="mt-1" value={d.timing} onChange={(e) => set("timing", e.target.value)} placeholder="9:45 AM – 2:45 PM" /></label>
        <label className="text-sm font-semibold">Duration<Input className="mt-1" value={d.duration} onChange={(e) => set("duration", e.target.value)} /></label>
        <label className="text-sm font-semibold">Reporting time<Input className="mt-1" value={d.reporting ?? ""} onChange={(e) => set("reporting", e.target.value)} placeholder="9:30 AM at Havelock Jetty" /></label>
        <label className="text-sm font-semibold">Guest notes / limits<Input className="mt-1" value={d.limits} onChange={(e) => set("limits", e.target.value)} /></label>
        <label className="text-sm font-semibold">Sort order<Input className="mt-1" type="number" value={d.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></label>
      </div>
      <label className="block text-sm font-semibold">Full page title (optional)<Input className="mt-1" value={d.full_title ?? ""} onChange={(e) => set("full_title", e.target.value)} /></label>
      <label className="block text-sm font-semibold">Overview<Textarea className="mt-1 min-h-24" value={d.overview} onChange={(e) => set("overview", e.target.value)} /></label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold">Inclusions (one per line)<Textarea className="mt-1 min-h-32" value={listToText(d.inclusions)} onChange={(e) => set("inclusions", textToList(e.target.value))} /></label>
        <label className="text-sm font-semibold">Exclusions (one per line)<Textarea className="mt-1 min-h-32" value={listToText(d.exclusions)} onChange={(e) => set("exclusions", textToList(e.target.value))} /></label>
        <label className="text-sm font-semibold">Add-ons (one per line)<Textarea className="mt-1 min-h-32" value={listToText(d.add_ons)} onChange={(e) => set("add_ons", textToList(e.target.value))} /></label>
      </div>
      <label className="block text-sm font-semibold">Photo URL (optional — leave empty to keep the current photo)<Input className="mt-1" value={d.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={d.hidden} onChange={(e) => set("hidden", e.target.checked)} /> Hide from the website
      </label>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancel</Button>
      </div>
    </form>
  );
}

// ---------- Page content editor ----------

const CONTENT_KEYS = [
  { key: "homepage", label: "Homepage text" },
  { key: "about", label: "About Us text" },
  { key: "contact", label: "Contact details" },
] as const;

function ContentEditor() {
  const [key, setKey] = useState<string>("homepage");
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (k: string) => {
    setLoading(true); setMsg("");
    try {
      const v: unknown = await getSiteContent({ data: { key: k } });
      const rec = (v ?? {}) as Record<string, unknown>;
      setJson(Object.keys(rec).length ? JSON.stringify(rec, null, 2) : "");
    } catch {
      setMsg("Could not load this section.");
    }
    setLoading(false);
  };
  useEffect(() => { load(key); }, [key]);

  const save = async () => {
    setMsg("");
    let value: Record<string, unknown>;
    try {
      value = json.trim() ? JSON.parse(json) : {};
    } catch {
      setMsg("The text is not valid JSON — check quotes and commas.");
      return;
    }
    try {
      await setSiteContent({ data: { key, value } });
      setMsg("Saved — live on the website.");
    } catch {
      setMsg("Could not save.");
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Page Content</h2>
        <p className="text-sm text-muted-foreground">Edit the words on each page. Each section is stored as structured text (JSON) — change only the words inside the quotes.</p>
      </div>
      <div className="flex gap-2">
        {CONTENT_KEYS.map((c) => (
          <Button key={c.key} variant={key === c.key ? "default" : "outline"} size="sm" onClick={() => setKey(c.key)}>{c.label}</Button>
        ))}
      </div>
      <Textarea value={json} onChange={(e) => setJson(e.target.value)} placeholder={loading ? "Loading…" : 'Empty — the page currently uses its built-in text. Add overrides here, e.g.\n{\n  "heroTitle": "Beyond the Shore, Into the Blue"\n}'} className="min-h-72 font-mono text-sm" />
      <div className="flex items-center gap-3">
        <Button onClick={save}>Save</Button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </div>
    </main>
  );
}

// ---------- Saved carts ----------
type SavedCart = { id: string; items: { title: string; date: string; guests: number }[]; item_count: number; created_at: string; open_count: number; last_opened_at: string | null; converted_at: string | null; order_id: string | null; amount_paise: number | null };

function SavedCartsPanel() {
  const [rows, setRows] = useState<SavedCart[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const db = supabase as unknown as { from: (t: string) => any };
    const { data } = await db.from("saved_carts").select("*").order("created_at", { ascending: false }).limit(500);
    setRows((data ?? []) as SavedCart[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  const opened = rows.filter((r) => r.open_count > 0).length;
  const converted = rows.filter((r) => r.converted_at).length;
  const revenue = rows.reduce((a, r) => a + (r.converted_at ? r.amount_paise ?? 0 : 0), 0) / 100;
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "–");
  const stats: [string, string][] = [
    ["Links saved", String(rows.length)],
    ["Links opened", `${opened} (${pct(opened, rows.length)})`],
    ["Led to booking", `${converted} (${pct(converted, rows.length)})`],
    ["Booked after opening", pct(rows.filter((r) => r.converted_at && r.open_count > 0).length, opened)],
    ["Revenue from saved carts", `₹${revenue.toLocaleString("en-IN")}`],
  ];
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Saved Carts</h2>
          <p className="text-sm text-muted-foreground">Every "Save cart for later" link, how often it was opened, and whether it turned into a paid booking.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="size-4" /> Refresh</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-xl font-bold text-primary">{v}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>{["Saved", "Experiences", "Opens", "Last opened", "Status", "Order"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No saved carts yet.</td></tr>
              : rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(r.created_at)}</td>
                  <td className="px-3 py-2">{r.items.map((i, n) => <div key={n}>{i.title} · {i.date || "no date"} · {i.guests} guest(s)</div>)}</td>
                  <td className="px-3 py-2">{r.open_count}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(r.last_opened_at)}</td>
                  <td className="px-3 py-2">
                    {r.converted_at
                      ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Booked ₹{((r.amount_paise ?? 0) / 100).toLocaleString("en-IN")}</span>
                      : <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{r.open_count ? "Opened" : "Not opened"}</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.order_id ? <>{r.order_id}<br />{fmt(r.converted_at)}</> : "–"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

type VisitorLog = {
  id: string;
  session_id: string;
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  path: string | null;
  user_agent: string | null;
  created_at: string;
};

function VisitorsPanel() {
  const [rows, setRows] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const db = supabase as unknown as { from: (t: string) => any };
    const { data } = await db.from("visitor_logs").select("*").order("created_at", { ascending: false }).limit(500);
    setRows((data ?? []) as VisitorLog[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const place = (r: VisitorLog) => [r.city, r.region, r.country].filter(Boolean).join(", ") || "Unknown";
  const countries = new Map<string, number>();
  for (const r of rows) {
    const key = r.country || "Unknown";
    countries.set(key, (countries.get(key) ?? 0) + 1);
  }
  const topCountries = [...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const today = rows.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
  const stats: [string, string][] = [
    ["Total visits", String(rows.length)],
    ["Today", String(today)],
    ["Unique visitors", String(new Set(rows.map((r) => r.session_id)).size)],
    ["Countries", String(countries.size)],
  ];
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Visitors</h2>
          <p className="text-sm text-muted-foreground">Every website visit with the visitor's IP address and approximate location, captured automatically.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="size-4" /> Refresh</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-xl font-bold text-primary">{v}</p>
          </div>
        ))}
      </div>
      {topCountries.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Top locations</p>
          <div className="flex flex-wrap gap-2">
            {topCountries.map(([c, n]) => (
              <span key={c} className="rounded-full bg-ocean-light px-3 py-1 text-sm font-semibold text-primary">{c} · {n}</span>
            ))}
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">IP address</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Page</th>
              <th className="px-4 py-3 font-semibold">Device</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No visits recorded yet. New visits appear here automatically.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="whitespace-nowrap px-4 py-3">{fmt(r.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.ip ?? "–"}</td>
                <td className="px-4 py-3">{place(r)}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.path ?? "/"}</td>
                <td className="max-w-64 truncate px-4 py-3 text-xs text-muted-foreground" title={r.user_agent ?? ""}>{r.user_agent ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
