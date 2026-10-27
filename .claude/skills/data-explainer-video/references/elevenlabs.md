# ElevenLabs voiceover

Voice facts, lessons and exact commands. Run commands from the repo root.

## Key

- Environment variable `ELEVENLABS_API_KEY`: 51 characters, starts with `sk_`.
- Never print, log or commit it.
- Check that it is set without printing it:
  `test -n "$ELEVENLABS_API_KEY" && echo set`
- Leak check before every commit, on the paths you are about to commit:
  `grep -rF -c "$ELEVENLABS_API_KEY" <paths> | grep -v ':0$'`
  It must print nothing. An empty variable makes grep match every line, so run the set check first.

## Account check (costs nothing)

- GET `https://api.elevenlabs.io/v1/user/subscription` returns `character_count` and `character_limit`. The repo sends the key in the `xi-api-key` header (`voice/tts_elevenlabs.py`).
- Print only the two fields:
  `curl -sS https://api.elevenlabs.io/v1/user/subscription -H "xi-api-key: $ELEVENLABS_API_KEY" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["character_count"], d["character_limit"])'`

## Script

- `voice/tts_elevenlabs.py` writes the same outputs as `voice/tts.py`: `vo.mp3`, `words.json`, `sentences.json`.
- It calls `/v1/text-to-speech/{voice_id}/with-timestamps` and converts the character alignment to words.
- Every paid call is logged in `voice/elevenlabs_usage.csv`.

## Voice

- Premade voice Liam, voice ID `TX3LPaxmHKxFdv7VOQHJ`: an American-accent premade voice speaking Indonesian. Model `eleven_multilingual_v2`, default voice settings.
- The user found the edge-tts voice Ardi (`voice/tts.py`) too stiff.
- Free plan: Voice Library voices are refused through the API with HTTP 402 `paid_plan_required`, even when the library lists `free_users_allowed` true. Premade voices work.
- The 402 message offers upgrading to Creator or adding $5 of credits.
- Unverified: the free plan is reported as non-commercial with attribution required. This was not checked against ElevenLabs' terms.

## Commands

Preview of the opening (about 12 s). Text: `voice/samples/elevenlabs/preview/preview_text.txt`. One paid call per voice:

```
python3 voice/tts_elevenlabs.py voice/samples/elevenlabs/preview/preview_text.txt --voice-id <voice_id> --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --out-dir voice/samples/elevenlabs/preview/<name>
```

Full take (video-01 v3):

```
python3 voice/tts_elevenlabs.py voice/samples/v3/narration_v3.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --out-dir voice/samples/v3/<take>
```

Splice (re-voices only the text from `--splice-at` on). Command used for take `el_liam_cta`, base `el_liam`:

```
python3 voice/tts_elevenlabs.py voice/samples/v3/narration_v3.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --splice-base voice/samples/v3/el_liam --splice-at "Ini rata-rata" --out-dir voice/samples/v3/el_liam_cta
```

Re-processing: raw responses are cached in `<take>/raw/`, so a changed `--max-pause` costs 0 credits. `--force-api` forces a new call.

## Credits

- Free plan: 10,000 credits per month.
- With `eleven_multilingual_v2`, each call cost exactly the number of characters sent. Measured: 54, 179, 667, 96, 30. `previous_text` was not billed.
- The subscription counter lags 20-30 s after a call. The script therefore takes the cost from the character-cost response header.
- One paid call per step. No retries without the user's OK.

## Loudness

- Raw ElevenLabs audio measured about -22 to -24 LUFS with peaky transients. A plain linear loudnorm cannot reach -14 LUFS.
- The script applies gain, then a 192 kHz limiter at -2 dBFS. Result: -14 +/- 0.3 LUFS, true peak <= -1.5 dBTP. Word timing does not move.

## Splice mode

- `--splice-base DIR --splice-at TEXT` re-voices only the text from TEXT on. It sends the earlier text as `previous_text`, level-matches the new part, and joins it onto the base take in the silence before TEXT. Earlier word times stay the same.
- A spliced take can itself be a splice base.
- Lesson: the splice point must come after any pause you want to keep. Splicing at "Yuk, follow" re-voiced the comma pause after "Yuk," (0.50 s became 0.16 s).
- `--max-pause` only shortens pauses between sentences, not pauses at commas.

## Takes (video-01 v3)

- `voice/samples/v3/el_liam`: full take.
- `voice/samples/v3/el_liam_cta`: close re-voiced.
- `voice/samples/v3/el_liam_cta2`: CTA with "et". Final. `video-01/video.v3.config.json` names it as `voice.variant`.
- Previews: `voice/samples/elevenlabs/preview/`.
