// Lint for video-01 v3. Exits non-zero on any failure. Run after `node tools/build_v3.mjs`.
// Static: cues resolve inside their scene; spoken numbers match data and land at their cue; no digits in vo_text;
// dead air; framing alternation vs beats_v3.md; length gates (hook, Jawa Barat section, close, total); brand; no DRAFT;
// one source line only, on the final card; no per-frame map or source credit.
// Browser probe (headless Chrome): safe box, overlaps, text blocks per frame (max 3, brand excluded), caption lines and
// chunk length, hero centre, hero band, every visible digit is a registered number already spoken, map states, pins
// inside their province fill, bar track size, sources size and line count.
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
const cfg = JSON.parse(readFileSync(P("video.v3.config.json"), "utf8"));
const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
const data = parseCsv(readFileSync(P(cfg.inputs.data), "utf8"));
const umkRows = parseCsv(readFileSync(P(cfg.inputs.umk), "utf8"));
const words = JSON.parse(readFileSync(join(P(cfg.voice.dir), cfg.voice.variant, "words.json"), "utf8"));
const tl = JSON.parse(readFileSync(P("build/v3/timeline.json"), "utf8"));
const html = readFileSync(P("index_v3.html"), "utf8");
const { cueSpan } = makeCue(words);
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

// ---------- 1. script and cues ----------
const counts = script.scenes.map((s) => s.vo_text.split(/\s+/).filter(Boolean).length);
const ranges = {}; { let a = 0; script.scenes.forEach((s, i) => { ranges[s.id] = [a, a + counts[i]]; a += counts[i]; }); }
const total = counts.reduce((a, b) => a + b, 0);
if (total !== words.length) fail(`word count ${words.length} != script ${total}`);
if (total < script.word_count_target[0] || total > script.word_count_target[1]) fail(`script ${total} words, target ${script.word_count_target.join("-")}`);
const allVo = script.scenes.map((s) => s.vo_text).join(" ");
if (/\d/.test(allVo)) fail("digits in vo_text");
if (/melanggar/i.test(allVo)) fail('"melanggar" in vo_text');
for (const s of script.scenes) {
  const [a, b] = ranges[s.id];
  for (const cw of s.cue_words) {
    let span;
    try { span = cueSpan(cw, words[a].start - 1e-6); } catch (e) { fail(`${s.id}: cue "${cw}" does not resolve`); continue; }
    if (span.time < words[a].start - 1e-6 || span.time > words[b - 1].end + 1e-6) fail(`${s.id}: cue "${cw}" at ${span.time}s is outside its scene`);
  }
}
notes.push(`script: ${total} words, ${words.length} timed words (voice ${cfg.voice.variant}), no digits in vo_text`);

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
const reg = {};
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

// ---------- 3. timing and length gates ----------
const lastWord = words[words.length - 1].end;
if (Math.abs(tl.total - (lastWord + cfg.tail_s)) > 0.01) fail(`total ${tl.total} != last word ${lastWord} + tail ${cfg.tail_s}`);
if (tl.total > cfg.total_max_s) fail(`total ${tl.total} s > ${cfg.total_max_s}`);
const s1 = script.scenes[0], nS1 = s1.vo_text.split(/\s+/).filter(Boolean).length;
const hookSpan = words[nS1 - 1].end - words[0].start;
if (hookSpan > cfg.hook_max_s + 1e-6) fail(`hook VO ${hookSpan.toFixed(2)} s > ${cfg.hook_max_s}`);
const bBy = Object.fromEntries(tl.beats.map((b) => [b.id, b]));
const jabarSpan = bBy.B7.end - bBy.B6.start;
if (jabarSpan > cfg.jabar_max_s + 1e-6) fail(`Jawa Barat + UMK section ${jabarSpan.toFixed(2)} s > ${cfg.jabar_max_s}`);
const closeSpan = bBy.B9.end - bBy.B8.start;
if (closeSpan > cfg.close_max_s + 1e-6) fail(`close ${closeSpan.toFixed(2)} s > ${cfg.close_max_s}`);
notes.push(`timing: total ${tl.total}s (last word ${lastWord}s + tail ${cfg.tail_s}s, cap ${cfg.total_max_s}); hook VO ${hookSpan.toFixed(2)}s (cap ${cfg.hook_max_s}); Jawa Barat + UMK ${jabarSpan.toFixed(2)}s (cap ${cfg.jabar_max_s}); close ${closeSpan.toFixed(2)}s (cap ${cfg.close_max_s})`);

// ---------- 4. dead air (hero union) and framing ----------
const hero = tl.beats.map((b) => ({ a: b.hero.from, b: b.hero.to })).sort((x, y) => x.a - y.a);
let edge = 0, maxGap = 0;
for (const h of hero) { if (h.a - edge > maxGap) maxGap = h.a - edge; edge = Math.max(edge, h.b); }
maxGap = Math.max(maxGap, tl.total - edge);
if (maxGap > 1.2) fail(`dead air ${maxGap.toFixed(2)} s > 1.2`);
notes.push(`dead air: largest gap ${maxGap.toFixed(3)} s (limit 1.2)`);
const md = existsSync(P("beats_v3.md")) ? readFileSync(P("beats_v3.md"), "utf8").split("\n").filter((l) => /^\| B\d+ \|/.test(l)) : [];
const mdRows = md.map((l) => l.split("|").map((c) => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1));
if (mdRows.length !== tl.beats.length) fail(`beats_v3.md has ${mdRows.length} rows, timeline ${tl.beats.length}`);
tl.beats.forEach((b, i) => { const row = mdRows[i]; if (row && row[0] !== b.id) fail(`row ${i} id ${row[0]} != ${b.id}`); if (row && row[2] !== b.framing) fail(`${b.id}: framing ${b.framing} in build, ${row[2]} in beats_v3.md`); });
for (let i = 1; i < tl.beats.length; i++) if (tl.beats[i].framing === tl.beats[i - 1].framing) fail(`consecutive beats ${tl.beats[i - 1].id} and ${tl.beats[i].id} both ${tl.beats[i].framing}`);
notes.push(`framing: ${tl.beats.map((b) => b.framing).join(" > ")}`);

// ---------- 5. static HTML gates ----------
if (!html.includes(cfg.brand)) fail("brand missing from index_v3.html");
if (/DRAFT/i.test(html)) fail("DRAFT text still in the page");
if (/Sakernas/i.test(html)) fail('"Sakernas" is in the page: the CSV does not name the survey (research/findings.md)');
const credits = (html.match(/Peta: MapSVG/g) || []).length;
if (credits !== 1) fail(`map credit appears ${credits} times; it must appear once, on the final card`);
const srcCount = (html.match(/Sumber: BPS/g) || []).length;
if (srcCount !== 1) fail(`source line appears ${srcCount} times; it must appear once, on the final card`);
if (/id="(srccredit|mapcredit)"/.test(html)) fail("per-frame source or map credit element still in the page");
if (/Rp0(?!\d)/.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) fail("a literal Rp0 is in the page markup");
notes.push("static: brand present, no DRAFT, no Sakernas, one source line (final card), no per-frame source or map credit, no literal Rp0");

// ---------- 6. browser probe ----------
const CH = (() => {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const stack = ["/root/.cache/hyperframes/chrome"]; while (stack.length) { const d = stack.pop(); for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) stack.push(p); else if (n === "chrome-headless-shell") return p; } }
  throw new Error("chrome-headless-shell not found");
})();
const times = new Set();
for (let t = 0; t < tl.total; t += 0.5) times.add(+t.toFixed(3));
for (const b of tl.beats) { times.add(+(b.start + 0.05).toFixed(3)); times.add(+(b.end - 0.05).toFixed(3)); times.add(+((b.start + b.end) / 2).toFixed(3)); }
for (const v of Object.values(tl.cues)) { times.add(+(v + 0.05).toFixed(3)); times.add(+(v - 0.02).toFixed(3)); times.add(+(v + 0.35).toFixed(3)); }
times.add(+(tl.total - 0.01).toFixed(3));
const sorted = [...times].sort((a, b) => a - b);
const midTimes = tl.beats.map((b) => +((b.start + b.end) / 2).toFixed(3));
const probeJS = `
(function(){
 var out = { times: {}, fills: {}, sizes: {}, pins: {} };
 var tl = window.__timelines["main"];
 var times = ${JSON.stringify(sorted)};
 var hiddenAncestor = function(e){ var a = e; while (a && a !== document.body) { var c = getComputedStyle(a); if (c.visibility === "hidden" || parseFloat(c.opacity) < 0.01) return true; a = a.parentElement; } return false; };
 var citeAncestor = function(e){ var a = e; while (a && a !== document.body) { if (a.classList && a.classList.contains("cite")) return true; a = a.parentElement; } return false; };
 try {
 times.forEach(function(t){
   tl.seek(t, false);
   var tb = [], hero = [], digits = [];
   document.querySelectorAll("[data-tb]").forEach(function(e){
     if (hiddenAncestor(e)) return; var r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
     var isCap = e.classList.contains("cap"); var lines = 0, nwords = 0;
     if (isCap) { var tops = {}; e.querySelectorAll(".w").forEach(function(w){ tops[Math.round(w.getBoundingClientRect().top)] = 1; nwords++; }); lines = Object.keys(tops).length; }
     var fs = parseFloat(getComputedStyle(e).fontSize);
     tb.push({ id: e.id || "", x: r.left, y: r.top, r: r.right, b: r.bottom, txt: (e.textContent || "").replace(/\\s+/g, " ").slice(0, 60), cap: isCap, cite: citeAncestor(e), lines: lines, nwords: nwords, chars: (e.textContent || "").trim().length, fs: fs });
   });
   document.querySelectorAll("[data-hero]").forEach(function(e){
     if (hiddenAncestor(e)) return; var r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
     hero.push({ id: e.id || "", y: r.top, b: r.bottom });
   });
   document.querySelectorAll("#root *").forEach(function(e){
     var s = ""; e.childNodes.forEach(function(n){ if (n.nodeType === 3) s += n.textContent; });
     if (!/\\d/.test(s) || hiddenAncestor(e)) return;
     digits.push({ id: e.id || "", txt: s.trim(), cite: citeAncestor(e) }); });
   out.times[t] = { tb: tb, hero: hero, digits: digits };
 });
 var st = function(id){ var e = document.getElementById(id); return e ? getComputedStyle(e).fill : null; };
 var land = "rgb(51, 68, 92)";
 var paths = document.querySelectorAll("#B4-map path.prov");
 var notLit = 0; paths.forEach(function(p){ if (getComputedStyle(p).fill === land) notLit++; });
 out.fills.b4_unpainted_at_end = notLit; out.fills.b4_paths = paths.length;
 out.fills.hatch_def = !!document.getElementById("B4-map-hatch");
 out.fills.hatch_fill = st("B4-map-id-pa");
 tl.seek(${tl.cues.aceh} + 0.3, false); out.fills.aceh_lit = st("B5-map-${tl.sids.aceh}");
 tl.seek(${tl.cues.jak_ump} + 0.05, false); out.fills.jakarta_lit = st("B2-map-${tl.sids.jakarta}");
 tl.seek(${tl.cues.jabar} + 0.1, false); out.fills.jabar_lit = st("B6-map-${tl.sids.jabar}");
 tl.seek(${tl.cues.karawang} + 0.3, false); out.fills.karawang_lit = st("B7-map-${tl.sids.jabar}");
 out.sizes.b5_frame_w = document.getElementById("B5-map").getBoundingClientRect().width;
 out.sizes.b3_track_h = document.getElementById("B3-t1").getBoundingClientRect().height;
 out.sizes.b5_track_h = document.getElementById("B5-t1").getBoundingClientRect().height;
 tl.seek(${tl.cues.karawang} + 0.3, false);
 var pinIn = function(pathId, p){ var e = document.getElementById(pathId); if (!e) return "missing"; return e.isPointInFill(new DOMPoint(p.x, p.y)); };
 out.pins.jakarta = pinIn("B2-map-${tl.sids.jakarta}", ${JSON.stringify(tl.pins.jakarta)});
 out.pins.aceh = pinIn("B5-map-${tl.sids.aceh}", ${JSON.stringify(tl.pins.aceh)});
 out.pins.karawang = pinIn("B7-map-${tl.sids.jabar}", ${JSON.stringify(tl.pins.karawang)});
 document.getElementById("probe").textContent = JSON.stringify(out);
 } catch (e) { document.getElementById("probe").textContent = "ERR " + e.message + " " + (e.stack || ""); }
})();`;
const probeHTML = html.replace("</body>", `<pre id="probe">pending</pre><script>${probeJS}</script></body>`);
const probeDir = P("build/v3/probe"); mkdirSync(probeDir, { recursive: true });
for (const d of ["vendor", "assets"]) { const link = join(probeDir, d); if (!existsSync(link)) symlinkSync(P(d), link); }
const probeFile = join(probeDir, "lint-probe-v3.html");
writeFileSync(probeFile, probeHTML);
const dom = execFileSync(CH, ["--headless", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=120000", "--window-size=1080,1920", "--dump-dom", "file://" + probeFile],
  { encoding: "utf8", maxBuffer: 512 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
const pres = [...dom.matchAll(/<pre id="probe">([\s\S]*?)<\/pre>/g)];
const raw = pres.length ? decodeHTML(pres[pres.length - 1][1]) : "";
if (!pres.length || raw.startsWith("ERR") || raw === "pending") { fail("browser probe failed: " + raw.slice(0, 300)); }
else {
  const pr = JSON.parse(raw);
  const S = { left: cfg.safe.left, right: cfg.width - cfg.safe.right, top: cfg.safe.top, bottom: cfg.height - cfg.safe.bottom };
  const band = cfg.hero_band;
  const seen = new Set(); let rowsChecked = 0, digitsChecked = 0, maxBlocks = 0, maxBlocksAt = 0;
  const midSet = new Set(midTimes);
  const sourcesTimes = [];
  const heroCentres = [];
  for (const [t, { tb, hero: heroEls, digits }] of Object.entries(pr.times)) {
    const tt = Number(t);
    // at most three text blocks per frame (captions count; the brand tag is not a text block)
    if (tb.length > maxBlocks) { maxBlocks = tb.length; maxBlocksAt = tt; }
    if (tb.length > 3) fail(`${tb.length} text blocks at t=${tt}: ${tb.map((r) => `"${r.txt.slice(0, 24)}"`).join(", ")} (limit 3)`);
    for (const r of tb) {
      rowsChecked++;
      const key = r.id + "|" + r.txt;
      if (!r.cite && (r.x < S.left - 0.5 || r.r > S.right + 0.5 || r.y < S.top - 0.5 || r.b > S.bottom + 0.5)) {
        if (!seen.has("safe" + key)) { seen.add("safe" + key); fail(`outside safe box at t=${tt}: ${r.id} "${r.txt}" x ${r.x.toFixed(0)}..${r.r.toFixed(0)} y ${r.y.toFixed(0)}..${r.b.toFixed(0)}`); }
      }
      if (!r.cap && (r.y < band.top - 2 || r.b > band.bottom + 2)) {
        if (!seen.has("band" + key)) { seen.add("band" + key); fail(`text block outside hero band ${band.top}..${band.bottom} at t=${tt}: ${r.id} "${r.txt}" y ${r.y.toFixed(0)}..${r.b.toFixed(0)}`); }
      }
      if (r.cap && r.lines > 2) fail(`caption at t=${tt} has ${r.lines} lines: "${r.txt}"`);
      if (r.cap && r.nwords > 5) fail(`caption chunk at t=${tt} has ${r.nwords} words (limit 5): "${r.txt}"`);
      if (r.cite) sourcesTimes.push({ t: tt, fs: r.fs, lines: Math.round((r.b - r.y) / (r.fs * 1.3)) });
    }
    for (let i = 0; i < tb.length; i++) for (let j = i + 1; j < tb.length; j++) {
      const a = tb[i], b = tb[j];
      const ix = Math.min(a.r, b.r) - Math.max(a.x, b.x), iy = Math.min(a.b, b.b) - Math.max(a.y, b.y);
      if (ix > 4 && iy > 4) { const k = [a.id + ":" + a.txt, b.id + ":" + b.txt].sort().join(" <> "); if (!seen.has(k)) { seen.add(k); fail(`overlap at t=${tt}: "${a.txt}" and "${b.txt}"`); } }
    }
    // hero centre at each beat midpoint: the union of text blocks (not captions) and hero frames
    if (midSet.has(tt)) {
      const boxes = [...tb.filter((r) => !r.cap), ...heroEls];
      if (boxes.length) {
        const top = Math.min(...boxes.map((r) => r.y)), bot = Math.max(...boxes.map((r) => r.b));
        const centre = (top + bot) / 2;
        if (centre < 780 || centre > 940) fail(`hero centre ${centre.toFixed(0)} at beat midpoint t=${tt} (want 780..940; safe-box middle is 860)`);
        heroCentres.push(`${tt}:${centre.toFixed(0)}`);
      }
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
  // the hook: frame 1 shows the claim headline; frame 2 shows the full claim after 'Tapi'
  const f0 = pr.times["0"] ? pr.times["0"].tb.map((r) => r.txt).join(" ") : "";
  if (!/UMP/.test(f0) || !/TERTINGGI/.test(f0)) fail(`hook frame 1 should show "UMP TERTINGGI" (got "${f0.slice(0, 60)}")`);
  const tapiT = Object.keys(pr.times).map(Number).find((t) => t >= tl.cues.tapi + 0.05) ?? null;
  if (tapiT !== null) { const f2 = pr.times[String(tapiT)].tb.map((r) => r.txt).join(" "); if (!/RATA-RATANYA/.test(f2)) fail(`hook frame 2 should show the claim after "Tapi" (got "${f2.slice(0, 60)}")`); }
  // sources: on the final card only, 30 px or more, two lines at most
  const srcFirst = sourcesTimes.length ? Math.min(...sourcesTimes.map((x) => x.t)) : null;
  if (srcFirst !== null && srcFirst < tl.cues.sumber - 0.01) fail(`sources visible at t=${srcFirst} before the final card (${tl.cues.sumber})`);
  for (const s of sourcesTimes) {
    if (s.fs < 30) fail(`sources font ${s.fs}px < 30px`);
    if (s.lines > 2) fail(`sources wrap to ${s.lines} lines at t=${s.t} (limit 2)`);
  }
  // map states at the name cues
  const f = pr.fills;
  if (f.b4_unpainted_at_end !== 0) fail(`national map: ${f.b4_unpainted_at_end} of ${f.b4_paths} provinces still land-coloured at the end of the sweep`);
  if (!String(f.hatch_fill).includes("url(")) fail(`Papua hatch not applied (fill ${f.hatch_fill})`);
  if (!f.hatch_def) fail("hatch pattern missing");
  const LIT = "rgb(255, 210, 63)";
  if (f.aceh_lit !== LIT) fail(`Aceh not lit at its cue (fill ${f.aceh_lit})`);
  if (f.jakarta_lit !== LIT) fail(`DKI Jakarta not lit at its cue (fill ${f.jakarta_lit})`);
  if (f.jabar_lit !== LIT) fail(`Jawa Barat not lit at its cue (fill ${f.jabar_lit})`);
  if (f.karawang_lit !== LIT) fail(`Jawa Barat (Karawang section) not lit (fill ${f.karawang_lit})`);
  // pins: each sits inside its province's own fill (the path's bounding box is not enough: islands widen it)
  if (pr.pins.jakarta !== true) fail(`Jakarta pin is not on the DKI Jakarta mainland fill (${pr.pins.jakarta})`);
  if (pr.pins.aceh !== true) fail(`Aceh pin is not on the Aceh fill (${pr.pins.aceh})`);
  if (pr.pins.karawang !== true) fail(`Karawang pin is not inside the Jawa Barat fill (${pr.pins.karawang})`);
  // bars are bigger than v2 (v2 compact track 56 px): Jakarta 130 px or more, Aceh 70 px or more
  if (pr.sizes.b3_track_h < 130) fail(`Jakarta bar track ${pr.sizes.b3_track_h}px < 130`);
  if (pr.sizes.b5_track_h < 70) fail(`Aceh bar track ${pr.sizes.b5_track_h}px < 70`);
  if (pr.sizes.b5_frame_w < 600) fail(`Aceh locator frame ${pr.sizes.b5_frame_w}px < 600`);
  notes.push(`probe: ${sorted.length} sample times, ${rowsChecked} text-block samples, ${digitsChecked} visible digit runs checked (every digit registered and spoken before it appears)`);
  notes.push(`text blocks: max ${maxBlocks} visible per frame (at t=${maxBlocksAt}); limit 3 (brand tag excluded)`);
  notes.push(`map: DKI Jakarta, Aceh, Jawa Barat (and Karawang section) lit at their cues; national sweep complete (${f.b4_paths} paths); Papua hatch applied; pins on their fills (Jakarta, Aceh, Karawang)`);
  notes.push(`hero centre at each beat midpoint (y, want 780..940): ${heroCentres.join(" ")}`);
  notes.push(`sizes: Jakarta bar track ${pr.sizes.b3_track_h}px, Aceh bar track ${pr.sizes.b5_track_h}px, Aceh locator ${pr.sizes.b5_frame_w}px, sources ${sourcesTimes.length ? sourcesTimes[0].fs + "px" : "n/a"}`);
}

for (const n of notes) if (typeof n === "string") console.log("ok  " + n);
if (failures.length) {
  console.log(`FAIL ${failures.length} problem(s):`);
  for (const f of failures) console.log("  - " + f);
  process.exit(1);
}
console.log("lint v3: all checks passed");
