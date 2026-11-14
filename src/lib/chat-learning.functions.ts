import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { experiences } from "./site-data";

type Db = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

type Transcript = { id: string; converted: boolean; messages: { role: string; text: string }[] };

/** Reads recent unreviewed chats and asks the AI to propose Q&A improvements (saved as "suggested"). */
export const suggestChatImprovements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as Db;
    const { data: isAdmin, error } = await db.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !isAdmin) throw new Error("Only staff can do this.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const { data: rows, error: qErr } = await db
      .from("chat_transcripts")
      .select("id, converted, messages")
      .eq("reviewed", false)
      .gte("message_count", 2)
      .order("updated_at", { ascending: false })
      .limit(25);
    if (qErr) throw new Error("Could not load chats.");
    const transcripts = (rows ?? []) as Transcript[];
    if (!transcripts.length) return { added: 0, reviewed: 0 };

    const { data: existing } = await db.from("chat_knowledge").select("question").limit(200);
    const known = ((existing ?? []) as { question: string }[]).map((r) => `- ${r.question}`).join("\n");

    const catalog = experiences.map((x) => `- ${x.title}: ${x.price}${x.priceNote ? ` (${x.priceNote})` : ""}, ${x.duration}, ${x.timing}`).join("\n");
    const chats = transcripts
      .map((t, i) => `### Chat ${i + 1} (${t.converted ? "LED TO BOOKING" : "no booking"})\n` +
        t.messages.map((m) => `${m.role === "user" ? "Guest" : "Assistant"}: ${m.text.slice(0, 800)}`).join("\n"))
      .join("\n\n").slice(0, 60000);

    const instructions = `You improve the booking assistant of Canopus Marine (cruises and watersports, Havelock Island and Port Blair, Andamans). Study the chats. Find guest questions the assistant answered poorly, vaguely or wrongly, recurring objections, and phrasing that worked in chats that LED TO BOOKING. Propose up to 8 reusable Q&A entries the assistant should use in future. Answers must be accurate, concise, conversion-focused (end with a clear next step such as booking on the experience page) and use ONLY facts from the official catalog below or plainly stated in the chats by the assistant consistent with that catalog. Never invent prices, discounts, policies or vessel names; if a fact is unknown, the answer should say to call +91 99332 46262. Skip questions already covered:\n${known || "(none)"}\n\nOFFICIAL CATALOG:\n${catalog}\n\nReturn ONLY JSON: {"items":[{"question":"...","answer":"...","reason":"why this helps conversion"}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input: chats,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_object" } },
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) throw new Error("AI is busy right now — please try again in a minute.");
      if (res.status === 402) throw new Error("AI credits have run out. Add credits in Settings → Plans & credits.");
      throw new Error(`AI request failed (${res.status}).`);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", failure = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const p = line.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.failed" || ev.type === "error") failure = ev.response?.error?.message ?? ev.message ?? "AI request failed.";
        } catch { /* partial */ }
      }
    }
    if (failure) throw new Error(failure);

    let items: { question: string; answer: string; reason?: string }[] = [];
    try {
      const m = text.match(/\{[\s\S]*\}/);
      items = (JSON.parse(m ? m[0] : text).items ?? []) as typeof items;
    } catch {
      throw new Error("The AI reply could not be read. Please try again.");
    }
    const clean = items
      .filter((x) => x && typeof x.question === "string" && typeof x.answer === "string" && x.question.trim() && x.answer.trim())
      .slice(0, 8)
      .map((x) => ({
        question: x.question.trim().slice(0, 500),
        answer: x.answer.trim().slice(0, 3000),
        reason: (x.reason ?? "").slice(0, 500),
        status: "suggested",
        source: "ai",
      }));
    if (clean.length) {
      const { error: insErr } = await db.from("chat_knowledge").insert(clean);
      if (insErr) throw new Error("Could not save suggestions.");
    }
    await db.from("chat_transcripts").update({ reviewed: true }).in("id", transcripts.map((t) => t.id));
    return { added: clean.length, reviewed: transcripts.length };
  });
