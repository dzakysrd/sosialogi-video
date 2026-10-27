// Lint for video-01. Exits non-zero on any failure. Run after `node tools/build.mjs`.
// Checks: cues resolve; numbers on screen are spoken at their cue and come from data.csv; dead air;
// framing alternation (beats.md vs timeline); total length; safe zones and overlaps and caption lines in a browser probe.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { makeCue, phraseTokens, tokenize } from "./lib/cue.mjs";
import { fmtShort, spokenInt } from "./lib/nums.mjs";
import { parseCsv } from "./lib/csv.mjs";
import { existsSync, readdirSync, statSync } from "node:fs";
import { decodeHTML } from "./lib/html.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (rel) => resolve(ROOT, rel);
const cfg = JSON.parse(readFileSync(P("video.config.json"), "utf8"));
const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
const data = parseCsv(readFileSync(P(cfg.inputs.data), "utf8"));
const words = JSON.parse(readFileSync(P(cfg.inputs.words), "utf8"));
const tl = JSON.parse(readFileSync(P("build/timeline.json"), "utf8"));
const { cueSpan } = makeCue(words);
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

// Scene word ranges (whitespace tokens of vo_text, same count as words.json, checked in build)
const counts = script.scenes.map((s) => s.vo_text.split(/\s+/).filter(Boolean).length);
const ranges = {}; { let a = 0; script.scenes.forEach((s, i) => { ranges[s.id] = [a, a + counts[i]]; a += counts[i]; }); }
const sceneOfTime = (t) => script.scenes.find((s) => { const [a, b] = ranges[s.id]; return t >= words[a].start - 1e-6 && t <= words[b - 1].end + 1e-6; });

// 1. Cues: every script cue word resolves inside its own scene.
for (const s of script.scenes) {
  const [a, b] = ranges[s.id];
  for (const cw of s.cue_words) {
    let span;
    try { span = cueSpan(cw, words[a].start - 1e-6); } catch (e) { fail(`${s.id}: cue "${cw}" does not resolve: ${e.message}`); continue; }
    if (span.index < a || span.index >= b) fail(`${s.id}: cue "${cw}" resolves outside its scene (word ${span.index})`);
  }
}
notes.push(`cues: ${script.scenes.reduce((n, s) => n + s.cue_words.length, 0)} script cue words resolved`);

// 2. Numbers: each on-screen number is spoken inside its scene, at its cue, and derives from data.
const prov = Object.fromEntries(data.map((r) => [r.province, { ump: Number(r.ump_2026), avg: r.avg_wage === "" ? null : Number(r.avg_wage) }]));
const knownSorted = data.filter((r) => r.avg_wage !== "").map((r) => ({ name: r.province, ump: Number(r.ump_2026), avg: Number(r.avg_wage) })).sort((x, y) => x.avg - y.avg);
const bottom10 = knownSorted.slice(0, 10);
const countBelow = bottom10.filter((p) => p.avg < p.ump).length;
const derive = (d, sceneSpokenText) => {
  if (d.startsWith("ump:")) return fmtShort(prov[d.slice(4)].ump);
  if (d.startsWith("avg:")) return fmtShort(prov[d.slice(4)].avg);
  if (d === "count_below") return spokenInt(String(countBelow));
  if (d === "group_size") return spokenInt(String(bottom10.length));
  return null;
};
let numChecked = 0; const exempt = [];
for (const n of tl.numbers) {
  if (n.citation) { exempt.push(`${n.text} (${n.scene})`); continue; }
  const s = script.scenes.find((x) => x.id === n.scene);
  if (!s) { fail(`number ${n.text}: unknown scene ${n.scene}`); continue; }
  const [a, b] = ranges[s.id];
  const want = phraseTokens(n.spoken);
  let found = -1;
  for (let i = a; i + want.length <= b; i++) {
    if (want.every((t, j) => phraseTokens(words[i + j].text).join(" ").split(" ").includes(t) && words[i + j].text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").includes(t))) {
      // exact sequence check using the same tokenizer as the cue resolver
      const seq = tokenize(words.slice(i, i + want.length)).map((x) => x.t);
      if (seq.length >= want.length && want.every((t, j) => seq[j] === t)) { found = i; break; }
    }
  }
  if (found < 0) { fail(`number ${n.text}: spoken form "${n.spoken}" not found in ${s.id}`); continue; }
  const phraseStart = words[found].start;
  if (Math.abs(phraseStart - n.t) > 0.2) fail(`number ${n.text}: appears at ${n.t}s but "${n.spoken}" is spoken at ${phraseStart.toFixed(3)}s`);
  if (n.derive && n.derive.includes(":")) {
    const v = derive(n.derive, s.vo_text);
    if (v !== null && v !== n.text && n.derive.startsWith("ump:") | n.derive.startsWith("avg:")) {
      if (v !== n.text) fail(`number ${n.text}: data says ${v} (${n.derive})`);
    }
  } else if (n.derive === "count_below" || n.derive === "group_size") {
    const expect = n.derive === "count_below" ? countBelow : bottom10.length;
    if (String(expect) !== n.text) fail(`number ${n.text}: data says ${expect} (${n.derive})`);
  }
  numChecked++;
}
// every number token on screen (script on_screen_text) must be represented in the timeline
for (const s of script.scenes) {
  const toks = (s.on_screen_text.match(/Rp\d+(?:,\d+)? jt|\d+/g) || []);
  for (const tok of toks) {
    const hit = tl.numbers.some((n) => n.scene === s.id && (n.text === tok || (tok.startsWith("Rp") && n.text === tok)));
    if (!hit) fail(`${s.id}: on-screen number "${tok}" has no timeline entry`);
  }
}
notes.push(`numbers: ${numChecked} on-screen numbers spoken at their cue and derived from data.csv; citation exemptions: ${exempt.join(", ")}`);

// 3. Dead air: union of hero intervals, gaps over 1.2 s fail.
const hero = tl.beats.map((b) => ({ id: b.id, a: b.hero.from, b: b.hero.to })).sort((x, y) => x.a - y.a);
let covered = 0; let maxGap = 0;
let edge = 0;
for (const h of hero) { if (h.a - edge > maxGap) maxGap = h.a - edge; edge = Math.max(edge, h.b); }
maxGap = Math.max(maxGap, tl.total - edge);
if (maxGap > 1.2) fail(`dead air: ${maxGap.toFixed(2)} s with no hero element (limit 1.2 s)`);
notes.push(`dead air: largest gap without a hero element ${maxGap.toFixed(3)} s (limit 1.2 s)`);

// 4. Framing: beats.md rows vs timeline, and no two consecutive beats share a framing.
const md = readFileSync(P("beats.md"), "utf8").split("\n").filter((l) => /^\| B\d+ \|/.test(l));
const mdRows = md.map((l) => l.split("|").map((c) => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1));
const mdFraming = mdRows.map((c) => ({ id: c[0], framing: c[2] }));
if (mdFraming.length !== tl.beats.length) fail(`beats.md has ${mdFraming.length} rows, timeline has ${tl.beats.length} beats`);
tl.beats.forEach((b, i) => {
  const row = mdFraming[i];
  if (!row) return;
  if (row.framing !== b.framing) fail(`${b.id}: framing ${b.framing} in build, ${row.framing} in beats.md`);
});
for (let i = 1; i < tl.beats.length; i++) {
  if (tl.beats[i].framing === tl.beats[i - 1].framing) fail(`consecutive beats ${tl.beats[i - 1].id} and ${tl.beats[i].id} both ${tl.beats[i].framing}`);
}
notes.push(`framing: ${tl.beats.map((b) => b.framing).join(" > ")}`);

// 5. Length and tail: video ends 0.8 s after the last word.
const lastWord = words[words.length - 1].end;
if (tl.total > 60) fail(`total ${tl.total}s exceeds 60 s`);
if (Math.abs(tl.total - (lastWord + cfg.tail_s)) > 0.01) fail(`total ${tl.total} != last word ${lastWord} + ${cfg.tail_s}`);
notes.push(`duration: ${tl.total}s (last word ${lastWord}s + ${cfg.tail_s}s)`);

// 6. Browser probe: safe zones, overlaps, caption lines, first-frame hero band.
const CH = (() => {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const stack = ["/root/.cache/hyperframes/chrome"]; while (stack.length) { const d = stack.pop(); for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) stack.push(p); else if (n === "chrome-headless-shell") return p; } }
  throw new Error("chrome-headless-shell not found");
})();
const times = new Set();
for (let t = 0; t < tl.total; t += 0.5) times.add(+t.toFixed(3));
for (const b of tl.beats) { times.add(+(b.start + 0.05).toFixed(3)); times.add(+(b.end - 0.05).toFixed(3)); }
for (const v of Object.values(tl.cues)) { times.add(+(v + 0.05).toFixed(3)); times.add(+(v - 0.02).toFixed(3)); }
times.add(+(tl.total - 0.01).toFixed(3));
const sels = [".kicker", ".kicker2", ".big", ".sub", ".sub2", ".headline", ".hook-a", ".hook-b", ".lbl", ".legend", ".card", ".cta span", ".bar-label", ".bar-val", ".badge", ".brand", ".mapcredit", ".cap", ".seven", ".seven-txt"];
const probeHTML = readFileSync(P("index.html"), "utf8").replace("</body>", `<pre id="probe">pending</pre><script>
(function(){ var out = {}; var tl = window.__timelines["main"]; var times = ${JSON.stringify([...times].sort((a, b) => a - b))}; var sels = ${JSON.stringify(sels)};
 try { times.forEach(function(t){ tl.seek(t, false); var rows = [];
   sels.forEach(function(sel){ document.querySelectorAll(sel).forEach(function(e){ var c = getComputedStyle(e); var r = e.getBoundingClientRect();
     if (c.visibility !== "visible" || parseFloat(c.opacity) < 0.01 || r.width < 1 || r.height < 1) return;
     var lines = 0; if (e.classList.contains("cap")) { var tops = {}; e.querySelectorAll(".w").forEach(function(w){ tops[Math.round(w.getBoundingClientRect().top)] = 1; }); lines = Object.keys(tops).length; }
     rows.push({ sel: sel, id: e.id || "", x: r.left, y: r.top, r: r.right, b: r.bottom, txt: (e.textContent || "").slice(0, 30), lines: lines }); }); });
   out[t] = rows; });
   document.getElementById("probe").textContent = JSON.stringify(out); } catch (e) { document.getElementById("probe").textContent = "ERR " + e.message; } })();
</script></body>`);
const probeDir = P("build/probe"); mkdirSync(probeDir, { recursive: true });
const probeFile = join(probeDir, "lint-probe.html");
writeFileSync(probeFile, probeHTML);
const dom = execFileSync(CH, ["--headless", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=60000", "--window-size=1080,1920", "--dump-dom", "file://" + probeFile],
  { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
const m = /<pre id="probe">([\s\S]*?)<\/pre>/.exec(dom);
if (!m) fail("browser probe produced no output");
const probeOut = m && !m[1].startsWith("ERR") && m[1] !== "pending" ? JSON.parse(decodeHTML(m[1])) : null;
if (!probeOut) fail("browser probe failed: " + (m ? decodeHTML(m[1]).slice(0, 200) : "no output"));
const S = { left: cfg.safe.left, right: cfg.width - cfg.safe.right, top: cfg.safe.top, bottom: cfg.height - cfg.safe.bottom };
let rowsChecked = 0; const seen = new Set();
if (probeOut) {
  for (const [t, rows] of Object.entries(probeOut)) {
    for (const r of rows) {
      rowsChecked++;
      const key = r.sel + "|" + r.txt;
      const eps = 0.5;
      if (r.x < S.left - eps || r.r > S.right + eps || r.y < S.top - eps || r.b > S.bottom + eps) {
        if (!seen.has(key)) { seen.add(key); fail(`outside safe box at t=${t}: ${r.sel} "${r.txt}" x ${r.x.toFixed(0)}..${r.r.toFixed(0)} y ${r.y.toFixed(0)}..${r.b.toFixed(0)} (safe x ${S.left}..${S.right}, y ${S.top}..${S.bottom})`); }
      }
      if (r.sel === ".cap" && r.lines > 2) fail(`caption at t=${t} has ${r.lines} lines (max 2): "${r.txt}"`);
    }
    // overlaps between visible text boxes (ignore a box inside another, and map labels)
    for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      if (a.sel === b.sel && a.id === b.id) continue;
      const ix = Math.min(a.r, b.r) - Math.max(a.x, b.x), iy = Math.min(a.b, b.b) - Math.max(a.y, b.y);
      if (ix > 4 && iy > 4) {
        const k = [a.sel + ":" + a.txt, b.sel + ":" + b.txt].sort().join(" <> ");
        if (!seen.has(k)) { seen.add(k); fail(`overlap at t=${t}: "${a.txt}" (${a.sel}) and "${b.txt}" (${b.sel})`); }
      }
    }
  }
  // first frame: the hook title sits in the vertical centre band
  const f0 = (probeOut["0"] || []).filter((r) => r.sel === ".hook-a" || r.sel === ".hook-b");
  if (f0.length !== 2) fail(`hook title not visible in first frame (${f0.length} of 2 lines)`);
  const band = cfg.hero_band;
  for (const r of f0) if (r.y < band.top || r.b > band.bottom) fail(`hook line "${r.txt}" at y ${r.y.toFixed(0)}..${r.b.toFixed(0)} is outside the centre band ${band.top}..${band.bottom}`);
  notes.push(`probe: ${times.size} sample times, ${rowsChecked} text boxes checked against safe box x ${S.left}..${S.right}, y ${S.top}..${S.bottom}`);
}

// 7. Brand comes from config (not hardcoded) and appears in the page.
const html = readFileSync(P("index.html"), "utf8");
if (!html.includes(`id="brand"`) || !html.includes(cfg.brand)) fail("brand tag from config missing from index.html");
if (!html.includes(cfg.badge)) fail("DRAFT badge missing");

for (const n of notes) console.log("ok  " + n);
if (failures.length) {
  console.log(`FAIL ${failures.length} problem(s):`);
  for (const f of failures) console.log("  - " + f);
  process.exit(1);
}
console.log("lint: all checks passed");
