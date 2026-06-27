#!/usr/bin/env bash
# ============================================================
#  COMMON GROUND - macOS / Linux local launcher
#  Run:  ./start.sh    (or: bash start.sh)
#  Tries a local server (best); falls back to opening the file.
# ============================================================
cd "$(dirname "$0")" || exit 1
PORT=8099

echo ""
echo "  ========================================="
echo "    COMMON GROUND"
echo "    Lead the team. Earn the trust."
echo "    Leave no one behind."
echo "  ========================================="
echo ""

open_browser() {
  URL="$1"
  if command -v open >/dev/null 2>&1; then open "$URL"        # macOS
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"  # Linux
  else echo "  Please open this address in your browser: $URL"; fi
}

if command -v python3 >/dev/null 2>&1; then
  echo "  Starting local server at http://localhost:$PORT"
  echo "  Opening your browser... (Press Ctrl+C here to stop.)"
  echo ""
  ( sleep 1; open_browser "http://localhost:$PORT/index.html" ) &
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  echo "  Starting local server at http://localhost:$PORT"
  ( sleep 1; open_browser "http://localhost:$PORT/index.html" ) &
  python -m http.server "$PORT"
else
  echo "  Python not found - opening the game file directly."
  echo "  The game works fully this way."
  open_browser "index.html"
fi
