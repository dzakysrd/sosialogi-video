# PRD-05: project skill for the data-explainer video workflow

## Goal
Capture the working mode and the per-video workflow proven on video-01 as a Claude Code project skill, so a new session in this repo (e.g. for video-02 on another topic) follows it without re-explanation. Write in English (the repo's docs are English), plain and imperative, short sentences. Every fact below is from this repo or was measured on 2026-10-27; do not add facts, numbers, URLs or claims that are not listed here. Where something is listed as unverified, say so in the skill.

## Files to create (and nothing else)
1. .claude/skills/data-explainer-video/SKILL.md (at most about 120 lines), YAML frontmatter with exactly two keys:
   name: data-explainer-video
   description: (one or two sentences) Plan, produce and review a data-explainer vertical video (Instagram Reels / TikTok, 1080x1920, 30 fps) for @dzakysrd in this repo: data research, script, ElevenLabs voiceover, HyperFrames build, lint and render, review, caption. Use it when starting a video on a new topic, re-voicing or re-rendering a video, or delegating any task in this repo.
   Body sections: "Working mode" (full text of the working-mode facts below), "Workflow at a glance" (numbered steps 1-8 matching references/workflow.md, one or two lines each), "Hard rules" (short list), "Where things are" (key paths), "References" (one line per reference file saying when to read it).
2. .claude/skills/data-explainer-video/references/workflow.md: the 8 steps in full detail (facts below).
3. .claude/skills/data-explainer-video/references/elevenlabs.md: the voice facts and lessons below, with the exact commands.
4. .claude/skills/data-explainer-video/references/review-checklist.md: the review checks below as a checklist with the exact commands.
5. .claude/skills/data-explainer-video/references/prd-template.md: the PRD template and the sub-agent prompt rules below.
6. CLAUDE.md at the repo root (at most 12 lines): title "sosialogi-video"; "Read HANDOFF.md first."; the working mode in 3-4 bullets; "For any video task, use the data-explainer-video skill (.claude/skills/data-explainer-video/SKILL.md)."; note that video-01/CLAUDE.md and template/CLAUDE.md are HyperFrames' own instructions for those folders.

## Facts: working mode
- The main agent (Opus) only plans, writes a PRD for every task, and reviews. It never writes code or files itself, including commits.
- Coding, file writing, commits and pushes go to sub-agents on model haiku. If haiku gets confused, use sonnet with effort medium.
- Each PRD is saved by the sub-agent as docs/prd/NN-short-name.md; after review, an "Outcome (date, measured)" section is appended with the measured results.
- The main agent reviews every result itself before reporting: ffprobe, loudness, contact sheet, numbers against research data. It reports honestly, marks what is unverified, and never invents numbers, sources or URLs.
- The main agent cannot hear audio. Voice quality, accent, pronunciation and seams are judged by the user from previews.
- Editorial decisions belong to the user: script text, gate limits, voice choice, spending. When a gate fails, stop and ask; do not change gates or text to make it pass.
- Commit only after review, by a haiku sub-agent, on the session's designated branch; open a pull request only when the user asks.

## Facts: workflow (references/workflow.md)
1. Research. Data lives in research/: the raw download kept unchanged (video-01: research/bps_upah_feb2026.csv), a merged table (research/data.csv) built by a re-runnable script (research/tools/merge.py), and research/sources.md (source details and the raw file's sha256). The BPS website blocks requests from servers (Cloudflare): the user downloads files from bps.go.id by hand; never try to get around the block. Figures taken from media and not yet checked against an official source are labelled unverified-media, and the caption says so (video-01: UMP 2026 from detik.com and kompas.tv citing Kemnaker).
2. Script. research/script_vN.json: "scenes" (each: id, vo_text, on_screen_text, visual, cue_words, optional caption_display), "word_count_target", "max_seconds". Rules from video-01 (enforced by video-01/tools/lint_v3.mjs for v3): numbers are spelled out in words in vo_text (no digits); every number shown on screen is spoken at its cue; on-screen numbers are derived from the data file, not typed by hand; add a caveat where the data could be misread (video-01: "Ini rata-rata gaji bersih buruh, bukan bukti perusahaan tidak patuh."); video-01 bans the word "melanggar" in the VO. The CTA speaks the username as "Yuk, follow et Dzaky es er de." and caption_display maps the spoken "et Dzaky es er de" to the caption "@dzakysrd".
3. Beat plan. video-01/beats_v3.md is the shot plan: one table row per beat (B1..B9) with id, beat, framing and cues; lint_v3.mjs reads the id and framing columns, so keep them in sync with the build.
4. Voice. Write the narration file as " ".join of the scenes' vo_text (video-01: voice/samples/v3/narration_v3.txt). Make about 12 s previews of the opening first and let the user choose; then make the full take. Details in references/elevenlabs.md.
5. Build, lint, render (video-01 v3). Settings are in video-01/video.v3.config.json: voice.dir and voice.variant, gates hook_max_s 3.5, jabar_max_s 12.5 (raised from 11.0 by the user), close_max_s 7.0, total_max_s 45, safe box margins top 220, bottom 420, left 65, right 140, loudness target. In a fresh container run `npx hyperframes@0.8.206 browser ensure` once. Then `bash video-01/tools/render_v3.sh` runs build_v3.mjs, lint_v3.mjs, the HyperFrames render and a two-pass loudnorm to -14 LUFS / true peak -1.5 dBTP into video-01/out/v3.mp4. A render took about 2.5 minutes; run it in the background. lint_v3.mjs checks, among others: numbers spoken at their cue and derived from data, no digits in the VO, at most 3 text blocks per frame, captions at most 5 words and 2 lines, the safe box, map states, dead air, and the gates.
   New video: the build and lint tools in video-01/tools/ are specific to video-01. template/ is a scenes.json-driven template (template/README.md). Which base suits video-02 has not been evaluated: make that its own PRD before building.
6. Review: follow references/review-checklist.md.
7. Caption. video-01/out/v3_caption.txt is the model: a hook line; bullets with the exact figures; the caveat; a "Sumber:" list (a URL only when it is the real page used); the line "Suara: ElevenLabs" while on the free plan; hashtags.
8. Commit and hand off. A haiku sub-agent checks `git status` against the exact expected file list (stop on anything else), runs the key leak check, commits with the given message, and pushes to the designated branch. Update HANDOFF.md and the PRD outcome.

## Facts: ElevenLabs (references/elevenlabs.md)
- Key: environment variable ELEVENLABS_API_KEY (51 characters, starts with sk_). Never print, log or commit it. Leak check before every commit: `grep -rF -c "$ELEVENLABS_API_KEY" <paths> | grep -v ':0$'` must print nothing. A free account check that costs nothing: GET https://api.elevenlabs.io/v1/user/subscription (character_count, character_limit).
- Script: voice/tts_elevenlabs.py, same outputs as voice/tts.py (vo.mp3, words.json, sentences.json), endpoint /v1/text-to-speech/{voice_id}/with-timestamps, character alignment converted to words. Command used for video-01:
  python3 voice/tts_elevenlabs.py voice/samples/v3/narration_v3.txt --voice-id TX3LPaxmHKxFdv7VOQHJ --model eleven_multilingual_v2 --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 --out-dir voice/samples/v3/<take>
- Voice: premade voice Liam (TX3LPaxmHKxFdv7VOQHJ, American-accent premade voice speaking Indonesian), default voice settings. The user found the edge-tts voice Ardi (voice/tts.py) too stiff.
- Free plan: Voice Library voices are refused through the API with HTTP 402 paid_plan_required, even when the library lists free_users_allowed true; premade voices work. The error message offers upgrading to Creator or adding $5 of credits. The free plan is reported as non-commercial with attribution required; this was not checked against ElevenLabs' terms.
- Credits: 10,000 per month on the free plan. With eleven_multilingual_v2 each call cost exactly the number of characters sent (measured: 54, 179, 667, 96, 30); previous_text was not billed. The subscription counter lags 20-30 s after a call, so the script takes the cost from the character-cost response header. Every paid call is logged in voice/elevenlabs_usage.csv. Raw responses are cached in <take>/raw/, so re-processing (for example a different --max-pause) costs 0 credits; --force-api forces a new call. One paid call per step; no retries without the user's OK.
- Loudness: raw ElevenLabs audio measured about -22 to -24 LUFS with peaky transients, so a plain linear loudnorm cannot reach -14 LUFS. The script applies gain, then a 192 kHz limiter at -2 dBFS, giving -14 +/- 0.3 LUFS with true peak <= -1.5 dBTP; word timing does not move.
- Splice mode: --splice-base DIR --splice-at TEXT re-voices only the text from TEXT on, sends the earlier text as previous_text, level-matches and joins it onto the base take in the middle of the silence before TEXT; earlier word times stay exactly the same. A spliced take can itself be a splice base. Lesson: the splice point must come after any pause you want to keep; splicing at "Yuk, follow" re-voiced the comma pause after "Yuk," (0.50 s became 0.16 s).
- Takes for video-01 v3: voice/samples/v3/el_liam (full), el_liam_cta (close re-voiced), el_liam_cta2 (CTA with "et"; final). Previews: voice/samples/elevenlabs/preview/.
- --max-pause only shortens pauses between sentences, not pauses at commas.

## Facts: review checklist (references/review-checklist.md)
- ffprobe on the MP4: video 1080x1920, r_frame_rate 30/1; video duration within 0.1 s of the timeline total (video-01/build/v3/timeline.json "total"); audio duration within 0.1 s of video. Command: ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration,sample_rate,channels -of compact <mp4>
- Loudness: ffmpeg -hide_banner -nostats -i <mp4> -map 0:a -af ebur128=peak=true -f null - ; integrated -14 +/- 0.5 LUFS, true peak <= -1.0 dBTP. A mono VO placed on both stereo channels reads about 3 dB louder than the mono file (EBU R128 sums channels); the render's loudnorm pass accounts for it.
- VO take before rendering: words and sentences counts equal the script; word texts equal the narration tokens; gates computed from words.json pass.
- Contact sheet: frames from the MP4 at each beat start + 0.4 s and midpoint, each on-screen number at its cue + 0.6 s, the CTA moments, and total - 0.3 s; build it with video-01/build/v3/sheet.py (`python3 video-01/build/v3/sheet.py <out.jpg> 6 <frames in time order>`); look at it.
- Numbers: recompute every on-screen figure from the data file (including counts such as "24 of 38") and compare with the frames; map colouring must equal the set computed from data.
- Audio: send previews or the final video to the user for listening; say that you did not hear it.
- Report what was not verified (e.g. only sampled frames, terms not checked).

## Facts: PRD template and sub-agent prompts (references/prd-template.md)
Template sections: "# PRD-NN: title", "## Context" (verified facts with file paths), "## Goal", "## Changes allowed" (exact files; everything else is off-limits), "## Steps" (numbered, with explicit STOP conditions), "## Acceptance" (commands and expected values), "## Budget" (credits and number of paid calls), "## Report" (what to paste verbatim; say what failed or was not verified). After review: "## Outcome (date, measured)".
Every sub-agent prompt states: the absolute repo path and branch; a scratch directory outside the repo; "do not commit or push" unless it is a commit task; never print the API key; report verbatim and never invent numbers; save the PRD verbatim first. Commit tasks give the exact expected `git status` list, the leak check, the exact commit message with its trailers, and the push command with retries only on network errors (2, 4, 8, 16 s).

## Acceptance (report all)
A1. Both YAML frontmatter keys parse (python3 -c with a minimal parser or by printing the lines between the first two '---'), name equals the folder name.
A2. Line counts of every new file (SKILL.md about 120 lines or fewer; CLAUDE.md 12 or fewer).
A3. Path check: extract every backticked or plain repo path you wrote (anything matching voice/..., video-01/..., research/..., template/..., docs/..., HANDOFF.md) from all new files, and check that each exists, except paths containing placeholders like <take>, <out.jpg>, vN, NN. List any that do not exist.
A4. Fact check: for each number in the new files, show the line and the fact line in this PRD it came from; list any number that is not in this PRD.
A5. `git status --short --untracked-files=all`.

FINAL MESSAGE: the full content of SKILL.md and CLAUDE.md, the first 15 lines of each reference file, and A1-A5 verbatim.

## Outcome (2026-10-27, reviewed)
- Created .claude/skills/data-explainer-video/ (SKILL.md, 59 lines, plus references/workflow.md, elevenlabs.md, review-checklist.md, prd-template.md) and a 12-line root CLAUDE.md.
- Checks: frontmatter parses (name, description); every repo path named in the files exists; every number traces to a fact line in this PRD. Facts added from the repo code (files the build and render rewrite, lint needs headless Chrome, lint does not count sentences, an empty key variable makes the leak check match every line) were reviewed and are correct.
- Not verified: that a new session loads the skill automatically; test it at the start of the next session.
