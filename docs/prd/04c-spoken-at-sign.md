# PRD-04c: speak "@" as "et" in the CTA, then re-render v3

## Context
The user approved the pronunciation "Dzaky es er de" and the pause after "Yuk," (PRD-04a), and asked for "@" to be spoken too, as "et". New last sentence: "Yuk, follow et Dzaky es er de." Only that sentence is re-voiced, so the caveat sentence the user already heard stays exactly as it is. The base is voice/samples/v3/el_liam_cta, which is itself a spliced take (its raw/request.json holds only the re-voiced close as "text", with the earlier narration in "previous_text", and "splice_base": "voice/samples/v3/el_liam").

## Part 1: a spliced take can be a splice base (voice/tts_elevenlabs.py, no credits)
- Add a helper, e.g. load_take(dir) -> (full_text, pcm, alignment), that rebuilds a take's raw (pre-edit) audio and alignment:
  - if dir/raw/request.json has no "splice_base": full_text = its "text", pcm = tts.decode_pcm(dir/raw/audio.mp3, sr=SR), alignment = dir/raw/alignment.json "alignment";
  - if it has "splice_base": (base_text, base_pcm, base_alignment) = load_take(that base, resolved from the repo root); full_text = request "previous_text" + request "text"; then join exactly as splice mode does (splice_join(base_pcm, base_alignment, len(previous_text), full_text, own decoded pcm, own alignment)). It must reproduce the same join as when the take was made (same t_cut and gain_db as in that take's raw/combined_alignment.json "splice" block; check this and exit with an error if they differ by more than 1e-3).
- splice_plan uses load_take for the base, so the base text check, the alignment and the base PCM come from the rebuilt full take. The voice_id and model_id check is unchanged.
- Show the helper is correct, with 0 credits: re-run the exact PRD-04a command (it reuses raw) into a copy in S, and also call load_take("voice/samples/v3/el_liam_cta") and confirm "".join(alignment characters) equals the current narration text before "et" was added (the committed narration_v3.txt, read BEFORE Part 2 edits) and the PCM length equals the joined length.
- Append "Revision 4 (PRD-04c): a spliced take can be a splice base; its raw audio and alignment are rebuilt from its splice chain, with no stored copy." to docs/prd/01-tts-elevenlabs.md, and update the splice paragraph of the module docstring in one sentence.

## Part 2: text sources
- research/script_v3.json, scene s6_close: vo_text -> "Ini rata-rata gaji bersih buruh, bukan bukti perusahaan tidak patuh. Yuk, follow et Dzaky es er de."; caption_display -> [{"spoken": "et Dzaky es er de", "show": "@dzakysrd"}]; on_screen_text: replace "while 'Dzaky es er de' is spoken" with "while 'et Dzaky es er de' is spoken"; append to "status": " | '@' spoken as 'et' (2026-10-27)". Nothing else.
- voice/samples/v3/narration_v3.txt -> " ".join of all scenes' vo_text (one line, trailing newline). Check: 105 whitespace words, no digits.

## Part 3: the take (ONE paid call, about 30 characters)
1. Read the subscription (character_count, character_limit only); stop if fewer than 1000 credits remain.
2. Run once:
   python3 voice/tts_elevenlabs.py voice/samples/v3/narration_v3.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --splice-base voice/samples/v3/el_liam_cta --splice-at "Yuk, follow" --out-dir voice/samples/v3/el_liam_cta2
   No second paid call for any reason. If it fails, report status and body and STOP.
3. Measure voice/samples/v3/el_liam_cta2/vo.mp3 yourself: ffprobe (codec, sample rate, channels, duration), ebur128 (I, true peak).
4. Check and report: words (105) and sentences (14); word texts equal the narration tokens (punctuation stripped); every word before "Yuk" has exactly the same start/end as in el_liam_cta/words.json; the gap "patuh" -> "Yuk"; gates hook (3.5), Jawa Barat (12.5), close = last end + 0.25 - start of "Ini" (7.0), total = last end + 0.25 (45), each PASS/FAIL; the last 8 words with times. If any gate FAILS, STOP after step 6 and do not do Part 4.
5. Cut S/close_preview2.mp3 from vo.mp3, from the start of "Ini" minus 1.0 s to the end.
6. Read the subscription again; report credits used and the new usage CSV row.

## Part 4: build, lint, render
1. video-01/video.v3.config.json: "variant" -> "el_liam_cta2" (nothing else). video-01/beats_v3.md line 5: "now el_liam_cta = ElevenLabs premade voice Liam, eleven_multilingual_v2, close re-voiced with the spoken username" -> "now el_liam_cta2 = ElevenLabs premade voice Liam, eleven_multilingual_v2, close re-voiced with the spoken username (@ read as et)".
2. In video-01/: `node tools/build_v3.mjs` and `node tools/lint_v3.mjs`, outputs saved to video-01/build/render/v3_lint.log (overwrite). If either fails, STOP and report verbatim.
3. Paste the caption chunk line from index_v3.html that contains "@dzakysrd"; confirm no caption shows "et" as its own word next to it.
4. Render: from video-01/, `bash tools/render_v3.sh` with the Bash tool's run_in_background option (timeout up to 7200000 ms), output to video-01/build/render/v3_render.log; wait for the completion notification, no sleep polling. If it dies, report the last 40 log lines, try exactly once more, then STOP.
5. Verify out/v3.mp4: ffprobe (video codec, 1080x1920, r_frame_rate, nb_frames, durations; audio codec, rate, channels). Video within 0.1 s of timeline total, audio within 0.1 s of video. ebur128: I -14 +/- 0.5 LUFS, true peak <= -1.0 dBTP.
6. Contact sheet: delete the old PNGs in video-01/build/v3/frames/ (quote the path), then extract frames from out/v3.mp4 at each beat start + 0.4 s and midpoint, each "numbers" t + 0.6 s, the start of "Yuk" + 0.2 s, the start of "et" + 0.1 s, the end of "de" - 0.05 s, and total - 0.3 s (word times from voice/samples/v3/el_liam_cta2/words.json; drop duplicate times). Name t_<2 decimals>.png, sort, and run `python3 video-01/build/v3/sheet.py video-01/out/v3_sheet.jpg 6 <files>`. Save a full-size PNG of the "et" + 0.1 s frame as S/username_frame.png.
7. Report `git status --short --untracked-files=all` and `git diff --stat`.

FINAL MESSAGE: the diff of voice/tts_elevenlabs.py, the Part 1 checks, the Part 2 diffs, the Part 3 printed summary (with the splice block), measurements, checks and gates, credits and the CSV row, the Part 4 lint output, caption line, render result, every value from step 5, the frame time list and paths, git status and diff --stat, and a key leak check (`grep -rF -c "$ELEVENLABS_API_KEY" voice/ docs/ research/ video-01/build/render/ S/ | grep -v ':0$'` prints nothing). Say plainly anything that failed or could not be verified.

## Outcome (2026-10-27, measured)
- One paid call: 30 credits; 1,384 of 10,000 used in total. voice/samples/v3/el_liam_cta2: 105 words, 14 sentences, -14.2 LUFS, true peak -2.0 dBTP; the 98 words before "Yuk" keep exactly the el_liam_cta times.
- Gates: hook 3.399 s (3.5), Jawa Barat 12.274 s (12.5), close 6.133 s (7.0), total 43.799 s (45). lint_v3 passed.
- out/v3.mp4: 1080x1920, 30 fps, 1314 frames, 43.80 s; audio 43.82 s; -13.9 LUFS, true peak -4.4 dBTP. Caption "Yuk follow @dzakysrd".
- Side effect: splicing at "Yuk, follow" re-voiced the pause after "Yuk,". It is now 0.16 s (0.50 s in el_liam_cta, which the user had approved). The user approved the result on 2026-10-27.
