import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { GONE, REDIRECTS } from "./lib/seo";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// SEO migration: one-hop 301s for old URLs, trailing-slash normalisation, 410 for retired pages.
const seoRedirectMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/lovable/")) return next();
  const raw = url.pathname;
  const path = raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
  if (GONE.has(path)) {
    return new Response('<!doctype html><meta name="robots" content="noindex"><title>Page removed</title><p>This page has been removed. <a href="/">Go to Canopus Marine</a></p>', { status: 410, headers: { "content-type": "text/html; charset=utf-8" } });
  }
  const target = REDIRECTS[path] ?? (path !== raw ? path : undefined);
  if (target && !raw.startsWith("/_") && !raw.includes(".")) {
    return new Response(null, { status: 301, headers: { location: target + url.search } });
  }
  return next();
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [seoRedirectMiddleware, errorMiddleware, csrfMiddleware],
}));
