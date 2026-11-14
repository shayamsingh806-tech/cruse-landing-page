// Records a visitor's IP address and approximate location once per browser
// session. Called by the site chrome; inserts via the service role because
// visitors have no read/write access to visitor_logs.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  sessionId: z.string().min(6).max(80),
  path: z.string().max(300).optional(),
});

function clientIp(request: Request): string | null {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

type Geo = { city: string | null; region: string | null; country: string | null };

async function lookupGeo(request: Request, ip: string | null): Promise<Geo> {
  // Cloudflare injects geo data on the request object when available.
  const cf = (request as unknown as { cf?: Record<string, unknown> }).cf;
  if (cf && (cf["city"] || cf["country"])) {
    return {
      city: (cf["city"] as string) ?? null,
      region: (cf["region"] as string) ?? null,
      country: (cf["country"] as string) ?? null,
    };
  }
  if (!ip || ip.startsWith("10.") || ip.startsWith("192.168.") || ip === "127.0.0.1" || ip === "::1") {
    return { city: null, region: null, country: null };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`);
    const data = (await res.json()) as { status?: string; city?: string; regionName?: string; country?: string };
    if (data.status === "success") {
      return { city: data.city ?? null, region: data.regionName ?? null, country: data.country ?? null };
    }
  } catch {
    // Geo lookup is best-effort; never fail the request over it.
  }
  return { city: null, region: null, country: null };
}

export const Route = createFileRoute("/api/public/track-visit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: z.infer<typeof bodySchema>;
        try {
          body = bodySchema.parse(await request.json());
        } catch {
          return new Response("bad request", { status: 400 });
        }
        const ip = clientIp(request);
        const geo = await lookupGeo(request, ip);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("visitor_logs").insert({
          session_id: body.sessionId,
          ip,
          city: geo.city,
          region: geo.region,
          country: geo.country,
          path: body.path ?? null,
          user_agent: (request.headers.get("user-agent") ?? "").slice(0, 300),
        } as never);
        return new Response(null, { status: 204 });
      },
    },
  },
});
