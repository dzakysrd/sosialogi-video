# Review checklist

Run every check before you report a render. Paste each command's result verbatim into the report. Say what you did not check. Run commands from the repo root.

## 1. Voice take (before the render)

- [ ] Word count of `<take>/words.json` equals the word count of the script. `video-01/tools/lint_v3.mjs` checks this.
- [ ] Sentence count of `<take>/sentences.json` equals the sentence count of the script. Count both the same way; this is not a lint check.
- [ ] Word texts equal the narration tokens. Compare word characters only, because the take's `words.json` drops the punctuation that `narration_v3.txt` keeps:
  `python3 -I -c "import json,re,sys; norm=lambda t: re.sub(r'\W','',t); w=[norm(x['text']) for x in json.load(open(sys.argv[1]))]; n=[t for t in (norm(x) for x in open(sys.argv[2],encoding='utf-8').read().split()) if t]; print('equal' if w==n else ('DIFF', len(w), len(n)))" <take>/words.json voice/samples/v3/narration_v3.txt`
  It must print `equal`.
- [ ] Gates computed from `words.json` pass. Build, then lint. The lint needs headless Chrome (`npx hyperframes@0.8.206 browser ensure`):
  `node video-01/tools/build_v3.mjs && node video-01/tools/lint_v3.mjs`

## 2. Video file (ffprobe)

- [ ] Command:
  `ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration,sample_rate,channels -of compact video-01/out/v3.mp4`
- [ ] Video is 1080x1920.
- [ ] `r_frame_rate` is 30/1.
- [ ] Video duration is within 0.1 s of the timeline total in `video-01/build/v3/timeline.json` (key `total`).
- [ ] Audio duration is within 0.1 s of the video duration.

## 3. Loudness

- [ ] Command:
  `ffmpeg -hide_banner -nostats -i video-01/out/v3.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1`
  Read the summary at the end of the output: the "Integrated loudness" and "True peak" lines.
- [ ] Integrated loudness is -14 +/- 0.5 LUFS.
- [ ] True peak is <= -1.0 dBTP.
- Note: a mono VO placed on both stereo channels reads about 3 dB louder than the mono file (EBU R128 sums the channels). The render's loudnorm pass accounts for it.

## 4. Contact sheet (frames)

- [ ] Choose frames from `video-01/out/v3.mp4` at:
  - each beat start + 0.4 s, and the midpoint of each beat (beat starts and ends: `video-01/build/v3/timeline.json`, key `beats`);
  - each on-screen number at its cue + 0.6 s;
  - the CTA moments;
  - the total - 0.3 s (key `total`).
- [ ] Extract each frame into the scratch directory, not the repo. Plain ffmpeg, not a repo script:
  `ffmpeg -hide_banner -loglevel error -ss <t> -i video-01/out/v3.mp4 -frames:v 1 -y <scratch>/<frame>.png`
- [ ] Build the sheet, frames in time order:
  `python3 video-01/build/v3/sheet.py <scratch>/<out.jpg> 6 <frames in time order>`
- [ ] Look at the sheet.

## 5. Numbers

- [ ] Recompute every on-screen figure from `research/data.csv`, including counts such as "24 of 38". Compare each one with the frames.
- [ ] The map colouring equals the set computed from the data.
- [ ] The caption figures equal the same recomputed values.

## 6. Audio

- [ ] Send the previews or the final video to the user for listening.
- [ ] State in the report that you did not hear the audio.

## 7. Report

- [ ] List what was not verified (for example: only sampled frames, terms not checked).
- [ ] No invented numbers, sources or URLs. Unverified-media figures stay labelled.
