# SEO Migration Audit — canopusmarineserv.com

Redirects live in `src/lib/seo.ts` (`REDIRECTS`, `GONE`). All are single-hop 301s; trailing slashes 301 to the slash-less canonical.

| Old URL | New URL | Action | Reason |
|---|---|---|---|
| / | / | KEEP | Homepage |
| /gallery/ | /gallery | KEEP | Same page |
| /about-us/ | /about-us | KEEP | Route renamed from /about to preserve URL |
| /contact-us/ | /contact-us | KEEP | Route renamed from /contact to preserve URL |
| /contact-new/ | /contact-us | 301 | Duplicate contact page |
| /terms-of-booking/ | /policies/terms-of-booking | 301 | Same content |
| /terms-and-conditions/, /terms-of-service/, /tour-term-condition/ | /policies/terms-of-booking | 301 | Closest policy |
| /privacy-policy-2/ | /policies/privacy-policy | 301 | Same content |
| /charter-private/ | /contact-us | 301 | Page removed by owner; enquiries via contact — REVIEW |
| /tours/, /destinations/, /shop/ | /activities | 301 | Closest experience listing — REVIEW |
| /blogs/, /blog/, /travel-tips/ | /activities | 301 | Blogs removed by owner — REVIEW |
| /deals/, /cart/, /checkout/ | /booking | 301 | Booking replaces shop flow |
| /faqs/ | /contact-us | 301 | No FAQ page — REVIEW |
| /careers/ | /about-us | 301 | Careers removed by owner — REVIEW |
| /sample-page/, /sample-page-2/, /month/, /how-to-delete-a-user-from-the-website/, /my-account/, /login-page/ | — | REMOVE (410) | WordPress utility/placeholder pages |
| (new) /about, /contact | /about-us, /contact-us | 301 | Old internal paths |

Noindex: /admin (also blocked in robots.txt).
Sitemap: https://canopusmarineserv.com/sitemap.xml (static pages, all cruises/activities, policies).
Manual review: individual old blog/tour post URLs were not supplied — add them to `REDIRECTS` once exported from Search Console.
