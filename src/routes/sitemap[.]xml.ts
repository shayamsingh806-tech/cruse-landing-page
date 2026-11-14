import { createFileRoute } from "@tanstack/react-router";
import { experiences } from "@/lib/site-data";
import { POLICY_SLUGS, STATIC_PAGES, absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const paths = [
          ...STATIC_PAGES,
          ...experiences.map((e) => `/experiences/${e.slug}`),
          ...POLICY_SLUGS.map((s) => `/policies/${s}`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
          .map((p) => `  <url><loc>${absoluteUrl(p)}</loc></url>`)
          .join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
