# Review: hyperframe-pro (third-party Claude Code skill pack)

- Date: 2026-10-27
- Scope: read-only security and usefulness review (PRD Task 4)
- Clone: `/home/user/sosialogi-video/thirdparty/hyperframe-pro` (paths below are relative to this root unless stated)
- Source: `https://github.com/buildwithhanif/hyperframe-pro.git`, shallow clone (`--depth 1`)
- HEAD: `9a135673d71c616763497a90c820d72eae943dca`, `Wed Sep 16 00:13:17 2026 +0700`, subject "lint: count English number words for counters (twelve hundred, etc.)". Only this commit is visible.
- Execution: nothing from the repo was run. No `npm`, `npx`, no repo scripts, no imports. Python was used only with `-I` to scan file text (outside the repo cwd). The two ffmpeg command strings quoted in the repo were run against synthetic media generated in the scratchpad, not against repo files (see section 5).
- Our files: `/home/user/sosialogi-video/template` and `/home/user/sosialogi-video/voice/tts.py` were only read. Neither was modified.

---

## 0. Verdict

| Question | Answer |
|---|---|
| Safe to read and copy ideas? | **Yes.** The code is readable and not obfuscated. The analysis tools (`lint.mjs`, `motion.mjs`, `build.mjs`, `trim-vo.py`, `prep-footage.sh`) make no network calls. No malicious behaviour, exfiltration, affiliate links, telemetry or prompt-injection text was found. |
| Safe to install as a Claude Code plugin? | **Not as-is.** Installing runs nothing by itself, because the plugin has no hooks, commands, agents or MCP servers. The concerns are the unpinned install channel, skills that direct the agent to run paid API scripts with keys, and two content recipes we should not adopt (section 2.8, RF-1 and RF-2). |
| Red flags | No malicious code. Content and process concerns (RF-1 to RF-6), plus correctness bugs in the revision scripts that can silently corrupt audio (F-1 to F-3). |
| Most useful to us | The chained cue resolver `TA()`, the lint gate set (re-expressed as checks over our own timeline), the browser probe, the contact-sheet command (with a duration fix), and the pause-capping idea (we already have `--max-pause` in `voice/tts.py`). |

---

## 1. Inventory

### 1.1 Tree (depth 3, all 24 files)

```
.
├── .claude-plugin/marketplace.json
├── .gitignore
├── LICENSE
├── README.md
├── example/
│   ├── README.md
│   ├── assets/vo/audio_meta.json
│   ├── assets/vo/vo.wav            (1.4 MB synthetic tone track)
│   ├── build.mjs
│   ├── meta.json
│   └── script.json
└── plugins/hyperframe-pro/
    ├── .claude-plugin/plugin.json
    ├── scripts/
    │   ├── fal.mjs
    │   ├── lint.mjs
    │   ├── motion.mjs
    │   ├── prep-footage.sh         (only executable file)
    │   ├── shots.py
    │   ├── swap-line.py
    │   ├── trim-vo.py
    │   └── tts.mjs
    └── skills/
        ├── hyperframe-pro/SKILL.md
        ├── hyperframe-pro-beats/SKILL.md
        ├── hyperframe-pro-footage/SKILL.md
        ├── hyperframe-pro-script/SKILL.md
        └── hyperframe-pro-voice/SKILL.md
```

### 1.2 Counts and languages

- 24 files: 7 Markdown (README, example README, 5 SKILL.md), 5 JavaScript (`.mjs`, Node ESM), 3 Python, 1 Bash, 5 JSON, 1 WAV, LICENSE, `.gitignore`.
- Largest code file: `scripts/lint.mjs` (320 lines, 25 KB). No file is minified. The longest line is 379 characters (`scripts/motion.mjs`).
- Symlinks: none. Executable bit: only `scripts/prep-footage.sh`.

### 1.3 Manifests and license

- No `package.json`, `pyproject.toml`, `requirements.txt`, lockfile, Dockerfile, `.mcp.json`, `hooks/`, `commands/`, `agents/`, `settings.json` or `.gitmodules`.
- `.claude-plugin/marketplace.json`: marketplace name `hyperframe-pro`, one plugin with `source: ./plugins/hyperframe-pro`, `license: MIT`.
- `plugins/hyperframe-pro/.claude-plugin/plugin.json`: v1.0.0, `license: MIT`. It has no `hooks`, `commands`, `agents` or `mcpServers` key.
- `LICENSE`: standard MIT text, 21 lines, sha256 `22613aa5bd8808d19a66479717a0a88dd3e0dd199e0b48bed3fadb9ee327280b`. Copyright line: "2026 Hanif (@hanifproduktif)". The GitHub owner is `buildwithhanif`. I did not verify that these are the same person.

---

## 2. Security

### 2.1 Dependencies and install-time scripts

- No npm packages, so no `preinstall`, `postinstall` or `prepare` scripts exist.
- Node code uses built-ins only: `node:fs`, `node:os`, `node:path`, `node:child_process` (`scripts/tts.mjs:6-9`), plus global `fetch`. Requires Node 20+ (`README.md:59`).
- Python code uses the standard library plus Pillow. `scripts/shots.py` imports `from PIL import ...` at lines 47, 52, 64, 91, 123 and 139. Pillow is not declared anywhere.
- `npx hyperframes` is unpinned (`README.md:59`, `plugins/hyperframe-pro/skills/hyperframe-pro/SKILL.md:35` and `:81`, `example/README.md:11-12`). Each run fetches whatever the npm registry currently serves.
- Generated HTML loads GSAP from `https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js` (`example/build.mjs:111`). The version is pinned, but there is no SRI hash.

### 2.2 Network endpoints (complete list)

| Host or URL | Where | What is sent | Key sent? |
|---|---|---|---|
| `api.elevenlabs.io` | `scripts/tts.mjs:48-49`; `scripts/swap-line.py:79-82` | Script text, voice settings, previous/next context | Yes, `xi-api-key` header |
| `queue.fal.run` | `scripts/fal.mjs:42` (submit), `:101` (probe) | Prompt, image size, or a base64 data URI of a local image (`:72-75`, `:117`, `:138`) | Yes, `Authorization: Key` |
| `status_url` / `response_url` from fal's submit response | `scripts/fal.mjs:45-47`, `:52`, `:59` | Poll and result requests | Yes, sent without an origin check (see F-6) |
| fal CDN result URLs | `scripts/fal.mjs:66-69`, `:144` | Plain download, no auth | No |
| Any URL passed on the command line | `scripts/shots.py:25-28` (`find`, `fetch`) | Browser User-Agent string only | No |
| `github.com/buildwithhanif/...` | `.claude-plugin/marketplace.json`, `plugin.json`, README | Install and homepage links only | n/a |
| `hyperframes.heygen.com` | `README.md:3` | Link only | n/a |
| `cdn.jsdelivr.net` | `example/build.mjs:111` (in generated HTML) | Browser loads GSAP | No |
| `www.w3.org` | `scripts/motion.mjs` (SVG namespace inside a data URI) | Not fetched | No |
| `127.0.0.1:8777` | `plugins/hyperframe-pro/skills/hyperframe-pro/SKILL.md:101-104` | Local probe server | No |

`lint.mjs`, `motion.mjs`, `build.mjs`, `trim-vo.py` and `prep-footage.sh` do no network I/O.

### 2.3 Exec, eval, encoding, obfuscation

- `eval(`, `new Function(`, `Function(`: none.
- `child_process`: `scripts/tts.mjs:9`, `:57-58`. Uses `execFileSync` with argv arrays, so no shell. Safe.
- `os.system`: `scripts/swap-line.py:95`, with the path interpolated into a shell string and the return code ignored (see F-2).
- `prep-footage.sh:24-25` interpolates `$SS` and `$DUR` into `python3 -c` strings. The inputs are CLI arguments (see F-7).
- Base64: used to encode local images for fal (`scripts/fal.mjs:72-75`) and to decode audio responses (`tts.mjs:53`, `swap-line.py:85`). No encoded payloads are stored in the repo.
- Hidden Unicode: a Python scan (`python3 -I`) found no format, control or private-use characters in any text file. Non-ASCII characters are typographic only (em dashes, arrows, ≥).

### 2.4 API key handling

- Lookup order: environment variable, then a file. ElevenLabs: `scripts/tts.mjs:15-19` (`~/.config/hyperframe-pro/.env`) and `scripts/swap-line.py:60-64`. fal: `scripts/fal.mjs:28-35` (`~/.config/hyperframe-pro/fal.env`).
- Keys go only to the two API hosts in 2.2. They are not written into `index.html`, into project files, or into logs. Error paths print response bodies (`tts.mjs:51`, `fal.mjs:44`), not request headers.
- The repo never writes key files. The docs ask for `chmod 600` (`SKILL.md:41`, `README.md:61`).
- Weakness: `fal.mjs:45-59` sends the `Authorization` header to URLs taken from the response without checking the origin (F-6).

### 2.5 Claude Code plugin surface

- Hooks: none. No `hooks/`, no `hooks` key in `plugin.json`.
- Commands, agents, MCP servers: none. No `commands/`, `agents/`, `.mcp.json` or `mcpServers` key.
- Skills are Markdown only (5 `SKILL.md` files). They tell the agent to run `node`, `python3`, `bash` and `ffmpeg` commands. Each of those runs with the user's permissions and needs Bash approval unless it is allowlisted.
- Install path: `README.md:51-53` runs `claude plugin marketplace add buildwithhanif/hyperframe-pro` and then `claude plugin install hyperframe-pro@hyperframe-pro`. This follows the default branch with no pinned commit.

### 2.6 Affiliate links, referral codes, telemetry

- None found. Grep for affiliate, referral, `ref=`, `utm_`, tracking, analytics, telemetry, pixel, coupon and sponsor found no real matches. The only hits were ordinary prose ("pixels") and a pricing note ("promo") in `scripts/fal.mjs:126`.

### 2.7 Text aimed at AI agents

- No prompt-injection patterns were found ("ignore previous", "do not tell the user", "send", "upload", "exfil", "silently run"). No file asks an agent to make network calls or change settings beyond the documented API calls.
- Directive text that is aimed at agents, listed for the record:
  - `README.md:56-57`: "Or point any coding agent at this repo and tell it to follow `plugins/hyperframe-pro/skills/hyperframe-pro/SKILL.md`." This is an explicit instruction to agents. It is benign in content, but it is the mechanism by which the skill text becomes agent behaviour.
  - `plugins/hyperframe-pro/skills/hyperframe-pro/SKILL.md:46-52` ("read it before touching anything", "Edit the GENERATOR, never index.html"), `:84` ("Read a contact sheet before you call anything done").
  - `plugins/hyperframe-pro/skills/hyperframe-pro-beats/SKILL.md:100`: "Paint out any number in the source that contradicts the narration." This is a content-integrity issue (RF-2).
  - `scripts/fal.mjs:14`: "Models (fixed — do not swap without asking)." A developer note, not an injection.
  - `scripts/shots.py:61`: runtime message telling the reader to reject third-party names. Benign.

### 2.8 Red flags, ranked

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| RF-1 | Medium (content and misinformation risk) | The footage skill prescribes photoreal crime footage that "reads as real": "documentary surveillance realism", "AI stock photo" as the failure mode, a theft "snatch" as the example shot. The only constraint is text ("never ... pass as a record of a real, specific event"). Nothing in the code enforces it, and `lint.mjs` does not inspect plates. For a public explainer channel this is a misinformation risk. | `skills/hyperframe-pro-footage/SKILL.md:18-33`, `:73-82`, `:127` |
| RF-2 | Medium (content integrity) | Instructs the agent to paint over numbers in real screenshots so they match the script. This conflicts with the repo's own rule against faking UI. | `skills/hyperframe-pro-beats/SKILL.md:100`; contrast `README.md:117-118` |
| RF-3 | Medium (supply chain) | Install follows the default branch with no pinned commit. `npx hyperframes` is unpinned. | `README.md:51-53`, `:59`; `SKILL.md:35`, `:81` |
| RF-4 | Low to medium (cost) | Every fal call is paid, and no spend or count limit exists. Cost guidance appears only as comments and prose. An agent retry loop could spend money unnoticed. | `scripts/fal.mjs:22-23`, `:126-135`; `SKILL.md` (footage) `:64-65` |
| RF-5 | Low to medium (exposure) | The browser probe runs `python3 -m http.server 8777 &` with no bind address. Python's default is all interfaces. The stdlib help states: "-b, --bind ADDRESS bind to this address (default: all interfaces)". So the whole project folder is served on the network until someone kills the server. Verified with `python3 -I -m http.server --help`, not by starting a server. Fix: add `-b 127.0.0.1`. | `skills/hyperframe-pro/SKILL.md:101`, `:104` |
| RF-6 | Low (unsourced claims) | The 179 s ceiling and "longer videos get deprioritised" are stated as fact with no source. The repo's own `scripts/tts.mjs:66` comment says "9-step builds have run 191-193s clean", which contradicts the hard 179 s gate in `example/build.mjs:43` and `scripts/lint.mjs:238`. Treat the platform claim as the author's opinion. | `scripts/lint.mjs:230-231`; `README.md:109-110`; `skills/hyperframe-pro-voice/SKILL.md:61`; `skills/hyperframe-pro-script/SKILL.md:47`; `scripts/tts.mjs:66` |

---

## 3. Code and documentation defects

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| F-1 | Medium (data loss) | `trim-vo.py` overwrites `assets/vo/vo.wav` and `audio_meta.json` in place and makes no backup. The voice SKILL says "Back up `assets/vo/` first; the script does it for you." That is false for `trim-vo.py`. `swap-line.py` does back up (`swap-line.py:106-109`). The `trim-vo.py` docstring (line 7) says to back up manually. | `scripts/trim-vo.py:73-75`, `:88`; `skills/hyperframe-pro-voice/SKILL.md:74` |
| F-2 | Medium (silent wrong audio) | `swap-line.py:95` runs `ffmpeg` via `os.system` and never checks the return code. If ffmpeg fails, line 103 reads whatever `raw/linefix/line.wav` already exists, which is a stale line from an earlier swap, and splices it without error. A `"` in the project path also breaks the quoting. | `scripts/swap-line.py:84-103`, `:95` |
| F-3 | Medium (edge case, reasoned from code, not executed) | If the phrase starts at word 0, `lo == 0`, so `W[lo - 1]` is `W[-1]`, the last word of the take. That makes `head_end` the whole take and duplicates the tail. The dry run warns for this case (`:54`), but the write path does not guard it. | `scripts/swap-line.py:116-117`, `:123`, `:54` |
| F-4 | Low (correctness) | The `trim-vo.py` projection uses a 1.5 s tail (`:101`). `example/build.mjs:42` uses 1.2 s. Minor, but the two disagree. | `scripts/trim-vo.py:101`; `example/build.mjs:42` |
| F-5 | Low (path handling) | `tts.mjs` builds output paths from `sc.id` (`:40`). An id containing `../` writes outside `outDir`. Input is user-authored, so the risk is low. | `scripts/tts.mjs:40` |
| F-6 | Low (hardening) | The fal `Authorization` header is sent to `status_url` and `response_url` from the API response without an origin check. A one-line hostname check would close it. | `scripts/fal.mjs:45-59` |
| F-7 | Low (CLI input) | `prep-footage.sh` interpolates `$SS` and `$DUR` into `python3 -c` (`:24-25`). Use argv or validate as numbers. | `scripts/prep-footage.sh:19-25` |
| F-8 | Low to medium (level accuracy) | Loudness uses single-pass `loudnorm` with `linear=true` but no `measured_*` values. ffmpeg documents `linear` as "normalize linearly if possible". On a 12 s synthetic tone, the same command gave -15.4 LUFS integrated against a -16 target. The "-16 LUFS" in comments (`tts.mjs:1`, `:5`) is approximate. | `scripts/tts.mjs:57`; `scripts/swap-line.py:95` |
| F-9 | Medium (silent check skip) | `lint.mjs:289` reads `assets/vo/vo.words.json`. `tts.mjs` writes `<scene id>.words.json`, and the example has no words file at all. The counter-spoken check (`:300-302`) is skipped silently when the list is empty (`spoken.length` guard). It only works when the scene id is literally `vo`. `trim-vo.py:26` and `swap-line.py:36` hard-code `assets/vo/vo.wav` and `scenes[0]`, so a different scene id breaks them. | `scripts/lint.mjs:289`, `:300-302`; `scripts/tts.mjs:40`; `scripts/trim-vo.py:26`; `scripts/swap-line.py:36`; `example/assets/vo/` (no words file) |
| F-10 | Medium (overstated gate) | "Hero-sized" is decided by CSS class name, not measured. Any `.ct` element counts as a hero regardless of size, so a 60 px label satisfies the dead-air gate. Only `.wo` is size-checked (≥260 px). | `scripts/lint.mjs:118-120` |
| F-11 | Low (doc vs code) | The beats skill requires a hero of at least 800 px. `lint.mjs` only warns below 600 px. | `skills/hyperframe-pro-beats/SKILL.md:61-62`; `scripts/lint.mjs:67` |
| F-12 | Low (dangling references) | `motion.mjs` cites `references/motion-vocabulary.md` and lint rules `gsap_exit_missing_hard_kill` and `gsap_repeat_ceil_overshoot`. None exist in this repo. The only related name is `gsap_animates_clip_element`, which appears in a comment (`lint.mjs:245`). Those guarantees are not checked here. | `scripts/motion.mjs:2`, `:8`, `:127`; `scripts/lint.mjs:245` |
| F-13 | Low (matching) | `TA()` matches by prefix (`startsWith`), so `TA("not")` can land on "nothing" or "notice". The same prefix match is used in the number check (`lint.mjs:300-301`). | `example/build.mjs:37`; `scripts/lint.mjs:300-301` |

---

## 4. Usefulness (PRD item 3)

### 3a. Word-cue timing helper (TA, "time after")

- **Exists:** `example/build.mjs:33-40` (throws at `:39`). Also documented in `skills/hyperframe-pro-voice/SKILL.md:37-46`.
- **How it works:** walks `VO.words` in order and returns the first word whose normalised text starts with the normalised query and whose time is greater than `after + 0.01`. Each cue passes the previous cue's time as `after`, so the chain only moves forward. If nothing matches, it throws `cue "<word>" after <t>s not found`, and that throw is the "script changed, re-cue this beat" signal.
- **Portability to our stack:** yes, with an adapter. `voice/tts.py` writes `words.json` as a bare list of `{text, start, end}` in seconds from edge-tts WordBoundary events (`voice/tts.py:12-14`, `:69-75`). `TA` expects `VO.words` plus a `VO_START` offset (`build.mjs:31`), so set `VO_START = 0` in the adapter or wrap the list.
- **Change to make:** match exact normalised tokens first, and fall back to prefix only if the exact search fails (F-13). Our voice is Indonesian and the prefix match is unsafe with affixes.

### 3b. Lint gates (every gate found, with threshold)

Grep count from `scripts/lint.mjs`: 32 hard-error call sites (plus one conditional at `:46`), 6 warnings, 10 notes. The article's "about 30 gates" is accurate.

| # | Gate | Threshold or rule | Where | Level |
|---|---|---|---|---|
| 0 | Compiled-output guard | `data-hf-id` present, so the file is not generator output | `lint.mjs:31-35` | exit 2 |
| 1 | Root duration | `data-composition-id="main"` must have `data-duration` | `:24-25` | error |
| 2 | Character in hook | any character starting before 2.5 s | `:41-42` | error |
| 3 | Character screen time | more than 60 % of total duration | `:44-46` | error |
| 4 | Same framing across hard cut | adjacent instances with identical frame and pose | `:50` | error |
| 5 | Character overlap | two instances overlap in time | `:52` | error |
| 6 | Framing variety | fewer than 2 framings used | `:55` | error |
| 7 | Card asset exists | `assets/shots/<name>.png` | `:65`, `:222` | error |
| 8 | Card sourced | shot name appears in `publish/sources.txt` | `:66` | error |
| 9 | Card width | under 600 px | `:67` | warn |
| 10 | Ken Burns on card | no `tl.fromTo("#<id>-img")` | `:68-69` | warn |
| 11 | Hidden parent | child tweens, but the `.ct` parent is never set visible | `:72-77` | error |
| 12 | Infinite repeat | `repeat:-1` | `:90` | error |
| 13 | Source swap | `.src =` assignment | `:91` | error |
| 14 | Dangling target | tween targets an id not in the HTML | `:99-102` | error |
| 15 | Hook dark gap | gap over 0.25 s starting before 6 s; events read up to 8 s | `:155-164`, `:196` | error |
| 16 | Dead air | gap over 1.2 s with no hero-class element on screen | `:166-176` | error |
| 17 | Card visible | card never becomes visible | `:189` | error |
| 18 | Card hidden | card is never hidden | `:190-191` | error |
| 19 | Card outstays its step | card window crosses a later title card (±0.05 s) | `:182-193` | error |
| 20 | Every step has a screen | title card with no card on screen, beyond PLAN `crumbs` rows that have a `fallback:` | `:198-207` | error |
| 21 | Shot table matches file | drawn aspect ratio differs from PNG by more than 2 % | `:219-226` | error |
| 22 | Duration ceiling | over 179 s is an error; over 174 s is a note | `:233-241`; `example/build.mjs:43` | error |
| 23 | Video wiring | `<video>` needs `class="clip"`, `data-start`, an existing `src`, and a `sources.txt` line | `:243-261` | error |
| 24 | GSAP on clip | `autoAlpha` tweens on a clip element | `:263-265` | error |
| 25 | CSS hides clip | `opacity:0` or `visibility:hidden` in the clip's own CSS | `:266-268` | error |
| 26 | PLAN footage | `footage:<name>` in PLAN needs a matching `<video>` | `:271-274` | error |
| 27 | PLAN present | `export const PLAN` required | `:282` | error |
| 28 | PLAN framing repeat | consecutive rows with the same framing (except `absent`, `corner`) | `:286` | error |
| 29 | Counter is spoken | counter's first word must appear in the VO (Indonesian and English forms); only when `vo.words.json` exists (F-9) | `:289-302` | error |
| 30 | Crumbs need fallback | `hero: "crumbs"` needs a `fallback:` reason | `:304-305` | error |
| 31 | World part exists | `world:<part>` must be in `assets/world/manifest.json` | `:306-309` | error |

Warnings: `<video>` with no id (`:251`), `<video>` without `muted` (`:254`), hook with no hero (`:164`), mono tag inside a scene (`:92`), card under 600 px (`:67`), no Ken Burns (`:69`).

Notes include: character ratio, jump cuts, full-body framing used twice, PLAN row 1 framing, `recap` row, no `shot:` hero, duration over 174 s.

Limits: the hero test is class-based (F-10). Parsing is regex over the generator's output shape (`:60`, `:73`), so a small change in markup can silently disable a check.

### 3c. Beat-plan format

- **Exists:** `skills/hyperframe-pro-beats/SKILL.md:15-52` (job-to-hero table at `:17-28`, the three registers at `:32-36`, table template at `:46-49`). The `PLAN` array is in `example/build.mjs:15-20`. `lint.mjs:279-313` parses it.
- **Format:** one row per beat, with columns beat, from cue, to cue, hero, framing, zones (media, type, character), one annotation, and SFX. `from` and `to` are words in the narration, never timestamps.
- **Vocabulary seen in code:** hero values `slam`, `line`, `counter:<N>`, `shot:<name>`, `footage:<name>`, `world:<part>`, `crumbs` (needs `fallback:`), `recap`, `offer`, `card`, `tcard`. Framing values `absent`, `corner`, `bustR`, `bustClose`, `present` (`lint.mjs:50-57`, `:285-286`).
- **Portability:** yes. It is a process, and the `PLAN` object maps directly onto our scene rows. Keep the keys literal, because lint parses them with regex.

### 3d. Contact sheet and loudness

- **Contact sheet (video):** `skills/hyperframe-pro/SKILL.md:87`:
  `ffmpeg -i renders/out.mp4 -vf "fps=1/2,scale=200:-2,tile=6x6" -frames:v 1 sheet.jpg`
  I ran this exact string on a 30 s synthetic 1080x1920 clip. It wrote a 1200x2136 sheet. **Limit:** 36 tiles at one frame per 2 s covers 72 s, and `-frames:v 1` writes one sheet, so a 179 s video is cut at 72 s. For videos up to 180 s use `fps=1/5,scale=200:-2,tile=6x6` (36 x 5 s = 180 s). The 180 s case is arithmetic, not run.
- **Contact sheet (stills):** `scripts/shots.py:51-61` (`sheet`, Pillow). A horizontal strip 900 px high, for images, not video.
- **Loudness:** `scripts/tts.mjs:57` and `scripts/swap-line.py:95`:
  `ffmpeg -v error -y -i IN.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=9:linear=true -ar 44100 -ac 1 OUT.wav`
  Measured on a 12 s synthetic tone: -15.4 LUFS integrated against a -16 target (F-8). For a tighter target, the standard approach is two passes: measure first with `loudnorm=print_format=json`, then feed `measured_I`, `measured_TP`, `measured_LRA` and `measured_thresh` back in. I did not run the second pass.
- **Footage normalisation:** `scripts/prep-footage.sh:40-42`:
  `ffmpeg -loglevel error -y -ss SS -i IN -t DUR -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30[,unsharp=5:5:0.45:5:5:0.0]" -an -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart OUT`
  The `unsharp` step is added only when the source is narrower than 1080 px (`:32-33`). Not executed.
- **Still from a plate:** `skills/hyperframe-pro-footage/SKILL.md:142`: `ffmpeg -ss <t> -i clip.mp4 -frames:v 1 still.png`.
- **Portability:** the contact sheet is directly portable (with the `fps=1/5` fix). For loudness, our `voice/tts.py` already normalises to -14 LUFS and -1 dBTP (`voice/tts.py:12`, `:37-38`). Pick one target for the pipeline rather than mixing -14 and -16.

### 3e. Pause capping and line-swap revision

- **Pause capping, `scripts/trim-vo.py`:** caps any inter-word gap over 0.24 s (0.42 s before a number-step word) down to the cap, keeping half the cap on each side (`:37-41`). Splices PCM sample-exactly with 6 ms ramps (`:19`, `:46-68`). Re-times words from the frames actually removed (`:78-86`). The docs say caps below 0.18 s sound clipped (`skills/hyperframe-pro-voice/SKILL.md:74-75`).
  - **Portability:** the idea is portable, but `voice/tts.py` already has `--max-pause` (`:17`, and the cut logic in `edit_timeline`), which applies the same cap at generation time without post-processing. Prefer ours. Use `trim-vo.py` only for the post-hoc case, and only after F-1 is fixed.
- **Line swap, `scripts/swap-line.py`:** finds the phrase in the word table (`:37-45`), regenerates only the new sentence with ElevenLabs using `previous_text` and `next_text` for prosody (`:75-82`), level-matches by RMS (`:113-121`), splices and re-times (`:123-140`), backs up `assets/vo` first (`:106-109`), and prints the new cue words (`:145-146`).
  - **Portability:** partial. Its main value is the previous/next conditioning, which edge-tts does not offer. With edge-tts, a line swap means re-synthesising without context, so expect a prosody seam at the joins. Reuse the splice and re-time code only, and only after F-2 and F-3 are fixed. Do not adopt the file as-is.

### 3f. Other notable items

- **Browser probe** (`skills/hyperframe-pro/SKILL.md:90-114`): seeks the timeline to chosen times and lists visible ids per time. Each line should contain only the elements that beat owns. Cheap and useful. Fix the bind address first (RF-5).
- **Dead-air and hook-gap logic** (`scripts/lint.mjs:113-196`): measures on-screen coverage by reading the tween list. The idea is portable, but it needs our timeline format, and the hero test needs real size data (F-10).
- **Entrance and exit rules** (`scripts/motion.mjs:52-65`): entrance always moves at least two properties, and exit is 70 % of the entrance duration, followed by a hard `tl.set` kill so seeks stay correct. Pure functions with no I/O. Portable.
- **Screenshot tooling** (`scripts/shots.py`): `rows` (`:77-120`) finds content bands so callout coordinates are measured, not eyeballed. `check` (`:138-144`) requires the key line to be at least 46 px on frame. Pillow needs pinning.
- **Script rules** (`skills/hyperframe-pro-script/SKILL.md`): about 3 words per second (`:49-55`), hook complete in 2 s (`:30-43`), one call to action (`:81-84`), and never invent a number (`:68-69`). Language-neutral, and the examples are Indonesian, which fits our channel.
- **Footage plumbing** (`scripts/fal.mjs`): queue submit and poll (`:41-63`) is reasonable. See RF-1 and RF-4 before using it.

---

## 5. What I could not check

- **Git history:** the clone is shallow (`--depth 1`). Only the HEAD commit is visible, so earlier history, tags and branch history were not reviewed.
- **Author identity:** the LICENSE name "Hanif (@hanifproduktif)" and the GitHub owner `buildwithhanif` are not verified as the same person.
- **Runtime behaviour:** nothing from the repo was executed. No generator, lint, render, or repo script was run. F-1, F-2, F-3, F-9 and F-10 are from reading the code, not from running it.
- **Live APIs:** ElevenLabs and fal.ai were not called (no keys, and the rules forbid it). Prices quoted in `fal.mjs` are the author's comments and were not checked.
- **HyperFrames:** `hyperframes check` and render were not run, so the lint regexes were not tested against real HyperFrames output.
- **Commands from the repo:** the contact-sheet and loudnorm command strings were run as strings against synthetic media in the scratchpad (`/tmp/claude-0/-home-user/b6006682-cc98-5f72-b7cf-1f66cb6585c1/scratchpad/review/`). No repo file was used as input, and no repo script was run.
- **Python `http.server` default:** checked from the stdlib help text (`python3 -I -m http.server --help`), not by starting a server.
- **Platform claims:** the 2:59 deprioritisation and the Instagram behaviour are not verifiable from here.

---

## 6. Recommendations for our pipeline

1. **Do not install the plugin.** Copy specific ideas with attribution. If we copy whole files, keep the MIT notice (`LICENSE`) and vendor them at a pinned commit.
2. **Adopt:**
   - the `TA()` resolver, with exact-token matching first (F-13);
   - a timeline lint over our own scene data: dead air over 1.2 s, duration ceiling, counter-spoken check, hook coverage;
   - the browser probe, bound to 127.0.0.1;
   - the contact sheet with `fps=1/5` for videos up to 180 s.
3. **Skip:**
   - the footage plugin path and its realism recipe (RF-1), and the paid-call path without a spend cap (RF-4);
   - the "paint out numbers" rule (RF-2);
   - `swap-line.py` as-is (F-2, F-3, and the lost prosody context);
   - `trim-vo.py`, since `voice/tts.py --max-pause` already does the job.
4. **Pick one loudness target.** `voice/tts.py` uses -14 LUFS, and the repo uses -16.
5. **If anyone installs it anyway:** pin a commit, use `python3 -m http.server 8777 -b 127.0.0.1`, pin `npx hyperframes` to a version, and allowlist specific scripts rather than all of `node` and `python3`.

---

## 7. Files touched

- Created: `/home/user/sosialogi-video/thirdparty/` (directory), `/home/user/sosialogi-video/thirdparty/hyperframe-pro/` (shallow clone), `/home/user/sosialogi-video/thirdparty/REVIEW.md` (this file).
- Scratchpad only: `/tmp/claude-0/-home-user/b6006682-cc98-5f72-b7cf-1f66cb6585c1/scratchpad/review/` (scan script and synthetic test media).
- Not modified: `/home/user/sosialogi-video/template`, `/home/user/sosialogi-video/voice/tts.py`.
