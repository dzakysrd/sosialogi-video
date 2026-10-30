# PRD-21: Reel A script v2 (user decisions applied)

## Context
- v1: research/electropower/reel-a/script_v1.json / script_v1.md (PRD-20, commit b07f1f0).
- User decisions (2026-10-30): hook C; scene 2 and scene 3 rewrites accepted; the book is removed from the sources line; sources go in the caption only, not on screen. CTA still a placeholder.

## Goal
script_v2.json and script_v2.md with exactly the texts below.

## Changes allowed
docs/prd/21-reel-a-script-v2.md, research/electropower/reel-a/script_v2.json, research/electropower/reel-a/script_v2.md (all new). Do not edit v1.

## Steps
1. Copy script_v1.json to script_v2.json and change only:
   - "version": "v2"; "status": "v2 (2026-10-30): hook C chosen by the user; scenes 2 and 3 rewritten; book removed from sources; CTA placeholder".
   - remove "hook_options".
   - scene 1 (s1_hook): vo_text "Panel surya nggak butuh panas. Yang dia butuh: cahaya." on_screen_text "BUKAN PANAS. -> at 'cahaya': CAHAYA." vo_max_seconds 3.5 (keep). fact_refs unchanged.
   - scene 2 (s2_cahaya): vo_text "Sel surya mengubah energi cahaya langsung jadi listrik lewat efek fotovoltaik. Cahaya yang diserap sel melepaskan elektron di sambungan p-n, dan aliran elektron itulah listriknya." Keep its on_screen_text, visual and fact_refs.
   - scene 3 (s3_kontras): vo_text "Kalau yang mengubah sinar matahari jadi panas, itu alat yang berbeda: solar thermal collector." Keep the rest.
   - "sources_line": "Sumber: Wikipedia (Solar cell, Photovoltaic effect)"; add top-level "sources_placement": "caption only, not on screen".
   - everything else unchanged (scenes 4-7 identical to v1).
2. Write script_v2.md in the same layout as script_v1.md (one table, no hook options section), with the new word count and estimate (words / 2.5, labelled estimate), and a short "Perubahan dari v1" list.
3. Checks, print verbatim: json parses; word count of all vo_text excluding the CTA placeholder; any digits in vo_text (must be none); every on-screen number has its spoken words in the same scene's vo_text; `diff <(python3 -c "import json;[print(s['id'],s['vo_text']) for s in json.load(open('research/electropower/reel-a/script_v1.json'))['scenes']]") <(python3 -c "import json;[print(s['id'],s['vo_text']) for s in json.load(open('research/electropower/reel-a/script_v2.json'))['scenes']]")` must show changes in s1, s2, s3 only. STOP and report on any failure.

## Acceptance
Checks in step 3 pass.

## Report
Paste script_v2.md and the step 3 outputs verbatim, plus `git status --short --untracked-files=all`.

## Follow-up (2026-10-30)
- Stale cue_words from v1 replaced in s1, s2, s3; s1 visual updated to match on_screen_text. All cue_words now appear in their scene's vo_text.

## Outcome (2026-10-30, reviewed by the main agent)
- script_v2: 106 VO words, estimated about 42 s (not measured); no digits in VO; every on-screen number spoken; all cue_words found in their scene's VO. Approved texts from the user (hook C, scenes 2 and 3).
- Open for the build PRD: add "cahaya" as a cue word in s1 (CAHAYA. appears at that word). CTA still a placeholder.
