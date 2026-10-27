#!/usr/bin/env bash
# v3: build, lint, render 1080x1920 @ 30 fps from index_v3.html, then set the MP4 audio to -14 LUFS with true peak <= -1.5 dBTP (two-pass loudnorm, video copied).
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/build_v3.mjs
node tools/lint_v3.mjs
mkdir -p out build/render
npx --yes hyperframes@0.8.206 render -c index_v3.html --resolution portrait --fps 30 -o build/render/v3-raw.mp4
RAW=build/render/v3-raw.mp4
J=$(ffmpeg -hide_banner -nostats -i "$RAW" -map 0:a:0 -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r MI_I MI_TP MI_LRA MI_TH MI_OFF < <(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
ffmpeg -hide_banner -nostats -loglevel error -y -i "$RAW" -map 0:v:0 -map 0:a:0 -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$MI_I:measured_TP=$MI_TP:measured_LRA=$MI_LRA:measured_thresh=$MI_TH:offset=$MI_OFF:linear=true" \
  -ar 48000 -c:a aac -b:a 192k -movflags +faststart out/v3.mp4
echo "rendered out/v3.mp4"
