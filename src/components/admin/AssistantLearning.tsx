import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { suggestChatImprovements } from "@/lib/chat-learning.functions";

type Knowledge = { id: string; question: string; answer: string; status: "suggested" | "approved"; source: string; reason: string | null };
type Transcript = { id: string; messages: { role: string; text: string }[]; message_count: number; converted: boolean; reviewed: boolean; updated_at: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export function AssistantLearning() {
  const [items, setItems] = useState<Knowledge[]>([]);
  const [chats, setChats] = useState<Transcript[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState({ question: "", answer: "" });
  const suggest = useServerFn(suggestChatImprovements);

  const load = useCallback(async () => {
    const [k, t] = await Promise.all([
      db.from("chat_knowledge").select("*").order("status", { ascending: false }).order("created_at", { ascending: false }),
      db.from("chat_transcripts").select("*").order("updated_at", { ascending: false }).limit(50),
    ]);
    setItems((k.data ?? []) as Knowledge[]);
    setChats((t.data ?? []) as Transcript[]);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function runSuggest() {
    setBusy(true); setMsg("Reading recent chats…");
    try {
      const r = await suggest();
      setMsg(r.reviewed ? `Reviewed ${r.reviewed} chat(s) and suggested ${r.added} improvement(s). Approve the ones you want below.` : "No new chats to learn from yet.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
    setBusy(false);
  }

  async function save(k: Knowledge, status: Knowledge["status"]) {
    const { error } = await db.from("chat_knowledge").update({ question: k.question, answer: k.answer, status, updated_at: new Date().toISOString() }).eq("id", k.id);
    if (error) setMsg("Could not save."); else await load();
  }
  async function remove(id: string) {
    await db.from("chat_knowledge").delete().eq("id", id); await load();
  }
  async function add() {
    if (!draft.question.trim() || !draft.answer.trim()) return;
    const { error } = await db.from("chat_knowledge").insert({ ...draft, status: "approved", source: "staff" });
    if (error) setMsg("Could not add."); else { setDraft({ question: "", answer: "" }); await load(); }
  }
  const edit = (id: string, patch: Partial<Knowledge>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const suggested = items.filter((x) => x.status === "suggested");
  const approved = items.filter((x) => x.status === "approved");
  const converted = chats.filter((c) => c.converted).length;

  const Card = ({ k }: { k: Knowledge }) => (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <input className="w-full rounded-md border bg-background px-3 py-2 text-sm font-semibold" value={k.question} onChange={(e) => edit(k.id, { question: e.target.value })} />
      <textarea className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm" rows={4} value={k.answer} onChange={(e) => edit(k.id, { answer: e.target.value })} />
      {k.reason && <p className="mt-1 text-xs text-muted-foreground">Why: {k.reason}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {k.status === "suggested"
          ? <Button size="sm" onClick={() => save(k, "approved")}>Approve</Button>
          : <Button size="sm" variant="outline" onClick={() => save(k, "approved")}>Save changes</Button>}
        {k.status === "approved" && <Button size="sm" variant="outline" onClick={() => save(k, "suggested")}>Turn off</Button>}
        <Button size="sm" variant="ghost" onClick={() => remove(k.id)}>Delete</Button>
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-xl font-bold">Assistant learning</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every guest chat is saved. Click below and the AI reads new chats (especially ones that led to bookings) and suggests better answers. Nothing goes live until you approve it.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Button onClick={runSuggest} disabled={busy}>{busy ? "Working…" : "Learn from new chats"}</Button>
          <span>{chats.length} recent chats · {converted} led to bookings · {approved.length} answers live</span>
        </div>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold">Waiting for approval ({suggested.length})</h3>
        {suggested.length ? <div className="grid gap-4 md:grid-cols-2">{suggested.map((k) => <Card key={k.id} k={k} />)}</div> : <p className="text-sm text-muted-foreground">No suggestions right now.</p>}
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold">Live answers the assistant uses ({approved.length})</h3>
        <div className="mb-4 rounded-xl border border-dashed p-4">
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Guest question, e.g. Is the Dinner Cruise good for kids?" value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
          <textarea className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm" rows={3} placeholder="The answer the assistant should give" value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
          <Button size="sm" className="mt-2" onClick={add}>Add answer</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">{approved.map((k) => <Card key={k.id} k={k} />)}</div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold">Recent guest chats</h3>
        <div className="divide-y rounded-xl border bg-card">
          {chats.length === 0 && <p className="p-4 text-sm text-muted-foreground">No chats saved yet.</p>}
          {chats.map((c) => (
            <div key={c.id} className="p-3">
              <button className="flex w-full items-center justify-between gap-3 text-left text-sm" onClick={() => setOpen(open === c.id ? null : c.id)}>
                <span className="truncate font-medium">{c.messages.find((m) => m.role === "user")?.text ?? "(empty)"}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {c.converted && <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-primary-foreground">Booked</span>}
                  {c.message_count} msgs · {new Date(c.updated_at).toLocaleString()}
                </span>
              </button>
              {open === c.id && (
                <div className="mt-2 space-y-2 text-sm">
                  {c.messages.map((m, i) => (
                    <p key={i} className={m.role === "user" ? "font-semibold" : "text-muted-foreground"}>{m.role === "user" ? "Guest: " : "Assistant: "}{m.text}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
