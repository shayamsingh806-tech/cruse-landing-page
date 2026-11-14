#!/bin/bash
# Double-click this file to install everything and run the Canopus website on http://localhost:8080
# Close this Terminal window (or press Ctrl+C) to stop the website.
cd "$(dirname "$0")" || exit 1
echo "=== Canopus Sea Escapes — local website ==="

NODE_HOME="$HOME/.canopus-node"
export PATH="$NODE_HOME/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local major; major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null) || return 1
  [ "$major" -ge 22 ]
}

if ! node_ok; then
  echo ">> Node.js 22+ not found — downloading a private copy to $NODE_HOME (no password needed)…"
  case "$(uname -m)" in
    arm64) PLAT=darwin-arm64 ;;
    *)     PLAT=darwin-x64 ;;
  esac
  BASE="https://nodejs.org/dist/latest-v22.x"
  FILE=$(curl -fsSL "$BASE/SHASUMS256.txt" | awk '{print $2}' | grep "node-v.*-$PLAT.tar.gz$" | head -1)
  if [ -z "$FILE" ]; then echo "!! Could not reach nodejs.org. Check your internet and try again."; read -r -p "Press Enter to close"; exit 1; fi
  TMP=$(mktemp -d)
  curl -fL --progress-bar "$BASE/$FILE" -o "$TMP/node.tar.gz" || { echo "!! Download failed"; read -r -p "Press Enter to close"; exit 1; }
  rm -rf "$NODE_HOME" && mkdir -p "$NODE_HOME"
  tar -xzf "$TMP/node.tar.gz" -C "$NODE_HOME" --strip-components=1
  rm -rf "$TMP"
  node_ok || { echo "!! Node install failed"; read -r -p "Press Enter to close"; exit 1; }
fi
echo ">> Using Node $(node -v)"

if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  echo ">> Installing packages (first time takes a few minutes)…"
  npm install --no-audit --no-fund || { echo "!! npm install failed"; read -r -p "Press Enter to close"; exit 1; }
  touch node_modules
fi

echo ">> Starting the website — it will open in your browser at http://localhost:8080"
echo ">> Keep this window open. Close it (or press Ctrl+C) to stop the site."
npm run dev -- --port 8080 --open
read -r -p "Website stopped. Press Enter to close"
