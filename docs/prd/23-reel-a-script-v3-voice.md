# PRD-23: Reel A script v3 (CTA, spoken forms) and the full voice take

## Context
- script_v2 (research/electropower/reel-a/script_v2.json, commit d764103): approved texts; CTA was a placeholder.
- User (2026-10-30): CTA is "follow @RDNRE", pronounced "et er de en er e". "Lanjut aja dulu": proceed to the voice.
- Voice chosen earlier by the user: ElevenLabs premade Liam (TX3LPaxmHKxFdv7VOQHJ), eleven_multilingual_v2, default settings, --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 (as video-01 and video-02).
- Pronunciation: Liam is an American-accent voice. Abbreviations are written in vo_text as Indonesian letter names so they are read correctly; on-screen text keeps the abbreviation. Mapping uses "caption_display" (as video-01's CTA mapped "et Dzaky es er de" to "@dzakysrd"): pe-en -> p-n, de-se -> DC, a-se -> AC, "et er de en er e" -> "@RDNRE".

## Changes allowed
docs/prd/23-reel-a-script-v3-voice.md; research/electropower/reel-a/script_v3.json and script_v3.md (new; do not edit v1/v2); voice/samples/ep-reel-a/narration_v3.txt; voice/samples/ep-reel-a/el_liam/ (outputs of voice/tts_elevenlabs.py); voice/elevenlabs_usage.csv (appended by the script only). Nothing else.

## Steps
1. script_v3.json = copy of script_v2.json with only these changes:
   - "version" "v3"; "status" "v3 (2026-10-30): CTA follow @RDNRE; spoken forms for p-n, DC, AC".
   - "cta": "Follow @RDNRE".
   - s1_hook cue_words: add "cahaya" (keep "panas").
   - s2_cahaya vo_text: replace "sambungan p-n" with "sambungan pe-en"; cue_words "sambungan p-n" -> "sambungan pe-en"; add "caption_display": {"pe-en": "p-n"}.
   - s4_dc vo_text exactly: "Listrik dari panel itu arus searah, atau de-se. Untuk diubah ke a-se, sering dipakai inverter." add "caption_display": {"de-se": "DC", "a-se": "AC"}.
   - s7_cta: vo_text exactly "Yuk, follow et er de en er e." on_screen_text "FOLLOW @RDNRE"; visual "Kartu penutup (g): FOLLOW @RDNRE"; cue_words ["follow"]; "caption_display": {"et er de en er e": "@RDNRE"}; fact_refs ["none"].
   - everything else identical to v2.
   script_v3.md: same layout as script_v2.md, with a "Perubahan dari v2" list and a "Pengucapan" note listing the four mappings.
2. narration_v3.txt = " ".join of all scenes' vo_text in order (s1..s7), one line, final newline. Print it and its character count (python len).
3. Credits check (free): run the subscription command from references/elevenlabs.md that prints only character_count and character_limit. STOP if limit - count < 2 x the narration length.
4. The one paid call:
   python3 voice/tts_elevenlabs.py voice/samples/ep-reel-a/narration_v3.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --out-dir voice/samples/ep-reel-a/el_liam
   (Run it in the foreground with a 5-minute timeout.)
5. Checks, print verbatim:
   a. ffprobe duration of vo.mp3; loudness: `ffmpeg -hide_banner -nostats -i voice/samples/ep-reel-a/el_liam/vo.mp3 -af ebur128=peak=true -f null - 2>&1 | tail -12`.
   b. words.json word count vs the whitespace-token count of narration_v3.txt; first 5 and last 8 word texts with start/end.
   c. Per scene: start of its first word and end of its last word (match by walking the tokens in order), and the scene duration. Gates: s1 end <= 3.5 s; total (last word end + tail) <= 45 s; s7 (CTA) duration reported. Print PASS/FAIL per gate. If a gate fails, do NOT change text or call the API again: report.
   d. The last line of voice/elevenlabs_usage.csv.
   e. Leak check: `grep -rFHc "$ELEVENLABS_API_KEY" voice/samples/ep-reel-a docs/prd/23-reel-a-script-v3-voice.md research/electropower/reel-a voice/elevenlabs_usage.csv | grep -v ':0$'` must print nothing (if it prints, STOP without showing the lines).

## Acceptance
Step 5 checks printed; one paid call logged; word counts equal.

## Budget
One paid call of about the narration's character count (expected about 650-750 credits).

## Report
Paste verbatim: narration_v3.txt with its character count, credits before, the step 4 console output (no key), all step 5 outputs, `git status --short --untracked-files=all`, and the absolute path of vo.mp3.

## Outcome (2026-10-30, reviewed by the main agent)
- One paid call, 745 credits (usage 3062 of 10000 after the call). Take voice/samples/ep-reel-a/el_liam: vo.mp3 48.552 s (ffprobe, checked by the main agent), 114 words = 114 narration tokens, -14.2 LUFS, true peak -1.9 dBFS.
- Gates: hook s1 ends at 3.225 s (PASS, limit 3.5). Total 48.5 s: FAIL against the 45 s limit. Text and gate unchanged; decision sent to the user. The audio was sent to the user for listening (pronunciation of pe-en, de-se, a-se, the CTA); the main agent cannot hear it.
