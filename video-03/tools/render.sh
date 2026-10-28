#!/usr/bin/env bash
# video-03: build, lint, render 1080x1920 @ 30 fps from index.html, then set the MP4 audio to the loudness in video.config.json
# (two-pass linear loudnorm; video stream copied; AAC 192k, 48 kHz).
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/build.mjs
node tools/lint.mjs
OUT=$(python3 -c "import json;print(json.load(open('video.config.json')).get('output','out/v1.mp4'))")
mkdir -p "$(dirname "$OUT")" build/render
npx --yes hyperframes@0.8.206 render --resolution portrait --fps 30 -o build/render/raw.mp4
read -r LI LTP LLRA < <(python3 -c "import json;l=json.load(open('video.config.json'))['loudness'];print(l['I'],l['TP'],l['LRA'])")
RAW=build/render/raw.mp4
J=$(ffmpeg -hide_banner -nostats -i "$RAW" -map 0:a:0 -af "loudnorm=I=$LI:TP=$LTP:LRA=$LLRA:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r MI_I MI_TP MI_LRA MI_TH MI_OFF < <(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
ffmpeg -hide_banner -nostats -loglevel error -y -i "$RAW" -map 0:v:0 -map 0:a:0 -c:v copy \
  -af "loudnorm=I=$LI:TP=$LTP:LRA=$LLRA:measured_I=$MI_I:measured_TP=$MI_TP:measured_LRA=$MI_LRA:measured_thresh=$MI_TH:offset=$MI_OFF:linear=true" \
  -ar 48000 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "rendered $OUT"
