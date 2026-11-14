# Run the Canopus website on your computer (localhost)

## One-time setup
1. Install **Node.js 22 or newer** from https://nodejs.org (LTS button), then reopen Terminal.
2. In Terminal:
   ```sh
   cd ~/Downloads/canopus-marine-website-backup
   npm install
   ```

## Start the site (for editing — auto-reloads when you change code)
```sh
npm run dev
```
Open **http://localhost:8080** (if 8080 is busy, Vite prints the port it picked).

The first start downloads all 88 photos/videos from the live site into `public/__l5e/`
so the site no longer depends on Lovable's image hosting. After that they load offline.
If any fail (no internet), run `npm run assets` later to finish.

## Run it like a real server (production mode)
```sh
npm run build:local
npm start
```
Open **http://localhost:3000**. Use `PORT=4000 npm start` for another port.
This same `.output/` folder is what you'd upload to your own VPS (needs Node 22).

## What works locally
| Feature | Works? | Needs |
|---|---|---|
| All pages, cruises, activities, combos, cart, gallery, SEO redirects, sitemap | ✅ | nothing |
| Live prices/content from the database, contact & booking enquiry forms | ✅ | the public keys already in `.env` |
| Admin dashboard `/admin` login | ❌ locally | uses Lovable's Google sign-in, which only works on the Lovable-hosted site — keep using the live `/admin` for now |
| Website chatbot, email sending | ❌ until set | `LOVABLE_API_KEY` |
| Online payments (Razorpay) | ❌ until set | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Chat transcripts, saved carts, follow-ups | ❌ until set | `SUPABASE_SERVICE_ROLE_KEY` |

Put secret keys in a new file called `.env.local` (same `NAME=value` format) — not in `.env`.

Note: the database itself is still the Supabase project Lovable Cloud created
(tnavtgrvymgtkpgwlrkz). Moving it to your own Supabase account is a separate step.

## Files changed for local running
- `vite.config.ts` — loads `.env` / `.env.local` for server-side code
- `package.json` — added `predev`, `assets`, `build:local`, `start` scripts
- `scripts/fetch-assets.mjs` — downloads Lovable-hosted images into `public/`
- `.env` — public Supabase URL + key

## Publish on Netlify
1. Run `Start Website.command` once (installs Node + downloads all images while the old site is still live).
2. Double-click **`Deploy to Netlify.command`**. It logs you in to Netlify (browser opens → Authorize),
   builds the site, creates/links the Netlify project, saves the Supabase settings there, and publishes.
3. Check the Netlify link it prints. Then in Netlify → Domain management add `canopusmarineserv.com`
   and update DNS as Netlify shows (this moves the live domain away from Lovable).

Settings live in `netlify.toml` (build: `npm run build:netlify`, publish: `dist`, Node 22).
Optional secrets (Razorpay, LOVABLE_API_KEY, SUPABASE_SERVICE_ROLE_KEY) go in Netlify →
Project configuration → Environment variables, then redeploy.
Do NOT use Netlify's drag-and-drop upload — this site needs server functions, which drag-and-drop can't run.
