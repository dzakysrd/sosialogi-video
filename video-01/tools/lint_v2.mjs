// Lint for video-01 v2. Exits non-zero on any failure. Run after `node tools/build_v2.mjs`.
// Static: cues resolve inside their scene; spoken numbers match data and land at their cue; no digits in vo_text;
// dead air; framing alternation vs beats_v2.md; length; hook card; close length; brand; no DRAFT badge; source credit.
// Browser probe (headless Chrome): safe box, overlaps, caption lines, every visible digit is a registered number that is
// already spoken, no zero values, map state at the name cues, hero band.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, symlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { makeCue, phraseTokens, tokenize } from "./lib/cue.mjs";
import { fmtShort, spokenShort, spokenInt } from "./lib/nums.mjs";
import { parseCsv } from "./lib/csv.mjs";
import { decodeHTML } from "./lib/html.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (rel) => resolve(ROOT, rel);
const cfg = JSON.parse(readFileSync(P("video.v2.config.json"), "utf8"));
const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
const data = parseCsv(readFileSync(P(cfg.inputs.data), "utf8"));
const umkRows = parseCsv(readFileSync(P(cfg.inputs.umk), "utf8"));
const words = JSON.parse(readFileSync(P(cfg.inputs.words), "utf8"));
const tl = JSON.parse(readFileSync(P("build/v2/timeline.json"), "utf8"));
const html = readFileSync(P("index.html"), "utf8");
const { cueSpan } = makeCue(words);
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

// ---------- 1. script and cues ----------
const counts = script.scenes.map((s) => s.vo_text.split(/\s+/).filter(Boolean).length);
const ranges = {}; { let a = 0; script.scenes.forEach((s, i) => { ranges[s.id] = [a, a + counts[i]]; a += counts[i]; }); }
const total = counts.reduce((a, b) => a + b, 0);
if (total !== words.length) fail(`word count ${words.length} != script ${total}`);
if (total < 105 || total > 130) fail(`script ${total} words, target 105-130`);
const allVo = script.scenes.map((s) => s.vo_text).join(" ");
if (/\d/.test(allVo)) fail("digits in vo_text");
if (/melanggar/i.test(allVo)) fail('"melanggar" in vo_text');
for (const s of script.scenes) {
  const [a, b] = ranges[s.id];
  for (const cw of s.cue_words) {
    let span;
    try { span = cueSpan(cw, words[a].start - 1e-6); } catch (e) { fail(`${s.id}: cue "${cw}" does not resolve`); continue; }
    // the resolver returns a token index (hyphenated words split), so scene membership is checked on time
    if (span.time < words[a].start - 1e-6 || span.time > words[b - 1].end + 1e-6) fail(`${s.id}: cue "${cw}" at ${span.time}s is outside its scene`);
  }
}
notes.push(`script: ${total} words, ${words.length} timed words, no digits in vo_text`);

// ---------- 2. numbers: spoken at their cue, derived from data ----------
const prov = Object.fromEntries(data.map((r) => [r.province, { ump: Number(r.ump_2026), avg: Number(r.avg_wage) }]));
const umk = Object.fromEntries(umkRows.map((r) => [r.kabkota.replace(/^(Kabupaten|Kota) /, ""), Number(r.umk_2026)]));
const below = data.filter((r) => Number(r.avg_wage) < Number(r.ump_2026)).length;
const derive = (d) => {
  if (d === "year") return "2026";
  if (d.startsWith("ump:")) return fmtShort(prov[d.slice(4)].ump);
  if (d.startsWith("avg:")) return fmtShort(prov[d.slice(4)].avg);
  if (d.startsWith("umk:")) return fmtShort(umk[d.slice(4)]);
  if (d === "count_below") return String(below);
  if (d === "count_total") return String(data.length);
  return null;
};
const spokenOf = { year: spokenInt("2026"), count_below: spokenInt(String(below)), count_total: spokenInt(String(data.length)) };
const reg = {};  // key (digits) -> { t, text }
for (const n of tl.numbers) {
  const want = derive(n.derive);
  if (want !== null && want !== n.text) fail(`number ${n.text} (${n.derive}): data says ${want}`);
  const s = script.scenes.find((x) => x.id === n.scene);
  if (!s) { fail(`number ${n.text}: unknown scene ${n.scene}`); continue; }
  const spoken = n.spoken || spokenOf[n.derive] || spokenShort(n.text);
  const [a, b] = ranges[s.id];
  const seqWant = phraseTokens(spoken);
  let found = -1;
  for (let i = a; i + seqWant.length <= b; i++) {
    const seq = tokenize(words.slice(i, i + seqWant.length)).map((x) => x.t);
    if (seq.length >= seqWant.length && seqWant.every((t, j) => seq[j] === t)) { found = i; break; }
  }
  if (found < 0) { fail(`number ${n.text}: "${spoken}" not spoken in ${s.id}`); continue; }
  if (Math.abs(words[found].start - n.t) > 0.2) fail(`number ${n.text}: shown at ${n.t}s, spoken at ${words[found].start.toFixed(3)}s`);
  const key = n.text.match(/\d+(?:,\d+)?/g).join("");
  reg[key] = { t: n.t, text: n.text };
}
notes.push(`numbers: ${Object.keys(reg).length} registered on-screen numbers, each spoken at its cue and derived from data (${Object.entries(reg).map(([k, v]) => `${k}@${v.t}`).join(", ")})`);

// ---------- 3. timing ----------
const lastWord = words[words.length - 1].end;
if (Math.abs(tl.total - (lastWord + cfg.tail_s)) > 0.01) fail(`total ${tl.total} != last word ${lastWord} + tail ${cfg.tail_s}`);
if (tl.total > 60) fail(`total ${tl.total} s > 60`);
const b1 = tl.beats.find((b) => b.id === "B1"), b8 = tl.beats.find((b) => b.id === "B8");
if (b1.end - b1.start > cfg.hook_card_s + 1e-6) fail(`hook card ${(b1.end - b1.start).toFixed(2)} s > ${cfg.hook_card_s}`);
if (b8.end - b8.start > cfg.close_max_s + 1e-6) fail(`close ${(b8.end - b8.start).toFixed(2)} s > ${cfg.close_max_s}`);
notes.push(`timing: total ${tl.total}s (last word ${lastWord}s + tail ${cfg.tail_s}s); hook card ${(b1.end - b1.start).toFixed(2)}s; close ${(b8.end - b8.start).toFixed(2)}s`);

// ---------- 4. dead air (hero union) and framing ----------
const hero = tl.beats.map((b) => ({ a: b.hero.from, b: b.hero.to })).sort((x, y) => x.a - y.a);
let edge = 0, maxGap = 0;
for (const h of hero) { if (h.a - edge > maxGap) maxGap = h.a - edge; edge = Math.max(edge, h.b); }
maxGap = Math.max(maxGap, tl.total - edge);
if (maxGap > 1.2) fail(`dead air ${maxGap.toFixed(2)} s > 1.2`);
notes.push(`dead air: largest gap ${maxGap.toFixed(3)} s (limit 1.2)`);
const md = readFileSync(P("beats_v2.md"), "utf8").split("\n").filter((l) => /^\| B\d+ \|/.test(l));
const mdRows = md.map((l) => l.split("|").map((c) => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1));
if (mdRows.length !== tl.beats.length) fail(`beats_v2.md has ${mdRows.length} rows, timeline ${tl.beats.length}`);
tl.beats.forEach((b, i) => { const row = mdRows[i]; if (row && row[0] !== b.id) fail(`row ${i} id ${row[0]} != ${b.id}`); if (row && row[2] !== b.framing) fail(`${b.id}: framing ${b.framing} in build, ${row[2]} in beats_v2.md`); });
for (let i = 1; i < tl.beats.length; i++) if (tl.beats[i].framing === tl.beats[i - 1].framing) fail(`consecutive beats ${tl.beats[i - 1].id} and ${tl.beats[i].id} both ${tl.beats[i].framing}`);
notes.push(`framing: ${tl.beats.map((b) => b.framing).join(" > ")}`);

// ---------- 5. static HTML gates ----------
if (!html.includes(cfg.brand)) fail("brand missing from index.html");
if (/DRAFT/i.test(html)) fail("DRAFT text still in index.html (v2 must not show the draft badge)");
if (!html.includes(cfg.source_credit)) fail("source credit missing");
if (/Rp0(?!\d)/.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) fail("a literal Rp0 is in the page markup");
notes.push("static: brand from config, no DRAFT badge, source credit present, no literal Rp0 in markup");

// ---------- 6. browser probe ----------
const CH = (() => {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const stack = ["/root/.cache/hyperframes/chrome"]; while (stack.length) { const d = stack.pop(); for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) stack.push(p); else if (n === "chrome-headless-shell") return p; } }
  throw new Error("chrome-headless-shell not found");
})();
const times = new Set();
for (let t = 0; t < tl.total; t += 0.5) times.add(+t.toFixed(3));
for (const b of tl.beats) { times.add(+(b.start + 0.05).toFixed(3)); times.add(+(b.end - 0.05).toFixed(3)); }
for (const v of Object.values(tl.cues)) { times.add(+(v + 0.05).toFixed(3)); times.add(+(v - 0.02).toFixed(3)); times.add(+(v + 0.35).toFixed(3)); }
times.add(+(tl.total - 0.01).toFixed(3));
const sorted = [...times].sort((a, b) => a - b);
const TEXT_SEL = [".headline", ".kicker", ".kicker2", ".big", ".bigmid", ".sub", ".claim-k", ".claim-jk", ".claim-sub", ".claim-hot", ".lbl", ".legend", ".hatchnote", ".explain-jk", ".explain-sub", ".card", ".pill span", ".bname", ".bval", ".tile", ".srccredit", ".brand", ".mapcredit", ".cap"];
const probeJS = `
(function(){
 var out = { times: {}, fills: {}, sizes: {} };
 var tl = window.__timelines["main"];
 var times = ${JSON.stringify(sorted)};
 var hiddenAncestor = function(e){ var a = e; while (a && a !== document.body) { var c = getComputedStyle(a); if (c.visibility === "hidden" || parseFloat(c.opacity) < 0.01) return true; a = a.parentElement; } return false; };
 var citeAncestor = function(e){ var a = e; while (a && a !== document.body) { if (a.classList && a.classList.contains("cite")) return true; a = a.parentElement; } return false; };
 try {
 times.forEach(function(t){
   tl.seek(t, false);
   var rows = [], digits = [];
   ${JSON.stringify(TEXT_SEL)}.forEach(function(sel){ document.querySelectorAll(sel).forEach(function(e){
     if (hiddenAncestor(e)) return; var r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
     var lines = 0; if (e.classList.contains("cap")) { var tops = {}; e.querySelectorAll(".w").forEach(function(w){ tops[Math.round(w.getBoundingClientRect().top)] = 1; }); lines = Object.keys(tops).length; }
     rows.push({ sel: sel, id: e.id || "", x: r.left, y: r.top, r: r.right, b: r.bottom, txt: (e.textContent || "").slice(0, 40), lines: lines, cite: citeAncestor(e) }); }); });
   document.querySelectorAll("#root *").forEach(function(e){
     var s = ""; e.childNodes.forEach(function(n){ if (n.nodeType === 3) s += n.textContent; });
     if (!/\\d/.test(s) || hiddenAncestor(e)) return;
     digits.push({ id: e.id || "", txt: s.trim(), cite: citeAncestor(e) }); });
   out.times[t] = { rows: rows, digits: digits };
 });
 var st = function(id){ var e = document.getElementById(id); return e ? getComputedStyle(e).fill : null; };
 var land = "rgb(51, 68, 92)";
 var paths = document.querySelectorAll("#B4-map path");
 var notLit = 0; paths.forEach(function(p){ if (getComputedStyle(p).fill === land) notLit++; });
 out.fills.b4_unpainted_at_end = notLit; out.fills.b4_paths = paths.length;
 out.fills.hatch_def = !!document.getElementById("B4-map-hatch");
 out.fills.hatch_fill = getComputedStyle(document.getElementById("B4-map-id-pa")).fill;
 out.fills.aceh_lit = null; out.fills.jabar_lit = null; out.fills.jakarta_lit = null;
 tl.seek(${tl.cues.aceh} + 0.3, false); out.fills.aceh_lit = st("B5-map-id-ac");
 tl.seek(${tl.cues.jak_ump} + 0.05, false); out.fills.jakarta_lit = st("B2-map-id-jk");
 tl.seek(${tl.cues.terendah} + 0.1, false); out.fills.jabar_lit = st("B6-map-id-jb");
 tl.seek(${tl.cues.jak_ump} + 0.05, false); out.sizes.b5_frame_w = document.getElementById("B5-map").getBoundingClientRect().width;
 out.sizes.b2_pin_visible = !!(getComputedStyle(document.getElementById("B2-dot")).visibility === "visible");
 document.getElementById("probe").textContent = JSON.stringify(out);
 } catch (e) { document.getElementById("probe").textContent = "ERR " + e.message + " " + (e.stack || ""); }
})();`;
const probeHTML = html.replace("</body>", `<pre id="probe">pending</pre><script>${probeJS}</script></body>`);
const probeDir = P("build/v2/probe"); mkdirSync(probeDir, { recursive: true });
// the probe page loads vendor/ and assets/ by relative path, so link them next to it
for (const d of ["vendor", "assets"]) { const link = join(probeDir, d); if (!existsSync(link)) symlinkSync(P(d), link); }
const probeFile = join(probeDir, "lint-probe-v2.html");
writeFileSync(probeFile, probeHTML);
const dom = execFileSync(CH, ["--headless", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=120000", "--window-size=1080,1920", "--dump-dom", "file://" + probeFile],
  { encoding: "utf8", maxBuffer: 512 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
const m = /<pre id="probe">([\s\S]*?)<\/pre>/.exec(dom);
const raw = m ? decodeHTML(m[1]) : "";
if (!m || raw.startsWith("ERR") || raw === "pending") { fail("browser probe failed: " + raw.slice(0, 300)); }
else {
  const pr = JSON.parse(raw);
  const S = { left: cfg.safe.left, right: cfg.width - cfg.safe.right, top: cfg.safe.top, bottom: cfg.height - cfg.safe.bottom };
  const band = cfg.hero_band;
  const HERO_SEL = new Set([".headline", ".kicker", ".kicker2", ".big", ".bigmid", ".sub", ".claim-k", ".claim-jk", ".claim-sub", ".claim-hot", ".lbl", ".legend", ".hatchnote", ".explain-jk", ".explain-sub", ".card", ".pill span", ".bname", ".bval", ".tile"]);
  const seen = new Set(); let rowsChecked = 0, digitsChecked = 0;
  for (const [t, { rows, digits }] of Object.entries(pr.times)) {
    const tt = Number(t);
    for (const r of rows) {
      rowsChecked++;
      const key = r.sel + "|" + r.txt;
      if (!r.cite && (r.x < S.left - 0.5 || r.r > S.right + 0.5 || r.y < S.top - 0.5 || r.b > S.bottom + 0.5)) {
        if (!seen.has(key)) { seen.add(key); fail(`outside safe box at t=${tt}: ${r.sel} "${r.txt}" x ${r.x.toFixed(0)}..${r.r.toFixed(0)} y ${r.y.toFixed(0)}..${r.b.toFixed(0)}`); }
      }
      if (HERO_SEL.has(r.sel) && (r.y < band.top - 2 || r.b > band.bottom + 2)) {
        if (!seen.has("band" + key)) { seen.add("band" + key); fail(`hero text outside band ${band.top}..${band.bottom} at t=${tt}: "${r.txt}" y ${r.y.toFixed(0)}..${r.b.toFixed(0)}`); }
      }
      if (r.sel === ".cap" && r.lines > 2) fail(`caption at t=${tt} has ${r.lines} lines: "${r.txt}"`);
    }
    for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      if (a.sel === b.sel && a.id === b.id) continue;
      const ix = Math.min(a.r, b.r) - Math.max(a.x, b.x), iy = Math.min(a.b, b.b) - Math.max(a.y, b.y);
      if (ix > 4 && iy > 4) { const k = [a.sel + ":" + a.txt, b.sel + ":" + b.txt].sort().join(" <> "); if (!seen.has(k)) { seen.add(k); fail(`overlap at t=${tt}: "${a.txt}" (${a.sel}) and "${b.txt}" (${b.sel})`); } }
    }
    // every visible digit must be a registered number that is already spoken (cite texts are exempt)
    for (const d of digits) {
      if (d.cite) continue;
      digitsChecked++;
      const toks = d.txt.match(/\d+(?:,\d+)?/g) || [];
      for (const tok of toks) {
        if (tok === "0" || tok.startsWith("0,")) fail(`zero value shown at t=${tt}: "${d.txt}"`);
        const rr = reg[tok];
        if (!rr) { fail(`unregistered number "${tok}" visible at t=${tt} in "${d.txt}"`); continue; }
        if (rr.t > tt + 0.05) fail(`number "${tok}" visible at t=${tt} before its cue ${rr.t}`);
      }
    }
  }
  // hook: the claim is on screen in frame 0 and sits in the hero band
  const f0 = pr.times["0"] ? pr.times["0"].rows : [];
  for (const need of [".claim-jk", ".claim-hot"]) if (!f0.some((r) => r.sel === need)) fail(`hook ${need} not visible at t=0`);
  for (const r of f0.filter((x) => x.sel.startsWith(".claim"))) if (r.y < band.top || r.b > band.bottom) fail(`hook line "${r.txt}" outside band`);
  // map states at the name cues
  const f = pr.fills;
  if (f.b4_unpainted_at_end !== 0) fail(`national map: ${f.b4_unpainted_at_end} of ${f.b4_paths} provinces still land-coloured at the end of the sweep`);
  if (!String(f.hatch_fill).includes("url(")) fail(`Papua hatch not applied (fill ${f.hatch_fill})`);
  if (!f.hatch_def) fail("hatch pattern missing");
  const LIT = "rgb(255, 210, 63)";
  if (f.aceh_lit !== LIT) fail(`Aceh not lit at its cue (fill ${f.aceh_lit})`);
  if (f.jakarta_lit !== LIT) fail(`DKI Jakarta not lit at its cue (fill ${f.jakarta_lit})`);
  if (f.jabar_lit !== LIT) fail(`Jawa Barat not lit at its cue (fill ${f.jabar_lit})`);
  if (pr.sizes.b5_frame_w < 600) fail(`Aceh locator frame ${pr.sizes.b5_frame_w}px < 600`);
  notes.push(`probe: ${sorted.length} sample times, ${rowsChecked} text boxes, ${digitsChecked} visible digit runs checked (every digit registered and spoken before it appears)`);
  notes.push(`map: Aceh/DKI Jakarta/Jawa Barat lit at their cues; national sweep complete (${f.b4_paths} paths); Aceh locator frame ${pr.sizes.b5_frame_w}px wide`);
}

for (const n of notes) console.log("ok  " + n);
if (failures.length) {
  console.log(`FAIL ${failures.length} problem(s):`);
  for (const f of failures) console.log("  - " + f);
  process.exit(1);
}
console.log("lint v2: all checks passed");
