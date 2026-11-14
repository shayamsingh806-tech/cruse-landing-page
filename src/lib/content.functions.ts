import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

// ---------- shared types ----------

export type ExperienceRow = {
  id: string;
  slug: string;
  title: string;
  full_title: string | null;
  kind: "Cruise" | "Activity" | "Combo";
  category: string;
  image: string;
  alt: string;
  location: string;
  timing: string;
  duration: string;
  price: string;
  price_note: string | null;
  limits: string;
  overview: string;
  reporting: string | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  add_ons: string[] | null;
  sort_order: number;
  hidden: boolean;
};

const experienceInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and dashes only"),
  title: z.string().min(1),
  full_title: z.string().nullable().optional(),
  kind: z.enum(["Cruise", "Activity", "Combo"]),
  category: z.string().min(1),
  image: z.string().default(""),
  alt: z.string().default(""),
  location: z.string().default(""),
  timing: z.string().default(""),
  duration: z.string().default(""),
  price: z.string().default(""),
  price_note: z.string().nullable().optional(),
  limits: z.string().default(""),
  overview: z.string().default(""),
  reporting: z.string().nullable().optional(),
  inclusions: z.array(z.string()).nullable().optional(),
  exclusions: z.array(z.string()).nullable().optional(),
  add_ons: z.array(z.string()).nullable().optional(),
  sort_order: z.number().int().default(0),
  hidden: z.boolean().default(false),
});

// The generated Database types lag behind new migrations, so DB access here
// goes through an untyped query interface.
type Qb = {
  select: (cols?: string) => Qb;
  order: (col: string, opts?: { ascending?: boolean }) => Qb;
  eq: (col: string, val: unknown) => Qb;
  maybeSingle: () => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  update: (row: Record<string, unknown>) => Qb;
  insert: (row: Record<string, unknown>) => Qb;
  upsert: (row: Record<string, unknown>) => Qb;
  delete: () => Qb;
  then: PromiseLike<{ data: unknown; error: { message: string } | null }>["then"];
};
type Db = {
  from: (table: string) => Qb;
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

async function publicDb(): Promise<Db> {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  }) as unknown as Db;
}

function adminDb(context: { supabase: unknown }): Db {
  return context.supabase as unknown as Db;
}

async function requireAdmin(db: Db, userId: string) {
  const { data, error } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

// ---------- public reads ----------

export const getExperiences = createServerFn({ method: "GET" }).handler(async () => {
  const db = await publicDb();
  const { data, error } = await db.from("experiences").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ExperienceRow[];
});

// ---------- admin reads/writes ----------

export const listAllExperiences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = adminDb(context);
    await requireAdmin(db, context.userId);
    const { data, error } = await db.from("experiences").select("*").order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ExperienceRow[];
  });

export const upsertExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => experienceInput.parse(data))
  .handler(async ({ context, data }) => {
    const db = adminDb(context);
    await requireAdmin(db, context.userId);
    const { id, ...row } = data;
    const payload = { ...row, updated_at: new Date().toISOString() };
    const q = id
      ? db.from("experiences").update(payload).eq("id", id)
      : db.from("experiences").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const db = adminDb(context);
    await requireAdmin(db, context.userId);
    const { error } = await db.from("experiences").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSiteContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ key: z.string().min(1) }).parse(data))
  .handler(async (args) => {
    const { context, data } = args as { context: { supabase: unknown; userId: string }; data: { key: string } };
    const db = adminDb(context);
    await requireAdmin(db, context.userId);
    const { data: row, error } = await db.from("site_content").select("value").eq("key", data.key).maybeSingle();
    if (error) throw new Error(error.message);
    return ((row as { value?: Json } | null)?.value ?? {}) as Record<string, Json>;
  });

export const setSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ key: z.string().min(1), value: z.record(z.string(), z.unknown()) }).parse(data))
  .handler(async ({ context, data }) => {
    const db = adminDb(context);
    await requireAdmin(db, context.userId);
    const { error } = await db
      .from("site_content")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
