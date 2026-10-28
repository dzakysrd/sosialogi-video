// Builds video-03 from video.config.json: index.html, build/timeline.json, assets/vo/{vo.mp3,words.json,sentences.json}.
// Inputs: the script (research/video-03/script_v2.json), the visual plan (scenes.json), the data tables (cfg.inputs.tables) and the VO take.
// Every element time is a word cue of the take. Every number on screen is formatted from a table and must be spoken
// at its cue. Validates everything first, prints every problem, and writes only when there are none.
// Run from video-03/: node tools/build.mjs   (or npm run build)
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
// Caption chunk limits (PRD-14: lowered from 34 / 40 characters until every chunk is one line in Chrome at the caption style;
// lint.mjs checks it). A chunk has at most 5 caption words and 33 characters; a one-word chunk merges into a neighbour of its
// sentence if the result has at most 6 words and 33 characters.
const CAP_MAX_WORDS = 5;
const CAP_MAX_CHARS = 33;
const CAP_MERGE_WORDS = 6;
const CAP_MERGE_CHARS = 33;
const SAFE_CANVAS = { w: 1080, h: 1920 };

const problems = [];
const bad = (msg) => problems.push(msg);

// ---------- inputs ----------
const cfg = JSON.parse(readFileSync(P("video.config.json"), "utf8"));
const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
const plan = JSON.parse(readFileSync(P(cfg.inputs.scenes), "utf8"));
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
const punct = scriptTokens.map((t) => t.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? ""); // trailing punctuation of each script word (PRD-13)
if (words.length !== scriptTokens.length) {
  bad(`words.json has ${words.length} entries, script has ${scriptTokens.length} words`);
} else {
  words.forEach((w, k) => {
    if (norm(w.text) !== norm(scriptTokens[k])) bad(`word ${k}: take "${w.text}" != script "${scriptTokens[k]}"`);
    if (w.text + punct[k] !== scriptTokens[k]) bad(`word ${k}: take "${w.text}" + script punctuation "${punct[k]}" != script token "${scriptTokens[k]}"`);
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

// Visual timing (PRD-13): a scene's visuals start at visual_start_cue when it is set; the previous scene's visuals stay on until
// then. Captions and audio keep the word timing above. visEnd of a scene is the next scene's visual start (or its scene end).
const visStart = S.map((s, si) => {
  const vc = planScenes[si]?.visual_start_cue;
  if (vc === undefined) return sceneStart[si];
  if (si === 0) { bad(`${s.id}: visual_start_cue is not allowed on the first scene`); return sceneStart[si]; }
  const t = cueIn(si, vc, `${s.id} visual_start_cue`);
  return Number.isNaN(t) ? sceneStart[si] : t;
});
const visEnd = S.map((_, si) => (si + 1 < N ? visStart[si + 1] : sceneEnd[si]));
visStart.forEach((t, si) => {
  if (si > 0 && !(t > visStart[si - 1])) bad(`${S[si].id}: visuals start at ${r3(t)}, not after ${S[si - 1].id} at ${r3(visStart[si - 1])}`);
});

// ---------- data (every number comes from here) ----------
const numVal = (raw) => (raw === "" || raw === undefined ? 0 : Number(raw)); // empty cell = 0
// Every table of cfg.inputs.tables: { rows, key } (key = the column a reference names).
const TABLES = {};
for (const [name, t] of Object.entries(cfg.inputs.tables)) {
  TABLES[name] = { rows: parseCsv(readFileSync(P(t.path), "utf8")), key: t.key };
}
function rowOf(name, key) {
  const tab = TABLES[name];
  if (!tab) throw new Error(`unknown table "${name}"`);
  const r = tab.rows.find((x) => x[tab.key] === String(key));
  if (!r) throw new Error(`no ${name} row for ${key}`);
  return r;
}
// Province rankings: the table's rows without the national row (is_national "1").
const provinces = () => TABLES.neet.rows.filter((r) => r.is_national !== "1");

// Named data checks. Each returns { ok, values }. The build fails if one is false.
const CHECKS = {
  neet_one_in_five: () => {
    const raw = rowOf("neet", "INDONESIA").neet_pct;
    const v = Number(raw);
    return { ok: v >= 18 && v < 20, values: { "neet[INDONESIA].neet_pct": raw, rule: "18 <= neet_pct < 20" } };
  },
  neet_highest_sulut: () => {
    const rows = provinces();
    const me = Number(rowOf("neet", "SULAWESI UTARA").neet_pct);
    const best = Math.max(...rows.filter((r) => r.province !== "SULAWESI UTARA").map((r) => Number(r.neet_pct)));
    return { ok: rows.length === 38 && me > best, values: { "neet[SULAWESI UTARA].neet_pct": me, "highest other": best, provinces: rows.length, rule: "strictly highest of the 38 provinces" } };
  },
  neet_lowest_bali: () => {
    const rows = provinces();
    const me = Number(rowOf("neet", "BALI").neet_pct);
    const least = Math.min(...rows.filter((r) => r.province !== "BALI").map((r) => Number(r.neet_pct)));
    return { ok: rows.length === 38 && me < least, values: { "neet[BALI].neet_pct": me, "lowest other": least, provinces: rows.length, rule: "strictly lowest of the 38 provinces" } };
  },
  tpt_1519_highest: () => {
    const rows = TABLES.tpt_age.rows.filter((r) => r.age_group !== "Rata-Rata" && r.age_group !== "15-19");
    const me = Number(rowOf("tpt_age", "15-19").tpt_pct);
    const best = Math.max(...rows.map((r) => Number(r.tpt_pct)));
    return { ok: me > best, values: { "tpt_age[15-19].tpt_pct": me, "highest other age group": best, rule: "strictly highest age group, Rata-Rata excluded" } };
  },
  years_since_1928: () => {
    const n = 2026 - 1928;
    return { ok: n === 98, values: { "2026 - 1928": n, rule: "= 98 (Sumpah Pemuda, 28 Oktober 1928)" } };
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
// A named check on an element: it must exist, and it must hold (the build fails otherwise).
function checkRef(name, where) {
  if (!name) return;
  if (!checkResults[name]) { bad(`${where}: unknown data check "${name}"`); return; }
  if (!checkResults[name].ok) bad(`${where}: data check ${name} failed`);
}

// Resolve a data reference to its value and its on-screen / spoken forms.
function refValue(ref, where) {
  const tab = TABLES[ref.from];
  if (!tab) throw new Error(`${where}: unknown table "${ref.from}"`);
  const row = tab.rows.find((r) => r[tab.key] === String(ref.key));
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
// Caption runs: a span of words shown as one caption word. runs maps its first word index to { n, show, num }; num marks a number
// run (it stays invisible in its chunk until its cue, sos.js); runOwner marks the words taken.
const runs = new Map();
const runOwner = new Array(words.length).fill(null);
function addRun(wi, n, show, where, num = false) {
  for (let j = wi; j < wi + n; j++) {
    if (runOwner[j]) { bad(`${where}: caption run "${show}" overlaps ${runOwner[j]}`); return; }
  }
  for (let j = wi; j < wi + n; j++) runOwner[j] = where;
  runs.set(wi, { n, show, num });
}
// A repeat shows an earlier number again (scenes.json "repeat_of": the spoken form of the earlier entry). It has no cue of its
// own: it takes the earlier entry's cue, shows the same value, and is not spoken in its own scene.
function repeatEl(e, si, where) {
  const sid = S[si].id;
  let v;
  try { v = refValue(e, where); } catch (err) { bad(err.message); return null; }
  if (v.text === null) { bad(`${where}: a repeated number needs as: "pct" or "year"`); return null; }
  const text = (e.prefix ?? "") + v.text + (e.suffix ?? "");
  const idx = numbers.findIndex((n) => n.repeat_of === null && n.spoken === e.repeat_of && n.caption === v.text);
  if (idx < 0) { bad(`${where}: repeat of "${e.repeat_of}" showing "${v.text}" matches no earlier registry entry`); return null; }
  const orig = numbers[idx];
  numbers.push({ text, caption: null, spoken: orig.spoken, t: orig.t, scene: sid, derive: `repeat of registry entry ${idx} ("${orig.text}", ${orig.scene}), same cue`, check: null, words: null, repeat_of: idx });
  return { text, lines: null, spoken: orig.spoken, t: orig.t, value: v.value, color: null };
}
function numEl(e, si, where) {
  if (e.repeat_of !== undefined) return repeatEl(e, si, where);
  const sid = S[si].id;
  let v = null;
  let text;
  let caption;
  let spoken;
  let derive;
  let lines = null;
  if (e.from) {
    try { v = refValue(e, where); } catch (err) { bad(err.message); return null; }
    if (v.text === null) { bad(`${where}: a displayed number needs as: "pct" or "year"`); return null; }
    text = (e.prefix ?? "") + v.text + (e.suffix ?? "");
    caption = v.text; // the bare number as on screen ("80,51%", "2013"): no prefix or suffix
    spoken = v.spoken;
    derive = v.derive;
  } else {
    if (!e.spoken) { bad(`${where}: a literal number needs "spoken"`); return null; }
    if (!e.caption) { bad(`${where}: a literal number needs "caption" (its display in the captions)`); return null; }
    lines = Array.isArray(e.lines) ? e.lines : null;
    text = lines ? lines.join(" ") : e.text;
    caption = e.caption;
    spoken = e.spoken;
    derive = "literal number; the spoken form is written in scenes.json and tied to its data check";
  }
  if (e.cue !== spoken) bad(`${where}: cue "${e.cue}" must be the spoken form "${spoken}"`);
  if (!containsPhrase(S[si].vo_text, spoken)) bad(`${where}: spoken "${spoken}" is not in the vo_text of ${sid}`);
  checkRef(e.check, where);
  const t = cueIn(si, spoken, where);
  // the number's words: one caption run, from its first to its last spoken word
  let wi = -1;
  if (!Number.isNaN(t)) {
    wi = words.findIndex((w) => Math.abs(w.start - t) < 1e-9);
    const toks = phraseTokens(spoken);
    if (wi < 0 || !toks.every((tk, j) => norm(words[wi + j]?.text ?? "") === tk)) bad(`${where}: spoken "${spoken}" is not the words at its cue`);
    else addRun(wi, toks.length, caption, where, true);
  }
  numbers.push({ text, caption, spoken, t: r3(t), scene: sid, derive, check: e.check ?? null, words: wi >= 0 ? [wi, wi + phraseTokens(spoken).length - 1] : null, repeat_of: null });
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
  // A row has a year (a number element) or a label (text, at its cue or at the part start), and a value (a number element).
  pair(p, si, where, from) {
    const tn = p.title_num ? numEl(p.title_num, si, `${where}.title_num`) : null;
    return {
      title: textOf([p.title], `${where}.title`)[0],
      subtitle: p.subtitle ? textOf([p.subtitle], `${where}.subtitle`)[0] : null,
      title_num: tn ? { text: tn.text, t: tn.t } : null,
      rows: p.rows.map((r, k) => {
        const w = `${where} row ${k}`;
        const value = numEl(r.value, si, `${w} value`);
        let slot;
        if (r.label) {
          const lt = r.label.cue !== undefined ? cueIn(si, r.label.cue, `${w} label`) : from;
          checkRef(r.label.check, `${w} label`);
          slot = { label: { text: textOf(r.label.lines, `${w} label`).join(" "), t: r3(lt), check: r.label.check ?? null } };
        } else {
          const yr = numEl(r.year, si, `${w} year`);
          slot = { year: yr ? { text: yr.text, t: yr.t } : null };
        }
        return { ...slot, value: value ? { text: value.text, value: value.value, t: value.t } : null };
      }),
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
      derive: `unlit = round(10 * (100 - unlit_from value)) = ${from}; after the switch unlit = round(10 * (100 - unlit_to value)) = ${to}`,
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
    const tab = TABLES[p.rows.from];
    if (!tab) throw new Error(`${where}: rows.from "${p.rows.from}" is not a table`);
    const field = p.rows.field;
    const name = (r) => r[tab.key];
    const pool = tab.rows.filter((r) => r.is_national !== "1");
    const sub = numEl(p.subtitle, si, `${where}.subtitle`);
    const n = p.rows.count;
    const lowest = [...pool].sort((a, b) => numVal(a[field]) - numVal(b[field])).slice(0, n);
    const ordered = [...lowest].sort((a, b) => (100 - numVal(b[field])) - (100 - numVal(a[field])));
    const max = Math.max(...ordered.map((r) => 100 - numVal(r[field])));
    const tRows = cueIn(si, p.rows.cue, `${where}.rows`);
    const hl = p.rows.highlight;
    const hlT = cueIn(si, hl.cue, `${where}.rows.highlight`);
    if (!ordered.some((r) => name(r) === hl.key)) bad(`${where}: highlight "${hl.key}" is not one of the ${n} rows`);
    const rows = ordered.map((r, k) => {
      const isHl = name(r) === hl.key;
      return {
        name: name(r),
        t: r3(tRows), // all five rows appear together at the rows cue
        grow_t: r3(tRows + k * p.rows.stagger_s), // each bar grows in its own step
        frac_pct: r3((100 * (100 - numVal(r[field]))) / max),
        highlight: isHl ? { t: r3(hlT), color: hl.color } : null,
      };
    });
    const label = numEl(p.label, si, `${where}.label`);
    return {
      title: textOf([p.title], `${where}.title`)[0],
      subtitle: { text: sub ? sub.text : null, t: sub ? sub.t : NaN },
      rows,
      label: { lines: textOf(p.label.lines ?? [], `${where}.label`), text: label ? label.text : null, t: label ? label.t : NaN },
    };
  },
  stack(p, si, where) {
    const sub = p.subtitle ? numEl(p.subtitle, si, `${where}.subtitle`) : null; // a repeat (PRD-14): shown from the part start
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
      subtitle: sub ? { text: sub.text, t: sub.t } : null,
      bar: { height: p.bar.height, grow_s: p.bar.grow_s },
      segments: segs.map((s) => ({ id: s.id, label: s.label, color: s.color, pct: r3(s.value), derive: s.derive })),
      message,
    };
  },
  // A block item: lines at its cue, and an optional number (num) at the number's own cue, in the same block.
  close(p, si, where) {
    const block = p.block.map((it, k) => {
      const w = `${where} block ${k}`;
      const num = it.num ? numEl(it.num, si, `${w} num`) : null;
      return {
        t: r3(cueIn(si, it.cue, w)),
        lines: textOf(it.lines, w),
        num: num ? { text: num.text, t: num.t } : null,
      };
    });
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
  let prevTo = visStart[si];
  planParts.forEach((p, pi) => {
    const where = `${s.id} part ${pi} (${p.type})`;
    const from = p.from !== undefined ? cueIn(si, p.from, `${where} from`) : pi === 0 ? visStart[si] : prevTo;
    const to = p.to !== undefined ? cueIn(si, p.to, `${where} to`) : pi === planParts.length - 1 ? visEnd[si] : NaN;
    if (pi === 0 && Math.abs(from - visStart[si]) > 1e-9) bad(`${where}: starts at ${r3(from)}, the scene visuals start at ${r3(visStart[si])}`);
    if (pi > 0 && Math.abs(from - prevTo) > 1e-9) bad(`${where}: starts at ${from}, the previous part ends at ${prevTo}`);
    if (pi === planParts.length - 1 && Math.abs(to - visEnd[si]) > 1e-9) bad(`${where}: last part must end at ${r3(visEnd[si])}, the scene visuals end`);
    if (!(to > from)) bad(`${where}: part must end after it starts (from ${from}, to ${to}); a middle part needs "to"`);
    prevTo = to;
    const fn = RESOLVE[p.type];
    if (!fn) { bad(`${where}: unknown part type "${p.type}"`); return; }
    let body;
    try {
      body = fn(p, si, where, from);
    } catch (e) {
      bad(`${where}: ${e.message}`);
      return;
    }
    if (body.card?.cite) citations.push({ scene: s.id, text: body.card.sources });
    parts.push({ type: p.type, from: r3(from), to: r3(to), ...body });
  });
  sceneOut.push({ index: si, id: s.id, start: r3(sceneStart[si]), end: r3(sceneEnd[si]), vis_start: r3(visStart[si]), vis_end: r3(visEnd[si]), parts });
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
S.forEach((s, si) => {
  for (const cd of s.caption_display ?? []) {
    const toks = cd.spoken.split(/\s+/).filter(Boolean).map(norm);
    let hits = 0;
    for (let i = wordStartIdx[si]; i + toks.length <= wordStartIdx[si] + wordCounts[si]; i++) {
      if (toks.every((t, j) => norm(words[i + j].text) === t)) {
        addRun(i, toks.length, cd.show, `${s.id} caption_display "${cd.spoken}"`);
        hits++;
        i += toks.length - 1;
      }
    }
    if (!hits) bad(`caption_display "${cd.spoken}" -> "${cd.show}" matches no words in ${s.id}`);
  }
});
const sentenceOf = []; // sentence index of each word (from sentences.json)
{ let sent = -1; for (let k = 0; k < words.length; k++) { if (sentStartIdx.has(k)) sent++; sentenceOf[k] = sent; } }
// Caption words: one per word, or one per run (a number run or a caption_display run, its whole spoken span). Each carries the
// punctuation of its last script word, so the caption shows the script's punctuation.
const capWords = [];
for (let i = 0; i < words.length; ) {
  const run = runs.get(i);
  const n = run ? run.n : 1;
  const last = i + n - 1;
  capWords.push({ i, n, text: (run ? run.show : words[i].text) + punct[last], start: words[i].start, end: words[last].end, sent: sentenceOf[i], num: run ? run.num : false });
  i += n;
}
// Chunks: a new chunk at each sentence start, after a word ending in , . : ; ! ? when the chunk has 2 or more words,
// and before a word that would make it more than CAP_MAX_WORDS caption words or more than CAP_MAX_CHARS characters.
const capChars = (g) => g.map((w) => w.text).join(" ").length;
const groups = [];
{
  let cur = [];
  for (const w of capWords) {
    if (cur.length) {
      const prev = cur[cur.length - 1];
      const sentenceBreak = sentStartIdx.has(w.i);
      const phraseBreak = /[,.:;!?]$/.test(prev.text) && cur.length >= 2;
      const tooBig = cur.length >= CAP_MAX_WORDS || capChars([...cur, w]) > CAP_MAX_CHARS;
      if (sentenceBreak || phraseBreak || tooBig) { groups.push(cur); cur = []; }
    }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
}
// A one-word chunk merges into a neighbour of its own sentence: the previous chunk if the result fits, else the next one.
const fitsMerge = (g) => g.length <= CAP_MERGE_WORDS && capChars(g) <= CAP_MERGE_CHARS;
const mergedGroups = new Set(); // chunks that took a one-word neighbour: they may use the merge limits (lint checks this)
const chunks = [];
for (let k = 0; k < groups.length; k++) {
  const g = groups[k];
  if (g.length === 1) {
    const prev = chunks[chunks.length - 1];
    const next = groups[k + 1];
    if (prev && prev[0].sent === g[0].sent && fitsMerge([...prev, ...g])) { const m = [...prev, ...g]; mergedGroups.add(m); chunks[chunks.length - 1] = m; continue; }
    if (next && next[0].sent === g[0].sent && fitsMerge([...g, ...next])) { const m = [...g, ...next]; mergedGroups.add(m); groups[k + 1] = m; continue; }
  }
  chunks.push(g);
}
chunks.forEach((g, k) => {
  if (!fitsMerge(g)) bad(`caption chunk ${k} "${g.map((w) => w.text).join(" ")}" is over ${CAP_MERGE_WORDS} words or ${CAP_MERGE_CHARS} characters`);
});
for (const k of sentStartIdx) {
  const c = chunks.find((g) => g.some((w) => w.i === k));
  if (!c || c[0].i !== k) bad(`sentence start word ${k} does not begin a caption chunk`);
}
for (const n of numbers) {
  if (!n.words) continue;
  const [w0, w1] = n.words;
  if (!capWords.some((c) => c.i === w0 && c.n === w1 - w0 + 1)) bad(`number "${n.spoken}" is split across caption words`);
}
// A chunk starts CAP_PAD_IN before its first word, but not before the previous chunk's last word has ended (PRD-14: a caption
// never hides a word that is still being spoken), so the previous chunk can end at its last word.
const startOf = (k) => Math.max(0, r3(Math.max(chunks[k][0].start - CAP_PAD_IN, k > 0 ? chunks[k - 1].at(-1).end + 0.01 : -Infinity)));
const captionsOut = chunks.map((g, k) => {
  const start = startOf(k);
  const nextStart = k + 1 < chunks.length ? startOf(k + 1) : null;
  const end = r3(Math.min(g.at(-1).end + CAP_PAD_OUT, nextStart !== null ? nextStart - 0.01 : TOTAL));
  if (!(end > start)) bad(`caption ${k} has no duration`);
  const text = g.map((w) => w.text).join(" ");
  return { i: k, start, end, duration: r3(end - start), text, merged: mergedGroups.has(g), words: g.map((w) => ({ i: w.i, n: w.n, text: w.text, start: r3(w.start), end: r3(w.end), num: w.num })) };
});

// ---------- output ----------
if (problems.length) {
  console.error(`build: ${problems.length} problem(s), nothing written:\n - ` + problems.join("\n - "));
  process.exit(1);
}

const fps = cfg.fps;
const runtime = { fps, total: TOTAL, scenes: sceneOut.map((s) => ({ index: s.index, id: s.id, start: s.vis_start, end: s.vis_end, parts: s.parts })), captions: captionsOut, brand: { text: cfg.brand, t: BRAND_IN_S } };

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
  .map((s) => `      <section id="scene-${s.index}-${s.id}" class="clip scene" data-index="${s.index}" data-start="${s.vis_start}" data-duration="${r3(s.vis_end - s.vis_start)}" data-track-index="${s.index}"></section>`)
  .join("\n");
const overlays = [`      <div id="overlay-brand" class="overlay brand clip" data-start="${BRAND_IN_S}" data-duration="${r3(TOTAL - BRAND_IN_S)}" data-track-index="4">${esc(cfg.brand)}</div>`];
captionsOut.forEach((c) => {
  const spans = c.words.map((w) => `<span class="w${w.num ? " num" : ""}" id="cw-${w.i}">${esc(w.text)}</span>`).join(" ");
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
  id: "video-03",
  fps,
  total: TOTAL,
  vo_seconds: VO_SECONDS,
  gates,
  scenes: sceneOut.map((s) => ({ id: s.id, start: s.start, end: s.end, visual_start: s.vis_start, visual_end: s.vis_end })),
  cues,
  numbers,
  checks: Object.values(checkResults),
  citations,
  caption_limits: { max_words: CAP_MAX_WORDS, max_chars: CAP_MAX_CHARS, merge_words: CAP_MERGE_WORDS, merge_chars: CAP_MERGE_CHARS },
  captions: captionsOut,
};
mkdirSync(P("build"), { recursive: true });
writeFileSync(P("build/timeline.json"), JSON.stringify(timeline, null, 2) + "\n", "utf8");

// summary
console.log(`build: wrote index.html and build/timeline.json; total ${TOTAL} s @ ${fps} fps; VO ${VO_SECONDS} s`);
console.log("build: data checks");
for (const c of Object.values(checkResults)) console.log(`  ${c.ok ? "true " : "FALSE"} ${c.name}  ${JSON.stringify(c.values)}`);
console.log("build: scenes");
for (const s of sceneOut) console.log(`  [${s.index}] ${s.id.padEnd(13)} words ${String(s.start).padStart(7)} - ${String(s.end).padEnd(7)} visuals ${String(s.vis_start).padStart(7)} - ${String(s.vis_end).padEnd(7)} parts: ${s.parts.map((p) => `${p.type}(${p.from}-${p.to})`).join(", ")}`);
console.log("build: gates");
for (const g of gates) console.log(`  ${g.name.padEnd(6)} ${g.value} s  (limit ${g.max} s)  ${g.ok ? "ok" : "OVER"}`);
console.log(`build: caption chunks ${captionsOut.length} (limits: ${CAP_MAX_WORDS} words / ${CAP_MAX_CHARS} characters; a one-word chunk merges when the result is at most ${CAP_MERGE_WORDS} words / ${CAP_MERGE_CHARS} characters)`);
console.log("build: chunk list (start, end, duration, words, characters, text; * = merged)");
for (const c of captionsOut) {
  console.log(`  ${String(c.i).padStart(2)}  ${c.start.toFixed(3)}  ${c.end.toFixed(3)}  ${c.duration.toFixed(3)}  ${String(c.words.length).padStart(1)}w ${String(c.text.length).padStart(2)}ch ${c.merged ? "*" : " "} ${c.text}`);
}
const oneWord = captionsOut.filter((c) => c.words.length === 1);
console.log(`build: one-word chunks: ${oneWord.length ? oneWord.map((c) => `${c.i} "${c.text}"`).join("; ") : "none"}`);
console.log(`build: numbers registry (${numbers.length})`);
for (const n of numbers) console.log(`  t=${n.t}  ${n.scene}  "${n.text}"  caption "${n.caption ?? "-"}"  spoken "${n.spoken}"  derive: ${n.derive}${n.check ? `  check: ${n.check}` : ""}${n.repeat_of !== null ? `  repeat of ${n.repeat_of}` : ""}`);
console.log(`build: citations (exempt from the number rule): ${citations.map((c) => `${c.scene} "${c.text}"`).join("; ")}`);
