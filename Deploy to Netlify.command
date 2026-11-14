#!/bin/bash
# Double-click to build the Canopus website and publish it on Netlify (no questions asked).
cd "$(dirname "$0")" || exit 1
LOG="$PWD/deploy-netlify.log"
: > "$LOG"
exec > >(tee -a "$LOG") 2>&1
finish() { echo "$1"; echo "STATUS: $2" ; read -r -p "Press Enter to close"; exit 0; }
echo "=== Deploy Canopus website to Netlify — $(date) ==="

# ---------- Node.js 22 (private copy, no password) ----------
NODE_HOME="$HOME/.canopus-node"
export PATH="$NODE_HOME/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
node_ok() { command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ]; }
if ! node_ok; then
  echo ">> Installing Node.js 22 into $NODE_HOME …"
  case "$(uname -m)" in arm64) PLAT=darwin-arm64 ;; *) PLAT=darwin-x64 ;; esac
  BASE="https://nodejs.org/dist/latest-v22.x"
  FILE=$(curl -fsSL "$BASE/SHASUMS256.txt" | awk '{print $2}' | grep "node-v.*-$PLAT.tar.gz$" | head -1)
  [ -n "$FILE" ] || finish "!! Could not reach nodejs.org" FAILED
  TMP=$(mktemp -d); curl -fsSL "$BASE/$FILE" -o "$TMP/node.tar.gz" || finish "!! Node download failed" FAILED
  rm -rf "$NODE_HOME"; mkdir -p "$NODE_HOME"; tar -xzf "$TMP/node.tar.gz" -C "$NODE_HOME" --strip-components=1; rm -rf "$TMP"
  node_ok || finish "!! Node install failed" FAILED
fi
echo ">> Node $(node -v)"

# ---------- packages + images ----------
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  echo ">> Installing packages (a few minutes the first time)…"
  npm install --no-audit --no-fund || finish "!! npm install failed" FAILED
  touch node_modules
fi
echo ">> Saving all photos/videos inside the project…"
npm run assets
have=$(find public/__l5e -type f 2>/dev/null | wc -l | tr -d ' '); need=$(ls src/assets/*.asset.json | wc -l | tr -d ' ')
echo ">> Images saved: $have / $need"

# ---------- Netlify CLI ----------
echo ">> Getting Netlify CLI…"
npm install --no-save --no-audit --no-fund netlify-cli@latest >/dev/null 2>&1 || finish "!! Could not install Netlify CLI" FAILED
NL="npx netlify"

if ! $NL api getCurrentUser >/dev/null 2>&1; then
  echo ">> Netlify login — opening the Authorize page in Chrome…"
  OUT=$(BROWSER=none $NL login 2>&1)
  URL=$(echo "$OUT" | grep -Eo 'https://app\.netlify\.com/authorize[^[:space:]"]*' | head -1)
  TICKET=$(echo "$URL" | sed -E 's/.*ticket=([A-Za-z0-9]+).*/\1/')
  [ -n "$TICKET" ] || { echo "$OUT"; finish "!! Could not start Netlify login" FAILED; }
  echo "LOGIN_URL: $URL"
  open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL"
  echo ">> Waiting for 'Authorize' to be clicked in the browser (up to 10 minutes)…"
  ok=""
  for i in $(seq 1 120); do
    R=$($NL login --check "$TICKET" 2>&1)
    if echo "$R" | grep -qi 'authorized' && ! echo "$R" | grep -qi 'pending'; then ok=1; break; fi
    echo "$R" | grep -qi 'denied' && finish "!! Netlify login was denied or expired — double-click the file again" FAILED
    sleep 5
  done
  [ -n "$ok" ] || finish "!! Timed out waiting for Netlify authorization — double-click the file again" FAILED
  $NL api getCurrentUser >/dev/null 2>&1 || finish "!! Netlify login was not completed" FAILED
fi
echo ">> Logged in to Netlify."

# ---------- create / link the project ----------
if [ ! -f .netlify/state.json ] || ! grep -q siteId .netlify/state.json; then
  TEAM=$($NL api listAccountsForUser 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s)[0].slug)}catch{}})')
  SITE="canopus-marine-$(LC_ALL=C tr -dc a-z0-9 </dev/urandom | head -c 5)"
  echo ">> Creating Netlify project '$SITE' (team: $TEAM)…"
  $NL sites:create --name "$SITE" ${TEAM:+--account-slug "$TEAM"} --disable-linking >/dev/null || finish "!! Could not create the Netlify project" FAILED
  $NL link --name "$SITE" || finish "!! Could not link the Netlify project" FAILED
fi

# ---------- runtime settings for server code ----------
set -a; . ./.env; set +a
for k in SUPABASE_URL SUPABASE_PUBLISHABLE_KEY VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY; do
  $NL env:set "$k" "${!k}" --force >/dev/null 2>&1 && echo "   setting saved: $k"
done

# ---------- build + publish ----------
echo ">> Building and publishing (takes 2–4 minutes)…"
$NL deploy --build --prod || finish "!! Deploy failed — see messages above" FAILED
echo ""
echo "✅ Website is live on Netlify. The 'Production URL' is shown above."
finish "" DONE
