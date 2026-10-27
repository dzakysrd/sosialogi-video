# PRD-04a: spoken username in the v3 close, by re-voicing only the close scene

## Context
The user wants the CTA to say their username, pronounced "Dzaky es er de" (the letters S, R, D read as Indonesian letter names). To stay within the close gate (7.0 s) and total gate (45 s), the user chose to drop the sentence "Sumbernya ada di layar." (the sources stay on the final card and in the caption). Only the close scene is re-voiced and spliced onto the existing Liam take (voice/samples/v3/el_liam), so every earlier timing stays exactly as it is.

New close scene text (scene s6_close):
Ini rata-rata gaji bersih buruh, bukan bukti perusahaan tidak patuh. Yuk, follow Dzaky es er de.

## Part 1: text sources
1. research/script_v3.json, scene "s6_close": vo_text -> the new close text above; cue_words -> ["Ini", "Yuk", "Follow"]; on_screen_text -> "caveat card -> sources (30 px, 2 lines) + CTA pill Follow @dzakysrd; caption shows @dzakysrd while 'Dzaky es er de' is spoken"; add a new key "caption_display": [{"spoken": "Dzaky es er de", "show": "@dzakysrd"}]. Change nothing else in the file except the "status" string, to which you append " | v3 close: username spoken as 'Dzaky es er de', 'Sumbernya ada di layar.' dropped (2026-10-27)".
2. voice/samples/v3/narration_v3.txt -> " ".join of all scenes' vo_text from the updated script_v3.json (one line, trailing newline). Check: 104 whitespace words, no digits.

## Part 2: splice mode in voice/tts_elevenlabs.py
Add two options:
  --splice-base DIR   an existing take whose DIR/raw/ holds a full-text response (request.json, alignment.json, audio.mp3)
  --splice-at TEXT    where the re-voiced part starts in the INPUT text
Rules:
- text = INPUT text (tts.load_text). TEXT must occur exactly once in text; k = its index; prefix = text[:k]; suffix = text[k:].
- The base request.json "text" must start with exactly prefix and continue with TEXT at index k; its voice_id and model_id must equal --voice-id and --model. Otherwise exit with a clear error.
- The API request is build_request(args, suffix) plus "previous_text": prefix (sent in the POST body, kept in raw/request.json), plus "splice_base" (the base dir, relative to the repo root) and "splice_at" in raw/request.json only (not in the POST body). The raw cache, credit logging and usage CSV work exactly as for a normal call, so a re-run with the same request costs 0 credits. If the API rejects previous_text, exit with the status and body; do not retry without it.
- Combine (after the call or the cache reuse):
  a. Decode base raw/audio.mp3 and the new raw/audio.mp3 to 44.1 kHz mono PCM (tts.decode_pcm(path, sr=44100)).
  b. In the base alignment: prev_end = end time of the last non-whitespace character before index k; next_start = start time of character k. t_cut = (prev_end + next_start) / 2.
  c. Level match: integrated loudness (ffmpeg ebur128) of the base PCM over [max(0, t_cut - 10), t_cut] and of the whole new PCM; gain the new PCM by (base - new) dB, clamped to +/-3 dB. Record both values and the gain.
  d. Audio = base PCM [0, t_cut] with a 10 ms linear fade-out at its end + gained new PCM with a 5 ms linear fade-in at its start.
  e. Alignment = base characters [0, k) with their base times (clamp any end time > t_cut to t_cut) + new characters with every time + t_cut. "".join(characters) must equal text (use check_alignment).
  f. Write DIR_OUT/raw/combined_alignment.json and a summary block "splice": {base, at, t_cut, prev_end, next_start, base_tail_lufs, new_lufs, gain_db}.
  g. Continue with the normal pipeline on the combined PCM and alignment (alignment_words, check_timing, tts.group_sentences, tts.edit_timeline sr=44100, tts.retime, write_wav, normalize_to_mp3), so outputs (vo.mp3, words.json, sentences.json) have the same format as any take.
- Without --splice-base the script must behave exactly as before (re-run one preview from its cache to show this: same words.json, 0 credits).
- Add mock tests for splice in S (no network): combine math on synthetic data, the prefix check failure, previous_text in the body, cache reuse. Update the module docstring with the two options. Append a "Revision 3 (PRD-04a): splice mode" note to docs/prd/01-tts-elevenlabs.md describing the options in two or three sentences.

## Part 3: the take (ONE paid call, about 100 characters)
1. Read the subscription (character_count, character_limit only). Stop if fewer than 1000 credits remain.
2. Run once:
   python3 voice/tts_elevenlabs.py voice/samples/v3/narration_v3.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --splice-base voice/samples/v3/el_liam --splice-at "Ini rata-rata" --out-dir voice/samples/v3/el_liam_cta
   No second paid call for any reason. If it fails, report the status and body and STOP.
3. Measure voice/samples/v3/el_liam_cta/vo.mp3 yourself: ffprobe (codec, sample rate, channels, duration) and ebur128 (I, true peak).
4. Check and report:
   - words (104) and sentences (14); the word texts in order equal the whitespace tokens of narration_v3.txt with leading/trailing punctuation stripped;
   - every word before "Ini" has exactly the same start and end in el_liam_cta/words.json as in el_liam/words.json (list any difference);
   - the gap between the last word before "Ini" and "Ini" (should be 0.16 or less);
   - gates: hook (end of word 8 minus start of word 1, limit 3.5), Jawa Barat (start of "Ini" minus start of the first "Jawa", limit 12.5), close (last word end + 0.25 minus start of "Ini", limit 7.0), total (last word end + 0.25, limit 45). PASS/FAIL each; do not fix a FAIL.
   - the words and times of the last 8 words.
5. Make S/close_compare.wav is NOT needed. Instead cut the close for the user to hear: ffmpeg from el_liam_cta/vo.mp3, start = start of "Ini" minus 3.0 s, to the end, as S/close_preview.mp3 (copy codec is fine). Report its path and duration.
6. Read the subscription again.

FINAL MESSAGE: diff of voice/tts_elevenlabs.py, research/script_v3.json and narration_v3.txt (git diff), mock test results, the no-splice regression result, the Part 3 printed summary (including the splice block), your measurements, the checks and gates table, credits before/after and the new usage CSV row, a key leak check (`grep -rF -c "$ELEVENLABS_API_KEY" voice/ docs/ research/ S/ | grep -v ':0$'` prints nothing), and `git status --short --untracked-files=all`. Say plainly anything that failed or could not be verified.

## Outcome (2026-10-27, measured)
- One paid call: 96 credits (previous_text was not billed); 1,354 of 10,000 used in total.
- voice/samples/v3/el_liam_cta: 104 words, 14 sentences, -14.1 LUFS, true peak -2.0 dBTP. The 88 words before "Ini" keep exactly the el_liam times. Splice at raw 42.93 s, level-match gain -0.5 dB; the seam decays smoothly to about -67 dBFS with no spike.
- Gates: hook 3.399 s (3.5), Jawa Barat 12.274 s (12.5), close 6.482 s (7.0), total 44.148 s (45). All pass.
- The comma pause after "Yuk," is 0.50 s (not trimmed by --max-pause, which only shortens sentence boundaries).
- Not judged by ear by the reviewer: pronunciation of "Dzaky es er de" and the seam; sent to the user.
