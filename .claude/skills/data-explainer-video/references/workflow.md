# Workflow: data-explainer video

The 8 steps in full detail. video-01 is the worked example. Run commands from the repo root unless a step says otherwise.

## 1. Research

- Data lives in `research/`.
- Keep the raw download unchanged. video-01: `research/bps_upah_feb2026.csv`.
- Build the merged table `research/data.csv` with a re-runnable script: `research/tools/merge.py`.
- `research/sources.md` holds the source details and the raw file's sha256.
- The BPS website blocks requests from servers (Cloudflare). The user downloads files from bps.go.id by hand. Never try to get around the block.
- Figures taken from media and not yet checked against an official source are labelled `unverified-media`, and the caption says so. video-01: UMP 2026 from detik.com and kompas.tv, citing Kemnaker.

## 2. Script

- File: `research/script_vN.json` (video-01: `research/script_v3.json`).
- Top-level keys: `scenes`, `word_count_target`, `max_seconds`.
- Each scene has: `id`, `vo_text`, `on_screen_text`, `visual`, `cue_words`, and optionally `caption_display`.
- Rules from video-01. `video-01/tools/lint_v3.mjs` enforces them for v3.
  - Numbers are spelled out in words in `vo_text`. No digits.
  - Every number shown on screen is spoken at its cue.
  - On-screen numbers are derived from the data file, not typed by hand.
  - Add a caveat where the data could be misread. video-01: "Ini rata-rata gaji bersih buruh, bukan bukti perusahaan tidak patuh."
  - video-01 bans the word "melanggar" in the VO.
- The CTA speaks the username as "Yuk, follow et Dzaky es er de." `caption_display` maps the spoken "et Dzaky es er de" to the caption "@dzakysrd".

## 3. Beat plan

- `video-01/beats_v3.md` is the shot plan: one table row per beat (B1..B9) with id, beat, framing and cues.
- `lint_v3.mjs` reads the id and framing columns and checks framing alternation against them. Keep them in sync with the build.

## 4. Voice

- Narration file: the scenes' `vo_text` joined with `" ".join`, in scene order. video-01: `voice/samples/v3/narration_v3.txt`.
- Make about 12 s previews of the opening first. The user chooses the voice from them.
- Then make the full take.
- The main agent cannot hear the audio. Send the previews to the user.
- Commands, costs and rules: `.claude/skills/data-explainer-video/references/elevenlabs.md`.

## 5. Build, lint, render

Settings are in `video-01/video.v3.config.json`:

- voice: `voice.dir` and `voice.variant` (video-01: `el_liam_cta2`).
- gates: `hook_max_s` 3.5, `jabar_max_s` 12.5 (raised from 11.0 by the user), `close_max_s` 7.0, `total_max_s` 45.
- safe box margins: top 220, bottom 420, left 65, right 140.
- loudness target.

Steps:

1. In a fresh container, run once: `npx hyperframes@0.8.206 browser ensure`. The lint's browser probe needs it.
2. Run in the background: `bash video-01/tools/render_v3.sh`. It runs `build_v3.mjs`, then `lint_v3.mjs`, then the HyperFrames render, then a two-pass loudnorm to -14 LUFS / true peak -1.5 dBTP. Output: `video-01/out/v3.mp4`. A render took about 2.5 minutes.
3. If a gate fails, stop and ask the user. Do not change the gate or the text to make it pass.

`lint_v3.mjs` checks, among others: numbers spoken at their cue and derived from data; no digits in the VO; at most 3 text blocks per frame; captions at most 5 words and 2 lines; the safe box; map states; dead air; the gates.

The build and the render rewrite tracked files: `video-01/index_v3.html`, `video-01/build/v3/timeline.json`, the copies `video-01/assets/v3/` (`vo.mp3`, `words.json`, `sentences.json`) and `video-01/out/v3.mp4`. Check `git status` and include them in the expected commit list when they change.

New video: start from the video-02 engine (copy `video-02/` to `video-0N/`). It is `template/` plus the generic video-01 parts (word cues, word-synced captions, loudnorm, lint; `docs/prd/06-video02-base.md`); `docs/prd/11-*` to `16-*` show how it was built, and `video-02/tools/lint.mjs` holds the checks. The tools in `video-01/tools/` are specific to video-01.

## 6. Review

Follow `references/review-checklist.md`. The main agent does this itself before reporting.

## 7. Caption

Model: `video-01/out/v3_caption.txt`. Its parts, in order:

1. a hook line;
2. bullets with the exact figures;
3. the caveat;
4. a "Sumber:" list (a URL only when it is the real page used);
5. the line "Suara: ElevenLabs" while on the free plan;
6. hashtags.

Every figure in the caption must match the recomputed value from `research/data.csv`. Mark unverified-media sources as unverified, as the model does.

## 8. Commit and hand off

A haiku sub-agent does this, on the session's designated branch:

1. Check `git status` against the exact expected file list. Stop on any other change.
2. Run the key leak check (see `references/elevenlabs.md`).
3. Commit with the given message and trailers.
4. Push to the designated branch. Retry rules: `references/prd-template.md`.

Then update `HANDOFF.md` and append the PRD's "Outcome (date, measured)" section.
