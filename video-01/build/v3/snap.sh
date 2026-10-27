#!/usr/bin/env bash
# Stills of index_v3.html at the given times (seconds). Output: build/v3/snap/t_<t>.png
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CH=$(find /root/.cache/hyperframes/chrome -name chrome-headless-shell -type f | head -1)
mkdir -p "$ROOT/build/v3/snap"
for d in assets vendor; do [ -e "$ROOT/build/v3/snap/$d" ] || ln -s "$ROOT/$d" "$ROOT/build/v3/snap/$d"; done
for t in "$@"; do
  f="$ROOT/build/v3/snap/s_$t.html"
  python3 - "$ROOT/index_v3.html" "$f" "$t" <<'PY'
import sys
src, dst, t = sys.argv[1], sys.argv[2], sys.argv[3]
html = open(src, encoding="utf-8").read()
inj = "<script>window.__timelines.main.seek(%s,false);</script></body>" % t
open(dst, "w", encoding="utf-8").write(html.replace("</body>", inj))
PY
  "$CH" --headless --no-sandbox --disable-gpu --hide-scrollbars --window-size=1080,1920 --virtual-time-budget=20000 \
    --screenshot="$ROOT/build/v3/snap/t_$t.png" "file://$f" >/dev/null 2>&1
  echo "t_$t.png"
done
