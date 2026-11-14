<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture
- Combos use explicit public leaf routes, a shared activity-style detail presentation and card listing; their catalog feeds the same experiences, booking, cart and server-priced payment flow, with canonical combo links preserved in reusable experience links.
- Keep marketing content in shared typed data and reusable site components so new experiences can be added without duplicating route code.
- Submit public forms directly through the generated Lovable Cloud browser client; database policies allow inserts only and keep all records private.
- Use Canopus Marine’s original deep blue (#0C417B equivalent token) as the primary brand color, with ocean blues for accents; this matches the source brand.
- Staff lead dashboard lives at /admin (client-only, outside site chrome); access is enforced by the user_roles table + has_role RLS, never client checks.
- SEO redirects, retired URLs and canonical host live in src/lib/seo.ts and are applied by request middleware in src/start.ts; keeps old-site URLs working without touching page code.

- Experiences (cruises/activities) live in the public.experiences DB table, seeded from src/lib/site-data.ts; admins edit them at /admin → Experiences via src/lib/content.functions.ts. site-data.ts remains the fallback when the DB is unreachable; generated Database types lag new tables, so content.functions.ts uses an untyped query interface.
- Chatbot learning: /api/chat saves transcripts server-side (chat_transcripts) and injects only staff-approved chat_knowledge Q&A into the system prompt; AI suggestions are stored as "suggested" and never go live without admin approval — prevents the bot from learning invented facts.
