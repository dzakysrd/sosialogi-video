# PRD-04b: show @dzakysrd in the caption, start the final card at "Yuk", re-render v3

## Context
PRD-04a produced voice/samples/v3/el_liam_cta: the Liam take whose close now ends "Yuk, follow Dzaky es er de." and no longer says "Sumbernya ada di layar." research/script_v3.json scene s6_close has cue_words ["Ini", "Yuk", "Follow"] and "caption_display": [{"spoken": "Dzaky es er de", "show": "@dzakysrd"}]. All gates pass on that take (hook 3.399, Jawa Barat 12.274, close 6.482, total 44.148).

## Changes (the only hand edits allowed)
1. video-01/tools/build_v3.mjs
   a. The line `C("sumber", "Sumbernya", T.ini);` becomes `C("sumber", "Yuk", T.ini); // final card starts at the CTA ("Sumbernya ada di layar." was dropped)`. Keep the key "sumber": lint_v3.mjs reads tl.cues.sumber.
   b. Captions: before the caption grouping, build a list capWords from words. For every entry in every scene's caption_display (scenes from the script already loaded by build_v3.mjs; entries are optional), split "spoken" on whitespace and find each run of consecutive words whose texts match those tokens (lowercase, compared after removing characters that are not letters or digits). Replace each run by one caption word {text: show, start: first.start, end: last.end, i: index of the first word}. All other words stay as {...w, i}. If a caption_display entry matches no run, call fail() with a clear message. Then run the existing grouping loop over capWords instead of words, unchanged except that sentenceBreak uses sentStartIdx.has(w.i) (the original word index). Span ids and the on/off highlight use w.i, w.start and w.end as now. Match the file's style (short comment, same naming).
2. video-01/video.v3.config.json: "voice.variant" "el_liam" -> "el_liam_cta". Nothing else.
3. video-01/beats_v3.md:
   - line 5: "now el_liam = ElevenLabs premade voice Liam, eleven_multilingual_v2" -> "now el_liam_cta = ElevenLabs premade voice Liam, eleven_multilingual_v2, close re-voiced with the spoken username".
   - In the B8 row, replace "Sumbernya (36.38)" with "Yuk". In the B9 row replace "Sumbernya (36.38)" with "Yuk" (both places), and "Close holds about 3 s." with "Close holds about 2.6 s; the caption shows @dzakysrd while the username is spoken.". Do not change columns 1 to 3 of any row (lint parses id and framing).
4. Regenerated files (index_v3.html, build/v3/timeline.json, assets/v3/*, out/v3.mp4, out/v3_sheet.jpg, logs) change as a result. out/v3_caption.txt does NOT change.

## Steps
A. In video-01/: `node tools/build_v3.mjs` and `node tools/lint_v3.mjs`; save both outputs to video-01/build/render/v3_lint.log (overwrite). If either fails, STOP and report verbatim; do not change gates, text or lint to make them pass. The HyperFrames browser is already installed (npx hyperframes@0.8.206 browser ensure was run earlier); if lint cannot find it, run that command once.
B. Check the generated index_v3.html: grep the caption chunk that contains "@dzakysrd" and paste that whole <div class="clip cap ...">...</div> line; confirm no caption chunk contains "Dzaky", "es er de" as separate words. Paste build/v3/timeline.json cues "sumber" and "follow", and the B8/B9 beat start/end.
C. Render: from video-01/, run `bash tools/render_v3.sh` with the Bash tool's run_in_background option (timeout up to 7200000 ms), output to video-01/build/render/v3_render.log, and wait for the completion notification (no sleep polling). If it dies, report the last 40 log lines, try exactly once more, then STOP if it fails again.
D. Verify out/v3.mp4 yourself: ffprobe (video codec, 1080x1920, r_frame_rate, nb_frames, video duration; audio codec, sample rate, channels, duration). Video duration within 0.1 s of timeline total; audio within 0.1 s of video. ebur128 on the audio: I -14 +/- 0.5 LUFS, true peak <= -1.0 dBTP.
E. Contact sheet: extract frames from out/v3.mp4 into video-01/build/v3/frames/ (delete old PNGs there first) at: each beat start + 0.4 s and midpoint; each "numbers" entry t + 0.6 s; plus the start of "Yuk" + 0.2 s, the start of "Dzaky" + 0.3 s, the end of "de" - 0.05 s (times from voice/samples/v3/el_liam_cta/words.json), and total - 0.3 s. Name t_<2 decimals>.png, sort by time, and build `python3 video-01/build/v3/sheet.py video-01/out/v3_sheet.jpg 6 <files>`. Also save a full-size PNG of the "Dzaky" + 0.3 s frame as S/username_frame.png.
F. Report `git status --short --untracked-files=all` and `git diff --stat`, plus `git diff video-01/tools/build_v3.mjs video-01/video.v3.config.json video-01/beats_v3.md`.

FINAL MESSAGE: lint output (pass/fail lines and notes), B results, render result, every value from D, the E time list and paths, and F. Say plainly anything that failed or could not be verified.

## Outcome (2026-10-27, measured)
- build_v3 and lint_v3 passed. Captions: one chunk "Yuk follow @dzakysrd" (cap-28); no caption shows "Dzaky", "es", "er" or "de". Final card starts at "Yuk" (41.506 s).
- out/v3.mp4: 1080x1920, 30 fps, 1325 frames, 44.17 s; audio 44.18 s; -14.0 LUFS, true peak -4.3 dBTP.
- The user then asked for "@" to be spoken as "et" ("Yuk, follow et Dzaky es er de."). That is PRD-04c; this render is a checkpoint.
