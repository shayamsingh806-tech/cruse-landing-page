// Downloads every Lovable-hosted asset (src/assets/*.asset.json) into public/,
// so images and videos load on localhost and on any self-hosted server.
// Files are saved at the same path the site already uses (/__l5e/assets-v1/...),
// so no page code has to change. Already-downloaded files are skipped.
//
//   npm run assets                              # download missing files
//   ASSET_SOURCE=https://xyz.lovable.app npm run assets   # use another source
import { readdir, readFile, mkdir, stat, rename, unlink } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join, dirname } from "node:path";

const SOURCE = (process.env.ASSET_SOURCE || "https://canopusmarineserv.com").replace(/\/+$/, "");
const ROOT = process.cwd();
const ASSET_DIR = join(ROOT, "src/assets");
const PUBLIC_DIR = join(ROOT, "public");
const quiet = process.argv.includes("--quiet");

const exists = (p) => stat(p).then((s) => s.size > 0, () => false);

const files = (await readdir(ASSET_DIR)).filter((f) => f.endsWith(".asset.json"));
const assets = [];
for (const f of files) {
  const meta = JSON.parse(await readFile(join(ASSET_DIR, f), "utf8"));
  if (typeof meta.url === "string" && meta.url.startsWith("/")) assets.push(meta);
}

const missing = [];
for (const a of assets) if (!(await exists(join(PUBLIC_DIR, a.url)))) missing.push(a);

if (missing.length === 0) {
  if (!quiet) console.log(`[assets] All ${assets.length} assets already in public/ — nothing to do.`);
  process.exit(0);
}

console.log(`[assets] Downloading ${missing.length} of ${assets.length} assets from ${SOURCE} ...`);
let ok = 0;
const failed = [];
let i = 0;
async function worker() {
  while (i < missing.length) {
    const a = missing[i++];
    const dest = join(PUBLIC_DIR, a.url);
    const tmp = dest + ".part";
    try {
      const res = await fetch(SOURCE + a.url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      await mkdir(dirname(dest), { recursive: true });
      await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
      await rename(tmp, dest);
      ok++;
      if (!quiet) console.log(`  ✓ ${a.original_filename ?? a.url}`);
    } catch (err) {
      await unlink(tmp).catch(() => {});
      failed.push(`${a.original_filename ?? a.url} (${err.cause?.code ?? err.message})`);
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

console.log(`[assets] Downloaded ${ok}/${missing.length}.`);
if (failed.length) {
  console.warn(`[assets] ${failed.length} could not be downloaded — those images will be blank until you re-run "npm run assets":`);
  for (const f of failed.slice(0, 10)) console.warn("  ✗ " + f);
  if (failed.length > 10) console.warn(`  … and ${failed.length - 10} more`);
}
// Never block the dev server because of a network problem.
process.exit(0);
