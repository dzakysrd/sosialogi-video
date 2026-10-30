# PRD-20: Reel A script v1 (Electro Power Indonesia, "cahaya, bukan panas" + seri/paralel)

## Context
- Client: Electro Power Indonesia, IG @electropoweri (niche: electrical/power-system engineering education; their YouTube runs trainings on PLTS, protection, PVsyst, power systems). Reel CTA sells their classes/materials; the class name, price and link are NOT known yet.
- Source post (Jan 2025): "Pada plat PLTS memiliki dioda yang mempunyai kutub (+) dan (-). Sehingga pada saat dipanasi sinar matahari, maka akan menghasilkan energi listrik DC. Listrik DC sama seperti listrik yang ada baterai dirumah..." Diagram: one panel 12 V 5 A; 2 in series 24 V 5 A; 3 in parallel 12 V 15 A; 8 in series 96 V 5 A. Cited "Buku Do & Dont PLTS".
- Fact ledger: research/electropower/facts.md (PRD-19, PRD-19b). LOCKED for Reel A: a solar cell converts the energy of light directly into electricity by the photovoltaic effect; photons absorbed by the semiconductor produce electron-hole pairs; p-n (diode) junction; a solar thermal collector is the different device that turns sunlight into heat; temperature is one of the input factors affecting output (its direction/size is NOT locked: do not say heat lowers output by any amount); modules produce direct current (DC); series adds voltage, parallel adds current; STC 1,000 W/m2, AM 1.5, 25 C; the official book title "Instalasi Pembangkit Listrik Tenaga Surya: Dos and Don'ts" (Ditjen EBTKE and GIZ, launched 31 August 2018).
- Not locked: "a solar cell is a photodiode"; any real module voltage; any temperature coefficient; any statement about what "many people" believe.
- Repo script format: research/video-02/script_v2.json (read it as the model: top-level version, status, word_count_target, max_seconds, cta, sources_line, scenes[] with id, vo_text, on_screen_text, visual, cue_words, numbers[] {show, spoken, derive}, optional vo_max_seconds).
- Voice will be ElevenLabs premade "Liam" speaking Indonesian (as in video-02). Numbers in vo_text are spelled out in Indonesian words; on-screen shows digits; every on-screen number is spoken at its cue.

## Goal
A draft script for Reel A the user can approve or edit, with two hook options.

## Editorial defaults (set by the main agent; the user may change them)
- Angle: "Panel surya menghasilkan listrik dari CAHAYA, bukan dari panas" then how panels are combined (series/parallel), then a CTA. Do not mention or mock the client's old post; just state it correctly.
- The 12 V 5 A panel is an illustration: on screen label it "ANGKA CONTOH" (or "contoh sederhana") and say "contoh" in the VO once. Arithmetic allowed: 2 in series = 24 V 5 A; 3 in parallel = 12 V 15 A. Do not use the 8-panel 96 V example (time).
- Tone: Indonesian, semi-casual, address the viewer as "kamu", engineering-correct terms (volt, ampere, arus searah/DC, sambungan p-n, efek fotovoltaik). Short sentences that read well aloud.
- CTA: last scene, VO placeholder exactly "[CTA KELAS: menunggu nama kelas dan link dari klien]" and on_screen_text "[CTA placeholder]". Set top-level "cta" to "PLACEHOLDER".
- Hook rules (adapted from the viral-content-writer skill; no villain is invented): first 3 seconds must state the counter-intuitive claim in second person, present tense; contain no fabricated claim about what people believe; vo_max_seconds 3.5 for the hook scene.
- Length: word_count_target [85, 110] for the whole VO excluding the CTA placeholder; max_seconds 45.
- 5 to 7 scenes. One idea per scene. Every scene's "visual" names the animation needed, chosen from: (a) panel + photons hitting a cell, electrons moving, + and - terminals; (b) contrast card "cahaya -> listrik" vs "panas -> solar thermal collector"; (c) DC symbol / battery comparison; (d) series wiring animation, voltage counter adding; (e) parallel wiring animation, current counter adding; (f) claim/textcard (exists in the engine); (g) close/CTA card.
- sources_line: "Sumber: Wikipedia (Solar cell, Photovoltaic effect); Ditjen EBTKE & GIZ, Instalasi PLTS: Dos and Don'ts (2018)". Only cite the book for content it actually supports: the book was NOT opened, so do not attribute any specific fact to it; use it only as "bacaan lanjut" if at all, and say so in a note.

## Changes allowed
docs/prd/20-reel-a-script.md (new); research/electropower/reel-a/script_v1.json (new); research/electropower/reel-a/script_v1.md (new, human-readable Indonesian version for the user: a table scene | VO | layar | visual, plus the two hook options, plus the total word count and an estimated duration at 2.5 words/second labelled as an estimate). Nothing else.

## Steps
1. Read research/video-02/script_v2.json and the Reel A section of research/electropower/facts.md.
2. Write script_v1.json. Include top-level "hook_options": two alternative hook VO lines (A and B), each with its on_screen_text; scene 1 uses option A. Add "fact_refs" to each scene: the exact claim text of the LOCKED facts.md row(s) it relies on (or "arithmetic" / "none").
3. Write script_v1.md.
4. Self-check and print: word count of all vo_text (excluding the CTA placeholder) for options A and B; for each scene the list of digits in on_screen_text and the matching spoken words in vo_text; confirm vo_text contains no digits (`grep`-style check, print the result); confirm every fact_refs entry string appears in facts.md (print each with found/not found). STOP and report if any check fails instead of bending the rules.

## Acceptance
- JSON parses (python3 -m json.tool).
- No digits in any vo_text. Word count within [85, 110] for option A.
- Every non-arithmetic fact_refs entry found in facts.md with status LOCKED.

## Budget
No paid calls.

## Report
Paste script_v1.md verbatim, the step 4 check outputs verbatim, and `git status --short --untracked-files=all`.

## Outcome (2026-10-30, reviewed by the main agent)
- script_v1.json and script_v1.md written; checks pass: 101 VO words with hook A (102 with hook B), no digits in VO, every on-screen number spoken, all fact_refs found and LOCKED. Estimated length about 40 s (2.5 words/s, not measured).
- Status: DRAFT, waiting for the user's approval. Open review points: hook strength, jargon in scene 2 ("elektron-hole"), scene 3 wording, the book in sources_line (not opened: move out of "Sumber"), CTA placeholder.
