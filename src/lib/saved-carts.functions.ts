import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Saved-cart tracking. Writes use the admin client after strict validation;
// reads happen in /admin through RLS (admins only).
type Untyped = { from: (t: string) => any; rpc?: unknown };

const item = z.object({ title: z.string().max(200), date: z.string().max(20), guests: z.number().int().min(0).max(200) }).passthrough();

export const createSavedCart = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ items: z.array(item).min(1).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as Untyped;
    const { data: row, error } = await db.from("saved_carts").insert({ items: data.items, item_count: data.items.length }).select("id").single();
    if (error || !row) return { id: null as string | null };
    return { id: row.id as string };
  });

export const trackSavedCartOpen = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as Untyped;
    const { data: row } = await db.from("saved_carts").select("open_count").eq("id", data.id).maybeSingle();
    if (!row) return { ok: false };
    await db.from("saved_carts").update({ open_count: (row.open_count ?? 0) + 1, last_opened_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: true };
  });

// Called server-side only after a verified payment.
export async function markSavedCartConverted(id: string, orderId: string, amountPaise: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as Untyped;
  await db.from("saved_carts").update({ converted_at: new Date().toISOString(), order_id: orderId, amount_paise: amountPaise }).eq("id", id).is("converted_at", null);
}
