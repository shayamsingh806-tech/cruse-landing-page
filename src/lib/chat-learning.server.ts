// Server-only helpers: save chat transcripts and load staff-approved knowledge.
type Untyped = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

async function admin(): Promise<Untyped> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Untyped;
}

let cache: { at: number; text: string } | null = null;

export async function loadApprovedKnowledge(): Promise<string> {
  if (cache && Date.now() - cache.at < 60_000) return cache.text;
  try {
    const db = await admin();
    const { data } = await db
      .from("chat_knowledge")
      .select("question, answer")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(60);
    const rows = (data ?? []) as { question: string; answer: string }[];
    const text = rows.map((r) => `Q: ${r.question}\nA: ${r.answer}`).join("\n\n");
    cache = { at: Date.now(), text };
    return text;
  } catch {
    return cache?.text ?? "";
  }
}

export type SlimMessage = { role: string; text: string };

export async function saveTranscript(sessionId: string, messages: SlimMessage[]) {
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(sessionId)) return;
  try {
    const db = await admin();
    const trimmed = messages.slice(-60).map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }));
    const { error } = await db.from("chat_transcripts").upsert(
      { session_id: sessionId, messages: trimmed, message_count: trimmed.length, updated_at: new Date().toISOString() },
      { onConflict: "session_id" },
    );
    if (error) console.error("saveTranscript", error);
  } catch (e) {
    console.error("saveTranscript", e);
  }
}

export async function markTranscriptConverted(sessionId: string) {
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(sessionId)) return;
  const db = await admin();
  await db.from("chat_transcripts").update({ converted: true }).eq("session_id", sessionId);
}
