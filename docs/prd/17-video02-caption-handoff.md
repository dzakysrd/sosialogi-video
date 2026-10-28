# PRD-17: video-02 caption and handoff

## Context
- `video-02/out/v2.mp4` rendered and measured (PRD-16). The user approved the caption on 2026-10-28 (WIB) with these edits: 4 hashtags, shorter sources with URLs, the voice credited as "Suara: elevenlabs.io" with the user's ElevenLabs affiliate link, and the Claude referral line (link in bio).
- A web search on 2026-10-28 returned ElevenLabs' help page "Can I publish the content I generate on the platform?" saying free-plan output has no commercial licence and must be attributed with "elevenlabs.io" or "11.ai" in the title. The page itself could not be opened from the container (elevenlabs.io is not in the allowed domains).

## Goal
Save the caption, update HANDOFF.md and the ElevenLabs reference note, and commit.

## Changes allowed
`docs/prd/17-video02-caption-handoff.md`, `video-02/out/v2_caption.txt`, `HANDOFF.md`, `.claude/skills/data-explainer-video/references/elevenlabs.md`.

## Steps
1. Write the files and edits exactly as given by the main agent.
2. Leak check, commit, push.

## Acceptance
- The caption file matches the given text; its character count is under 2200.
- git status after the commit is clean.

## Budget
0 paid calls.

## Report
Paste the caption character count, the git diff stat and the commit.
