// Builds video-02 from video.config.json: index.html, build/timeline.json, assets/vo/{vo.mp3,words.json,sentences.json}.
// Inputs: the script (research/video-02/script_v1.json), the visual plan (scenes.json), the two data CSVs and the VO take.
// Every element time is a word cue of the take. Every number on screen is formatted from the CSV and must be spoken
// at its cue. Validates everything first, prints every problem, and writes only when there are none.
// Run from video-02/: node tools/build.mjs   (or npm run build)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { makeCue, phraseTokens } from "./lib/cue.mjs";
import { parseCsv } from "./lib/csv.mjs";
import { fmtPct, spokenPct, spokenInt } from "./lib/nums.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (rel) => resolve(ROOT, rel);
const r3 = (x) => Math.round(x * 1000) / 1000;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const BRAND_IN_S = 0.6; // the brand tag fades in at this time (PRD-12)
const CAP_PAD_IN = 0.05; // caption chunk starts this long before its first word (video-01 v3)
const CAP_PAD_OUT = 0.15; // and ends this long after its last word
const SAFE_CANVAS = { w: 1080, h: 1920 };

const problems = [];
const bad = (msg) => problems.push(msg);

// ---------- inputs ----------
const cfg = JSON.parse(readFileSync(P("video.config.json"), "utf8"));
const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
const plan = JSON.parse(readFileSync(P(cfg.inputs.scenes), "utf8"));
const national = parseCsv(readFileSync(P(cfg.inputs.national), "utf8"));
const province = parseCsv(readFileSync(P(cfg.inputs.province), "utf8"));
const voiceDir = join(P(cfg.voice.dir), cfg.voice.variant);
const words = JSON.parse(readFileSync(join(voiceDir, "words.json"), "utf8"));
const sentences = JSON.parse(readFileSync(join(voiceDir, "sentences.json"), "utf8"));
const VO_SECONDS = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(voiceDir, "vo.mp3")], { encoding: "utf8" }).trim());

const S = script.scenes;
const N = S.length;
const planScenes = plan.scenes ?? [];

// ---------- script and take checks ----------
const wordCounts = S.map((s) => s.vo_text.split(/\s+/).filter(Boolean).length);
const wordStartIdx = [];
{ let acc = 0; for (const c of wordCounts) { wordStartIdx.push(acc); acc += c; } }
const scriptTokens = S.flatMap((s) => s.vo_text.split(/\s+/).filter(Boolean));
if (words.length !== scriptTokens.length) {
  bad(`words.json has ${words.length} entries, script has ${scriptTokens.length} words`);
} else {
  words.forEach((w, k) => {
    if (norm(w.text) !== norm(scriptTokens[k])) bad(`word ${k}: take "${w.text}" != script "${scriptTokens[k]}"`);
  });
}
if (/\d/.test(S.map((s) => s.vo_text).join(" "))) bad("digits in vo_text (speak numbers in words)");
const planIds = planScenes.map((s) => s.id);
const scriptIds = S.map((s) => s.id);
if (JSON.stringify(planIds) !== JSON.stringify(scriptIds)) {
  bad(`scenes.json ids ${JSON.stringify(planIds)} != script ids ${JSON.stringify(scriptIds)}`);
}
const sentStart = sentences.map((s) => words.findIndex((w) => Math.abs(w.start - s.start) < 1e-6));
if (sentStart.some((i) => i < 0)) bad("a sentences.json start does not match a word start");

// ---------- timing: every scene boundary is a word cue ----------
const { cueSpan } = makeCue(words);
const lastEnd = words.at(-1).end;
const TOTAL = r3(lastEnd + cfg.tail_s);
const sceneStart = wordStartIdx.map((k, i) => (i === 0 ? 0 : words[k]?.start));
const sceneEnd = sceneStart.map((_, i) => (i + 1 < N ? sceneStart[i + 1] : TOTAL));
if (words[0] && words[0].start > 1e-9) bad(`first word starts at ${words[0].start}, scene 1 is defined at 0`);

const cues = []; // every resolved cue, for timeline.json
function cueIn(si, phrase, where) {
  try {
    const sp = cueSpan(phrase, sceneStart[si] - 0.001);
    if (sp.time < sceneStart[si] - 1e-9 || sp.end > sceneEnd[si] + 1e-9) {
      throw new Error(`first match is ${r3(sp.time)}-${r3(sp.end)}, outside ${S[si].id} [${sceneStart[si]}, ${sceneEnd[si]})`);
    }
    cues.push({ scene: S[si].id, where, phrase, t: r3(sp.time) });
    return sp.time;
  } catch (e) {
    bad(`${where}: cue "${phrase}" does not resolve inside its scene: ${e.message}`);
    return NaN;
  }
}
const containsPhrase = (text, phrase) => ` ${phraseTokens(text).join(" ")} `.includes(` ${phraseTokens(phrase).join(" ")} `);

// ---------- data (every number comes from here) ----------
const numVal = (raw) => (raw === "" || raw === undefined ? 0 : Number(raw)); // empty cell = 0
function natRow(year) {
  const r = national.find((x) => x.year === String(year));
  if (!r) throw new Error(`no re_national row for ${year}`);
  return r;
}
function provRow(name) {
  const r = province.find((x) => x.province === name);
  if (!r) throw new Error(`no re_province row for ${name}`);
  return r;
}

// Named data checks. Each returns { ok, values }. The build fails if one is false.
const CHECKS = {
  one_in_five_2013: () => {
    const raw = natRow(2013).ratio_pct;
    const v = 100 - Number(raw);
    return { ok: v >= 18 && v < 20, values: { "re_national[2013].ratio_pct": raw, "100 - ratio": v.toFixed(2), rule: "18 <= 100 - re_national[2013] < 20" } };
  },
  under_two_per_1000_2025: () => {
    const raw = natRow(2025).ratio_pct;
    const v = 10 * (100 - Number(raw));
    return { ok: v >= 1 && v < 2, values: { "re_national[2025].ratio_pct": raw, "10 * (100 - ratio)": v.toFixed(2), rule: "1 <= 10 * (100 - re_national[2025]) < 2" } };
  },
  flat_last_year: () => {
    const a = natRow(2024).ratio_pct;
    const b = natRow(2025).ratio_pct;
    return { ok: a === b, values: { "re_national[2024].ratio_pct": a, "re_national[2025].ratio_pct": b, rule: "equal as strings" } };
  },
  lowest_province: () => {
    const pp = provRow("Papua Pegunungan");
    const ppv = numVal(pp.re_total);
    const others = province.filter((r) => r.province !== "Papua Pegunungan").map((r) => ({ name: r.province, v: numVal(r.re_total) }));
    const minOther = others.reduce((a, b) => (b.v < a.v ? b : a));
    return { ok: ppv < minOther.v, values: { "Papua Pegunungan re_total": pp.re_total, "lowest other": `${minOther.name} ${minOther.v}`, rule: "strictly lowest re_total" } };
  },
  ltshe_over_half: () => {
    const raw = provRow("Papua Pegunungan").re_ltshe;
    return { ok: numVal(raw) > 50, values: { "Papua Pegunungan re_ltshe": raw, rule: "re_ltshe > 50" } };
  },
};
const checkResults = {};
for (const [name, fn] of Object.entries(CHECKS)) {
  try {
    const r = fn();
    checkResults[name] = { name, ok: r.ok, values: r.values };
    if (!r.ok) bad(`data check ${name} is false: ${JSON.stringify(r.values)}`);
  } catch (e) {
    checkResults[name] = { name, ok: false, error: e.message };
    bad(`data check ${name}: ${e.message}`);
  }
}
function checkRef(name, where) {
  if (!name) return;
  if (!checkResults[name]) bad(`${where}: unknown data check "${name}"`);
}

// Resolve a data reference to its value and its on-screen / spoken forms.
function refValue(ref, where) {
  const table = ref.from === "national" ? national : ref.from === "province" ? province : null;
  if (!table) throw new Error(`${where}: unknown table "${ref.from}"`);
  const keyCol = ref.from === "national" ? "year" : "province";
  const row = table.find((r) => r[keyCol] === String(ref.key));
  if (!row) throw new Error(`${where}: no ${ref.from} row for ${ref.key}`);
  const raw = row[ref.field];
  if (raw === undefined) throw new Error(`${where}: no column ${ref.field}`);
  const label = `${ref.from}[${ref.key}].${ref.field}`;
  if (ref.as === "year") {
    return { value: Number(raw), text: raw, spoken: spokenInt(raw), derive: `${label} = "${raw}" (CSV year)` };
  }
  if (ref.as === "pct") {
    const printed = raw === "" ? "0" : raw;
    const text = fmtPct(printed);
    return { value: Number(printed), text, spoken: spokenPct(text), derive: `fmtPct(${label} = "${raw}")` };
  }
  const v = numVal(raw);
  const value = ref.complement ? 100 - v : v;
  return { value, text: null, spoken: null, derive: ref.complement ? `100 - ${label} = ${value}` : `${label} = ${v}` };
}

// ---------- number elements ----------
const numbers = []; // numbers registry
function numEl(e, si, where) {
  const sid = S[si].id;
  let v = null;
  let text;
  let spoken;
  let derive;
  let lines = null;
  if (e.from) {
    try { v = refValue(e, where); } catch (err) { bad(err.message); return null; }
    if (v.text === null) { bad(`${where}: a displayed number needs as: "pct" or "year"`); return null; }
    text = (e.prefix ?? "") + v.text + (e.suffix ?? "");
    spoken = v.spoken;
    derive = v.derive;
  } else {
    if (!e.spoken) { bad(`${where}: a literal number needs "spoken"`); return null; }
    lines = Array.isArray(e.lines) ? e.lines : null;
    text = lines ? lines.join(" ") : e.text;
    spoken = e.spoken;
    derive = "literal number; the spoken form is written in scenes.json and tied to its data check";
  }
  if (e.cue !== spoken) bad(`${where}: cue "${e.cue}" must be the spoken form "${spoken}"`);
  if (!containsPhrase(S[si].vo_text, spoken)) bad(`${where}: spoken "${spoken}" is not in the vo_text of ${sid}`);
  checkRef(e.check, where);
  if (e.check && checkResults[e.check] && !checkResults[e.check].ok) bad(`${where}: data check ${e.check} failed`);
  const t = cueIn(si, spoken, where);
  numbers.push({ text, spoken, t: r3(t), scene: sid, derive, check: e.check ?? null });
  return { text, lines, spoken, t: r3(t), value: v ? v.value : null, color: e.color ?? null };
}

// Plain text element: may carry an optional cue. A digit in plain text is an error (only numbers and citations carry digits).
function textOf(list, where) {
  const out = [];
  for (const s of list) {
    if (typeof s !== "string") { bad(`${where}: line must be text`); continue; }
    if (/\d/.test(s)) bad(`${where}: "${s}" has a digit; a number needs a data reference or a literal spoken form`);
    out.push(s);
  }
  return out;
}

// ---------- part resolvers ----------
const RESOLVE = {
  claim(p, si, where) {
    return {
      kicker: textOf([p.kicker], `${where}.kicker`)[0],
      lines: textOf(p.lines, `${where}.lines`),
      reveal: numEl(p.reveal, si, `${where}.reveal`),
    };
  },
  pair(p, si, where) {
    return {
      title: textOf([p.title], `${where}.title`)[0],
      rows: p.rows.map((r, k) => ({
        year: numEl(r.year, si, `${where} row ${k} year`),
        value: numEl(r.value, si, `${where} row ${k} value`),
      })),
    };
  },
  grid(p, si, where) {
    const total = p.cols * p.rows;
    const unlitCount = (ref, w) => {
      try { return Math.round(10 * (100 - refValue(ref, w).value)); } catch (e) { bad(e.message); return NaN; }
    };
    const from = unlitCount(p.unlit_from, `${where}.unlit_from`);
    const to = unlitCount(p.unlit_to, `${where}.unlit_to`);
    if (!(from >= 0 && from <= total) || !(to >= 0 && to <= from)) bad(`${where}: unlit counts ${from} -> ${to} out of range`);
    const headline = numEl(p.headline, si, `${where}.headline`);
    const sw = cueIn(si, p.switch.cue, `${where}.switch`);
    return {
      cols: p.cols, rows: p.rows, dot: p.dot, gap: p.gap, lit: p.lit, unlit: p.unlit,
      label: textOf([p.label], `${where}.label`)[0],
      unlit_from: from, unlit_to: to,
      derive: `unlit = round(10 * (100 - re_national[2013].ratio_pct)) = ${from}; after the switch unlit = round(10 * (100 - re_national[2025].ratio_pct)) = ${to}`,
      switch: { t: r3(sw), label: textOf([p.switch.label], `${where}.switch.label`)[0], fill_s: p.switch.fill_s },
      headline: { lines: headline ? headline.lines : null, text: headline ? headline.text : null, t: headline ? headline.t : NaN, check: p.headline.check },
      subline: textOf([p.subline], `${where}.subline`)[0],
    };
  },
  textcard(p, si, where) {
    checkRef(p.check, where);
    return { lines: textOf(p.lines, `${where}.lines`), check: p.check ?? null };
  },
  rankbars(p, si, where) {
    const sub = numEl(p.subtitle, si, `${where}.subtitle`);
    const n = p.rows.count;
    const lowest = [...province].sort((a, b) => numVal(a.re_total) - numVal(b.re_total)).slice(0, n);
    const ordered = [...lowest].sort((a, b) => (100 - numVal(b.re_total)) - (100 - numVal(a.re_total)));
    const max = Math.max(...ordered.map((r) => 100 - numVal(r.re_total)));
    const tTer = cueIn(si, p.rows.cue, `${where}.rows`);
    const hl = p.rows.highlight;
    const hlT = cueIn(si, hl.cue, `${where}.rows.highlight`);
    if (!ordered.some((r) => r.province === hl.key)) bad(`${where}: highlight "${hl.key}" is not one of the ${n} rows`);
    const rows = ordered.map((r, k) => {
      const isHl = r.province === hl.key;
      return {
        name: r.province,
        t: r3(tTer + k * p.rows.stagger_s),
        frac_pct: r3((100 * (100 - numVal(r.re_total))) / max),
        highlight: isHl ? { t: r3(hlT), color: hl.color } : null,
      };
    });
    const label = numEl(p.label, si, `${where}.label`);
    return {
      title: textOf([p.title], `${where}.title`)[0],
      subtitle: { text: sub ? sub.text : null, t: sub ? sub.t : NaN },
      rows,
      label: { text: label ? label.text : null, t: label ? label.t : NaN },
    };
  },
  stack(p, si, where) {
    const segs = p.bar.segments.map((seg) => {
      const v = refValue(seg, `${where}.${seg.id}`);
      return { id: seg.id, label: textOf([seg.label], `${where}.${seg.id}`)[0], color: seg.color, value: v.value, derive: v.derive };
    });
    const sum = segs.reduce((a, s) => a + s.value, 0);
    if (Math.abs(sum - 100) > 0.005) bad(`${where}: segments sum to ${sum}, expected 100`);
    const message = p.message.map((m, k) => {
      const w = `${where} message ${k}`;
      const t = cueIn(si, m.cue, w);
      const num = m.num ? numEl(m.num, si, `${w}.num`) : null;
      if (m.outline && !segs.some((s) => s.id === m.outline)) bad(`${w}: outline "${m.outline}" is not a segment`);
      checkRef(m.check, w);
      return {
        t: r3(t),
        mode: m.mode,
        lines: textOf(m.lines, `${w}.lines`),
        num: num ? { text: num.text, t: num.t, color: m.num.color } : null,
        outline: m.outline ?? null,
        color: m.color ?? null,
        check: m.check ?? null,
      };
    });
    return {
      title: textOf([p.title], `${where}.title`)[0],
      bar: { height: p.bar.height, grow_s: p.bar.grow_s },
      segments: segs.map((s) => ({ id: s.id, label: s.label, color: s.color, pct: r3(s.value), derive: s.derive })),
      message,
    };
  },
  close(p, si, where) {
    const block = p.block.map((it, k) => ({
      t: r3(cueIn(si, it.cue, `${where} block ${k}`)),
      lines: textOf(it.lines, `${where} block ${k}`),
    }));
    const cta = p.card.cta?.script ? script[p.card.cta.script] : p.card.cta;
    const sources = p.card.sources?.script ? script[p.card.sources.script] : p.card.sources;
    if (typeof cta !== "string") bad(`${where}: card cta is not text`);
    if (typeof sources !== "string") bad(`${where}: card sources is not text`);
    // The sources line is a citation: it is the only element allowed to carry digits (exempt from the number rule).
    return { block, card: { t: r3(cueIn(si, p.card.cue, `${where} card`)), cta, sources, cite: true } };
  },
};

// ---------- scenes ----------
const sceneOut = [];
const citations = [];
S.forEach((s, si) => {
  const planParts = planScenes[si]?.parts ?? [];
  if (planParts.length === 0) bad(`${s.id}: no parts in scenes.json`);
  const parts = [];
  let prevTo = sceneStart[si];
  planParts.forEach((p, pi) => {
    const where = `${s.id} part ${pi} (${p.type})`;
    const from = p.from !== undefined ? cueIn(si, p.from, `${where} from`) : pi === 0 ? sceneStart[si] : prevTo;
    const to = p.to !== undefined ? cueIn(si, p.to, `${where} to`) : pi === planParts.length - 1 ? sceneEnd[si] : NaN;
    if (pi > 0 && Math.abs(from - prevTo) > 1e-9) bad(`${where}: starts at ${from}, the previous part ends at ${prevTo}`);
    if (pi === planParts.length - 1 && Math.abs(to - sceneEnd[si]) > 1e-9) bad(`${where}: last part must end at the scene end`);
    if (!(to > from)) bad(`${where}: part must end after it starts (from ${from}, to ${to}); a middle part needs "to"`);
    prevTo = to;
    const fn = RESOLVE[p.type];
    if (!fn) { bad(`${where}: unknown part type "${p.type}"`); return; }
    let body;
    try {
      body = fn(p, si, where);
    } catch (e) {
      bad(`${where}: ${e.message}`);
      return;
    }
    if (body.card?.cite) citations.push({ scene: s.id, text: body.card.sources });
    parts.push({ type: p.type, from: r3(from), to: r3(to), ...body });
  });
  sceneOut.push({ index: si, id: s.id, start: r3(sceneStart[si]), end: r3(sceneEnd[si]), parts });
});

// ---------- gates ----------
const hookSpan = r3(words[wordCounts[0] - 1].end - words[0].start);
const closeSpan = r3(TOTAL - sceneStart[N - 1]);
const gates = [
  { name: "hook", value: hookSpan, max: cfg.hook_max_s },
  { name: "close", value: closeSpan, max: cfg.close_max_s },
  { name: "total", value: TOTAL, max: cfg.total_max_s },
];
for (const g of gates) {
  g.ok = g.value <= g.max + 1e-9;
  if (!g.ok) bad(`gate ${g.name} ${g.value} s > ${g.max} s`);
}

// ---------- captions (word-synced; port of video-01 v3 build_v3.mjs) ----------
const sentStartIdx = new Set(sentStart.filter((i) => i >= 0));
const runs = new Map();
S.forEach((s, si) => {
  for (const cd of s.caption_display ?? []) {
    const toks = cd.spoken.split(/\s+/).filter(Boolean).map(norm);
    let hits = 0;
    for (let i = wordStartIdx[si]; i + toks.length <= wordStartIdx[si] + wordCounts[si]; i++) {
      if (toks.every((t, j) => norm(words[i + j].text) === t)) {
        runs.set(i, { n: toks.length, show: cd.show });
        hits++;
        i += toks.length - 1;
      }
    }
    if (!hits) bad(`caption_display "${cd.spoken}" -> "${cd.show}" matches no words in ${s.id}`);
  }
});
const capWords = [];
for (let i = 0; i < words.length; ) {
  const run = runs.get(i);
  if (run) {
    capWords.push({ text: run.show, start: words[i].start, end: words[i + run.n - 1].end, i });
    i += run.n;
  } else {
    capWords.push({ text: words[i].text, start: words[i].start, end: words[i].end, i });
    i++;
  }
}
const NUMW = new Set(["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas", "belas", "puluh", "ratus", "ribu", "seratus", "seribu", "koma", "juta"]);
const isNum = (w) => NUMW.has(norm(w.text));
const groups = [];
{
  let cur = [];
  const chars = (g) => g.map((w) => w.text).join(" ").length;
  for (const w of capWords) {
    if (cur.length) {
      const prev = cur[cur.length - 1];
      const sentenceBreak = sentStartIdx.has(w.i);
      const phraseBreak = /[,.;:!?]$/.test(prev.text) && cur.length >= 2;
      const tooBig = cur.length >= 5 || chars(cur) + 1 + w.text.length > 34;
      const numStart = isNum(w) && !isNum(prev);
      if (sentenceBreak || phraseBreak || numStart || tooBig) { groups.push(cur); cur = []; }
    }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
}
const captionsOut = groups.map((g, k) => {
  const start = Math.max(0, r3(g[0].start - CAP_PAD_IN));
  const nextStart = k + 1 < groups.length ? groups[k + 1][0].start - CAP_PAD_IN : null;
  const end = r3(Math.min(g.at(-1).end + CAP_PAD_OUT, nextStart !== null ? nextStart - 0.01 : TOTAL));
  if (!(end > start)) bad(`caption ${k} has no duration`);
  return { i: k, start, end, words: g.map((w) => ({ i: w.i, text: w.text, start: r3(w.start), end: r3(w.end) })) };
});

// ---------- output ----------
if (problems.length) {
  console.error(`build: ${problems.length} problem(s), nothing written:\n - ` + problems.join("\n - "));
  process.exit(1);
}

const fps = cfg.fps;
const runtime = { fps, total: TOTAL, scenes: sceneOut, captions: captionsOut, brand: { text: cfg.brand, t: BRAND_IN_S } };

// assets: copy the take (only after validation)
const assetDir = P("assets/vo");
mkdirSync(assetDir, { recursive: true });
for (const f of ["vo.mp3", "words.json", "sentences.json"]) copyFileSync(join(voiceDir, f), join(assetDir, f));

// index.html
const safe = cfg.safe;
const rootVars = `:root {\n  --safe-top: ${safe.top}px; --safe-bottom: ${safe.bottom}px; --safe-left: ${safe.left}px; --safe-right: ${safe.right}px;\n  --safe-w: ${SAFE_CANVAS.w - safe.left - safe.right}px; --hero-top: ${cfg.hero_band.top}px; --hero-bottom: ${cfg.hero_band.bottom}px;\n}`;
const sosCss = readFileSync(P("components/sos.css"), "utf8").replace(/url\("\.\.\/assets\//g, 'url("assets/');
const styleRaw = `${rootVars}\n${sosCss}`;

const sceneSections = sceneOut
  .map((s) => `      <section id="scene-${s.index}-${s.id}" class="clip scene" data-index="${s.index}" data-start="${s.start}" data-duration="${r3(s.end - s.start)}" data-track-index="${s.index}"></section>`)
  .join("\n");
const overlays = [`      <div id="overlay-brand" class="overlay brand clip" data-start="${BRAND_IN_S}" data-duration="${r3(TOTAL - BRAND_IN_S)}" data-track-index="4">${esc(cfg.brand)}</div>`];
captionsOut.forEach((c) => {
  const spans = c.words.map((w) => `<span class="w" id="cw-${w.i}">${esc(w.text)}</span>`).join(" ");
  overlays.push(`      <div id="cap-${c.i}" class="overlay cap clip" data-tb="caption" data-start="${c.start}" data-duration="${r3(c.end - c.start)}" data-track-index="5">${spans}</div>`);
});
const audio = `      <audio id="vo" src="assets/vo/vo.mp3" data-start="0" data-duration="${VO_SECONDS}" preload="auto"></audio>`;
const configJson = JSON.stringify(runtime).replace(/</g, "\\u003c");

const template = readFileSync(P("src/template.html"), "utf8");
const fill = (src, key, value) => src.replace(`{{${key}}}`, () => value);
const html = [
  ["TOTAL", String(TOTAL)],
  ["FPS", String(fps)],
  ["SCENES", sceneSections],
  ["OVERLAYS", overlays.join("\n")],
  ["AUDIO", audio],
  ["STYLE", styleRaw],
  ["CONFIG_JSON", configJson],
].reduce((acc, [key, value]) => fill(acc, key, value), template);
if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error("build: unreplaced placeholder left in index.html");
writeFileSync(P("index.html"), html, "utf8");

// build/timeline.json
const timeline = {
  id: "video-02",
  fps,
  total: TOTAL,
  vo_seconds: VO_SECONDS,
  gates,
  scenes: sceneOut.map((s) => ({ id: s.id, start: s.start, end: s.end })),
  cues,
  numbers,
  checks: Object.values(checkResults),
  citations,
  captions: captionsOut,
};
mkdirSync(P("build"), { recursive: true });
writeFileSync(P("build/timeline.json"), JSON.stringify(timeline, null, 2) + "\n", "utf8");

// summary
console.log(`build: wrote index.html and build/timeline.json; total ${TOTAL} s @ ${fps} fps; VO ${VO_SECONDS} s`);
console.log("build: data checks");
for (const c of Object.values(checkResults)) console.log(`  ${c.ok ? "true " : "FALSE"} ${c.name}  ${JSON.stringify(c.values)}`);
console.log("build: scenes");
for (const s of sceneOut) console.log(`  [${s.index}] ${s.id.padEnd(13)} ${String(s.start).padStart(7)} - ${String(s.end).padEnd(7)} parts: ${s.parts.map((p) => `${p.type}(${p.from}-${p.to})`).join(", ")}`);
console.log("build: gates");
for (const g of gates) console.log(`  ${g.name.padEnd(6)} ${g.value} s  (limit ${g.max} s)  ${g.ok ? "ok" : "OVER"}`);
console.log(`build: caption chunks ${captionsOut.length}`);
console.log(`build: numbers registry (${numbers.length})`);
for (const n of numbers) console.log(`  t=${n.t}  ${n.scene}  "${n.text}"  spoken "${n.spoken}"  derive: ${n.derive}${n.check ? `  check: ${n.check}` : ""}`);
console.log(`build: citations (exempt from the number rule): ${citations.map((c) => `${c.scene} "${c.text}"`).join("; ")}`);
