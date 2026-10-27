# PRD-03a: loudness fix and full v3 take with ElevenLabs Liam

## Context
The user picked the premade voice Liam (TX3LPaxmHKxFdv7VOQHJ) for video-01 v3. The previews (docs/prd/02-elevenlabs-previews.md) missed -14 LUFS by up to 0.9 LU: raw ElevenLabs audio is about -22 to -24 LUFS with peaky transients, so tts.loudnorm_to_mp3 (linear loudnorm) cannot reach -14 without the true peak going over, and lands low. video-01/tools/render_v3.sh later runs a linear loudnorm to -14 LUFS / TP -1.5 on the rendered MP4, so the VO must already be at -14 LUFS with true peak <= -1.5 dBTP for that pass to stay linear.

## Part 1: loudness stage in voice/tts_elevenlabs.py (no credits)
- Do NOT change voice/tts.py. Add a function in voice/tts_elevenlabs.py, e.g. normalize_to_mp3(wav, out_mp3), and use it in main() instead of the tts.TP_TARGETS / tts.loudnorm_to_mp3 loop.
- Method: measure the integrated loudness I0 of the edited wav with ffmpeg ebur128. gain_db = -14 - I0. Encode with
  -af "volume={gain_db}dB,aresample=192000,alimiter=limit={L}:attack=1:release=50:level=0[,latency=1 if this ffmpeg's alimiter has that option],aresample=48000" -c:a libmp3lame -b:a 256k
  where L is the linear value of -2.0 dBFS (10**(-2/20)). Check `ffmpeg -h filter=alimiter` first for the exact option names in this ffmpeg build and use the real ones. level must be off (no auto make-up gain).
- Then measure the MP3 with tts.measure_loudness. If |I - (-14)| > 0.3, adjust gain_db by (-14 - I) and re-encode. If TP > -1.5, lower the limit by 0.5 dB and re-encode. At most 4 encodes in total; if still out of range, exit non-zero with the measured values.
- Speech is never stretched or sped up; this stage only changes level and limits peaks. Word timing must not move (the resample and limiter must not shift audio by more than 5 ms; verify by comparing the duration of the wav and the mp3 output, and say how you verified latency).
- The printed summary keeps integrated_lufs and true_peak_dbtp, replaces tp_target_used with limiter_db (the final limit in dBFS) and gain_db, and adds encodes (count).
- Update the module docstring line about loudness to describe the new stage. Append a short "Revision 2" note to the end of docs/prd/01-tts-elevenlabs.md: "Revision 2 (PRD-03a): loudness now uses gain + 192 kHz limiter at -2 dBFS before MP3 encoding, target -14 +/- 0.3 LUFS, true peak <= -1.5 dBTP; tts.py is unchanged."

Part 1 acceptance (0 credits): copy each voice/samples/elevenlabs/preview/<name>/raw/ (liam, daniel, alice) into S/loud/<name>/raw/ and run the script on S/loud/<name> with the same command as the previews (text voice/samples/elevenlabs/preview/preview_text.txt, --voice-id as in raw/request.json, --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2). It must reuse raw (0 credits). For each, measure the output yourself with `ffmpeg -i vo.mp3 -af ebur128=peak=true -f null -` and report I and true peak: I must be -14.0 +/- 0.3 and true peak <= -1.5. Also confirm words.json in S/loud/<name>/ is identical to the committed voice/samples/elevenlabs/preview/<name>/words.json (timing unchanged). Do not touch the committed preview folders. If Part 1 fails, STOP and report; do not do Part 2.

## Part 2: full v3 take with Liam (about 667 credits, ONE paid call)
1. Check first: the whitespace-normalised text of voice/samples/v3/narration_v3.txt must equal " ".join of the scenes' vo_text in research/script_v3.json, and have 104 whitespace words. If not, STOP and report the difference.
2. Read the subscription (GET https://api.elevenlabs.io/v1/user/subscription, report character_count and character_limit only). If fewer than 1000 credits remain, STOP.
3. Run once:
   python3 voice/tts_elevenlabs.py voice/samples/v3/narration_v3.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --out-dir voice/samples/v3/el_liam --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2
   Never run a second paid call (no retry, no other settings). If it fails, report status and body verbatim and STOP.
4. Measure voice/samples/v3/el_liam/vo.mp3 yourself: ffprobe (codec, sample rate, channels, duration) and ebur128 I and true peak.
5. From voice/samples/v3/el_liam/words.json compute and report (these are the v3 build gates from video-01/video.v3.config.json; do not edit the config or any build tool):
   - words (must be 104) and sentences (must be 15);
   - hook span = end of word 8 minus start of word 1 (limit 3.5 s);
   - Jawa Barat section = start of the word "Ini" (the first word of the sentence "Ini rata-rata gaji bersih buruh, ...") minus start of the first "Jawa" (limit 11.0 s);
   - close = (last word end + 0.25) minus start of that "Ini" (limit 7.0 s);
   - total = last word end + 0.25 (limit 45 s);
   - largest gap between consecutive words, and where.
   Mark each gate PASS or FAIL. Do not try to fix a FAIL; just report it.
6. Read the subscription again and report character_count.

FINAL MESSAGE: the diff of voice/tts_elevenlabs.py (against HEAD), the Part 1 table (name | I | TP | words.json identical | encodes | limiter_db | gain_db), the Part 2 printed summary, your measurements, the gates table, credits before/after, the last row of voice/elevenlabs_usage.csv, a key leak check (`grep -rF -c "$ELEVENLABS_API_KEY" voice/ docs/ S/ | grep -v ':0$'` must print nothing), and `git status --short --untracked-files=all`.

## Outcome (2026-10-27, measured)
- Part 1: pass. Preview re-runs from raw/ (0 credits): liam -14.1 LUFS, daniel -14.1, alice -14.2; true peak -2.0 dBTP for all; words.json unchanged; no time shift (cross-correlation lag 0).
- Part 2: one paid call, 667 credits (1,258 of 10,000 used in total). voice/samples/v3/el_liam: 104 words, 15 sentences, -14.2 LUFS, true peak -2.0 dBTP.
- Gates: hook 3.399 s (limit 3.5) pass; Jawa Barat section 12.274 s (limit 11.0) FAIL; close 6.944 s (limit 7.0) pass; total 44.61 s (limit 45) pass.
- Comma pauses inside the Jawa Barat section are 0.29 s each (after "se-Indonesia" and "Karawang"), so trimming them alone cannot recover 1.27 s. Next step waits for the user's decision.
