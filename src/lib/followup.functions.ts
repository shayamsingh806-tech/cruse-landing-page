import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({
  guestName: z.string().trim().min(1).max(120),
  experience: z.string().trim().min(1).max(200),
  tripDate: z.string().trim().max(40).optional().default(""),
  guests: z.string().trim().max(60).optional().default(""),
  highlights: z.string().trim().max(2000).optional().default(""),
  channel: z.enum(["email", "whatsapp"]).default("email"),
  tone: z.enum(["warm", "professional", "playful"]).default("warm"),
  offer: z.string().trim().max(300).optional().default(""),
});

type Db = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };

export const draftFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as Db;
    const { data: isAdmin, error } = await db.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !isAdmin) throw new Error("Only staff can draft follow-ups.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const instructions = `You write post-trip follow-up messages for Canopus Marine, a cruise and watersports operator on Havelock Island and Port Blair, Andaman Islands, founded by seafarers. Write as the Canopus Marine team. Thank the guest by name, reference their specific experience and any highlights, invite a review, and gently invite them back. Never invent facts, prices, discounts or vessel names; only mention an offer if one is given. ${data.channel === "whatsapp" ? "Format for WhatsApp: under 90 words, no subject line, at most 2 emojis." : "Format as an email: first line 'Subject: ...', then a blank line, then the body under 170 words, signed 'The Canopus Marine Team'."} Tone: ${data.tone}. Output only the message.`;
    const details = [
      `Guest name: ${data.guestName}`,
      `Experience: ${data.experience}`,
      data.tripDate && `Trip date: ${data.tripDate}`,
      data.guests && `Group: ${data.guests}`,
      data.highlights && `Trip notes/highlights: ${data.highlights}`,
      data.offer && `Offer to include: ${data.offer}`,
    ].filter(Boolean).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input: details,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI is busy right now — please try again in a minute.");
      if (res.status === 402) throw new Error("AI credits have run out. Add credits in Settings → Plans & credits.");
      let msg = "";
      try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? ""; } catch { /* ignore */ }
      throw new Error(msg || `AI request failed (${res.status}).`);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    let failure = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.failed" || ev.type === "error")
            failure = ev.response?.error?.message ?? ev.message ?? "AI request failed.";
        } catch { /* partial */ }
      }
    }
    if (failure) throw new Error(failure);
    if (!text.trim()) throw new Error("The AI didn't return a message. Please adjust the details and try again.");
    return { message: text.trim() };
  });
