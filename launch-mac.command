#!/bin/zsh
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Start lightweight local HTTP server on port 8766 if not already running
if ! lsof -i :8766 >/dev/null 2>&1; then
  nohup python3 -m http.server 8766 --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 0.4
fi

# Open PARALLEL in Google Chrome
open -a "Google Chrome" "http://localhost:8766/index.html"
