---
name: data-explainer-video
description: "Plan, produce and review a data-explainer vertical video (Instagram Reels / TikTok, 1080x1920, 30 fps) for @dzakysrd in this repo: data research, script, ElevenLabs voiceover, HyperFrames build, lint and render, review, caption. Use it when starting a video on a new topic, re-voicing or re-rendering a video, or delegating any task in this repo."
---

# Data-explainer video workflow

Use this skill for any video task in this repo. Read `HANDOFF.md` first for the current state. Open a reference file only when its step is next.

## Working mode

- The main agent (Opus) only plans, writes a PRD for every task, and reviews. It never writes code or files itself, including commits.
- Coding, file writing, commits and pushes go to sub-agents on model haiku. If haiku gets confused, use sonnet with effort medium.
- Each PRD is saved by the sub-agent as `docs/prd/NN-short-name.md`. After review, an "Outcome (date, measured)" section is appended with the measured results.
- The main agent reviews every result itself before reporting: ffprobe, loudness, contact sheet, numbers against research data. It reports honestly, marks what is unverified, and never invents numbers, sources or URLs.
- The main agent cannot hear audio. Voice quality, accent, pronunciation and seams are judged by the user from previews.
- Editorial decisions belong to the user: script text, gate limits, voice choice, spending. When a gate fails, stop and ask; do not change gates or text to make it pass.
- Commit only after review, by a haiku sub-agent, on the session's designated branch; open a pull request only when the user asks.

## Workflow at a glance

1. **Research.** Keep the raw data unchanged in `research/`; build the merged table with a script. Never get around the BPS block.
2. **Script.** `research/script_vN.json`. Spoken numbers in words; on-screen numbers derived from the data.
3. **Beat plan.** `video-01/beats_v3.md`, one row per beat (B1..B9). Keep its id and framing columns in sync with the build.
4. **Voice.** Narration file from the scenes' `vo_text`. About 12 s previews first; the user picks; then the full take.
5. **Build, lint, render.** `bash video-01/tools/render_v3.sh` (video-01 v3), in the background, about 2.5 minutes.
6. **Review.** Follow `references/review-checklist.md` before any report.
7. **Caption.** Use `video-01/out/v3_caption.txt` as the model.
8. **Commit and hand off.** Haiku sub-agent: exact `git status` list, leak check, commit, push. Then update `HANDOFF.md` and the PRD outcome.

## Hard rules

- Never print, log or commit `ELEVENLABS_API_KEY`. Run the leak check before every commit.
- One paid ElevenLabs call per step. No retries without the user's OK.
- Never get around the BPS block. The user downloads BPS files by hand from bps.go.id.
- Do not change gates or script text to make a gate pass. Stop and ask.
- Label figures not yet checked against an official source `unverified-media`, and say so in the caption.
- Do not invent numbers, sources or URLs. Say what is unverified.
- Do not commit or push unless the task is a commit task.
- For a new video, make a PRD that picks the base first. video-02 uses option C: `template/` plus the generic video-01 parts (PRD-06).
- ElevenLabs free-plan terms are unverified. See `references/elevenlabs.md`.

## Where things are

- `HANDOFF.md`: current state of the project. Read first.
- `docs/prd/`: one PRD per task, named `NN-short-name.md`.
- `research/`: `bps_upah_feb2026.csv` (raw, unchanged), `data.csv` (merged), `tools/merge.py`, `sources.md`, `script_v3.json`.
- `video-01/`: `beats_v3.md`, `video.v3.config.json` (gates and voice settings), `tools/` (`build_v3.mjs`, `lint_v3.mjs`, `render_v3.sh`), `build/v3/` (`timeline.json`, `sheet.py`), `out/` (`v3.mp4`, `v3_caption.txt`), `index_v3.html` (generated).
- `voice/`: `tts_elevenlabs.py` (ElevenLabs), `tts.py` (edge-tts), `samples/v3/` (narration and takes), `samples/elevenlabs/preview/` (previews), `elevenlabs_usage.csv` (log of paid calls).
- `template/`: scenes.json-driven template (`template/README.md`). The scene engine for video-02 (PRD-06).

## References

Paths below are relative to this skill folder.

- `references/workflow.md`: the 8 steps in full detail. Read it when you start a video or a step.
- `references/elevenlabs.md`: key handling, voice, credits, takes, splice and preview commands. Read before any voice work.
- `references/review-checklist.md`: the review checks with exact commands. Read before you report a render.
- `references/prd-template.md`: PRD sections and sub-agent prompt rules. Read before you write a PRD or delegate.
