// Builds index.html and build/timeline.json from research/script.json, research/data.csv and assets/words.json.
// Every time in the video is a word cue (cue(word, after)); every number is derived from data.csv.
// Run: node tools/build.mjs   (npm run build)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { makeCue } from "./lib/cue.mjs";
import { fmtShort, spokenShort, spokenInt } from "./lib/nums.mjs";
import { parseCsv } from "./lib/csv.mjs";
import { getGeometry } from "./geometry.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (rel) => resolve(ROOT, rel);
const cfg = JSON.parse(readFileSync(P("video.config.json"), "utf8"));
const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
const dataRows = parseCsv(readFileSync(P(cfg.inputs.data), "utf8"));
const words = JSON.parse(readFileSync(P(cfg.inputs.words), "utf8"));
const sentences = JSON.parse(readFileSync(P(cfg.inputs.sentences), "utf8"));
const svgRaw = readFileSync(P(cfg.inputs.map), "utf8").replace(/<\?xml[^>]*>\s*/, "");
const { cue, cueSpan } = makeCue(words);
const fail = (m) => { throw new Error("build: " + m); };

// ---------- inputs and data checks ----------
const scenes = script.scenes;
const S = Object.fromEntries(scenes.map((s) => [s.id, s]));
const wordCounts = scenes.map((s) => s.vo_text.split(/\s+/).filter(Boolean).length);
if (wordCounts.reduce((a, b) => a + b, 0) !== words.length) fail(`word count ${words.length} != script ${wordCounts.reduce((a, b) => a + b, 0)}`);

const prov = {};
for (const r of dataRows) {
  prov[r.province] = {
    name: r.province,
    ump: Number(r.ump_2026),
    avg: r.avg_wage === "" ? null : Number(r.avg_wage),
  };
}
// Map shapes (34). Post-2022 Papua provinces have no shape; they are not referenced here.
const shapes = [...svgRaw.matchAll(/<path id="([^"]+)" data-name="([^"]+)"[^>]*?\sd="([^"]+)"/g)]
  .map((m) => ({ id: m[1], name: m[2], d: m[3] }));
const idByName = Object.fromEntries(shapes.map((s) => [s.name, s.id]));
const dataNoShape = Object.keys(prov).filter((n) => !idByName[n]);

// ---------- data-derived claims (checked against the script's wording) ----------
const withUmp = Object.values(prov);
const hi = withUmp.reduce((a, b) => (b.ump > a.ump ? b : a));
const lo = withUmp.reduce((a, b) => (b.ump < a.ump ? b : a));
if (hi.name !== "DKI Jakarta" || !/tertinggi ada di Jakarta/.test(S.s2_jakarta.vo_text)) fail(`highest UMP is ${hi.name}, script says Jakarta`);
if (lo.name !== "Jawa Barat" || !/Terendah di Jawa Barat/.test(S.s2_jakarta.vo_text)) fail(`lowest UMP is ${lo.name}, script says Jawa Barat`);
const known = withUmp.filter((p) => p.avg !== null).sort((a, b) => a.avg - b.avg);
const bottom10 = known.slice(0, 10);
const below = bottom10.filter((p) => p.avg < p.ump);
const above = bottom10.filter((p) => p.avg >= p.ump);
if (bottom10.length !== 10) fail("fewer than 10 provinces with avg wage");
if (below.length !== 7 || above.length !== 3) fail(`below/above split ${below.length}/${above.length}, script says 7 of 10`);
for (const n of ["Lampung", "Sumatera Utara"]) if (!below.some((p) => p.name === n)) fail(`${n} expected below UMP`);
const aceh = prov["Aceh"];
const gapJt = Math.round((aceh.ump - aceh.avg) / 1e6);
if (gapJt !== 1 || !/satu juta/.test(S.s3_aceh.vo_text)) fail(`Aceh gap rounds to ${gapJt} jt; script says satu juta`);
const onScreenChecks = [
  [S.s2_jakarta, fmtShort(prov["DKI Jakarta"].ump)], [S.s2_jakarta, fmtShort(prov["Jawa Barat"].ump)],
  [S.s3_aceh, fmtShort(aceh.ump)], [S.s3_aceh, fmtShort(aceh.avg)],
];
for (const [sc, txt] of onScreenChecks) if (!sc.on_screen_text.includes(txt)) fail(`on_screen_text of ${sc.id} lacks ${txt}`);

// ---------- scene timing from cues (each scene starts at its first word) ----------
const sceneFirst = ["UMP", "Tahun", "Tapi", "Dari", "Rata-rata"];
const wordStartIdx = [];
{ let acc = 0; for (const c of wordCounts) { wordStartIdx.push(acc); acc += c; } }
// The search for scene i starts after the last word of scene i-1, so repeated words earlier in the script are skipped.
const sceneStart = scenes.map((s, i) => {
  const after = i === 0 ? -1 : words[wordStartIdx[i - 1] + wordCounts[i - 1] - 1].end;
  return cue(sceneFirst[i], after);
});
sceneStart.forEach((t, i) => { if (Math.abs(t - words[wordStartIdx[i]].start) > 1e-9) fail(`scene ${i} cue != first word`); });
const lastWordEnd = words[words.length - 1].end;
const TOTAL = Math.round((lastWordEnd + cfg.tail_s) * 1000) / 1000;
// Length of the voiceover file as written by tts.py (the audio slot must match it, not the video length).
const VO_SECONDS = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", P("assets/vo.mp3")], { encoding: "utf8" }).trim());

// Cue chain for every beat. Each call names the phrase from script.json cue_words where one exists.
const T = {};
const C = (name, word, after) => { const span = cueSpan(word, after); T[name] = span.time; return span; };
T.b1 = sceneStart[0];
T.b2 = sceneStart[1];
C("year", spokenInt("2026"), T.b2);
C("tertinggi", "tertinggi", T.b2);
C("jakarta", "Jakarta", T.b2);
const numJakarta = C("num_jakarta", "lima koma tujuh tiga juta", T.jakarta);
T.b3 = numJakarta.time;
T.b4 = C("jawa_barat", "Jawa Barat", T.b3).time;
const numJabar = C("num_jabar", "dua koma tiga dua juta", T.b4);
T.b5 = sceneStart[2];
C("aceh", "Aceh", T.b5);
C("bar_ump", "tiga koma sembilan tiga juta", T.aceh);
C("bar_avg", "dua koma delapan empat juta", T.bar_ump);
T.b6 = sceneStart[3];
C("sepuluh", "sepuluh provinsi", T.b6);
C("tujuh", "tujuh provinsi", T.b6);
C("di_bawah", "di bawah UMP", T.tujuh);
C("lampung", "Lampung", T.tujuh);
C("sumut", "Sumatera Utara", T.lampung);
T.b7 = sceneStart[4];
C("follow", "Follow", T.b7);
T.end = TOTAL;
// Beat ends
const beatEnd = { b1: T.b2, b2: T.num_jakarta ?? T.b3, b3: T.b4, b4: T.b5, b5: T.b6, b6: T.b7, b7: TOTAL };
beatEnd.b2 = T.b3;
for (const k of Object.keys(T)) if (!Number.isFinite(T[k])) fail(`cue ${k} unresolved`);

// ---------- geometry ----------
const geo = getGeometry(P(cfg.inputs.map), P("build"));
const VB = { x: geo.viewBox[0], y: geo.viewBox[1], w: geo.viewBox[2], h: geo.viewBox[3] };
const FRAME = { left: 40, top: 520, w: 1000, h: 560 };
const sUnit = FRAME.w / VB.w; // px per map unit (full-width frame)
const frameVB = (fr) => ({ x: VB.x, w: VB.w, h: fr.h / sUnit, y: VB.y + VB.h / 2 - (fr.h / sUnit) / 2 });
const FULLVB = frameVB(FRAME);
const centreUnits = { x: VB.x + VB.w / 2, y: VB.y + VB.h / 2 };
const bboxCentre = (id) => { const g = geo.provs[id]; return { x: g.x + g.w / 2, y: g.y + g.h / 2 }; };
const pxIn = (vb, fr, ux, uy) => ({ x: (ux - vb.x) * (fr.w / vb.w), y: (uy - vb.y) * (fr.h / vb.h) });
const pagePx = (vb, fr, ux, uy) => { const p = pxIn(vb, fr, ux, uy); return { x: fr.left + p.x, y: fr.top + p.y }; };
// Zoom in frame pixels: scale k about the frame origin, then translate so the province centre lands on the frame centre.
const JABAR_ZOOM = (() => {
  const g = geo.provs["id-jb"]; const k = 0.6 * VB.w / g.w;
  const c = pxIn(FULLVB, FRAME, ...Object.values(bboxCentre("id-jb")));
  return { k, tx: FRAME.w / 2 - k * c.x, ty: FRAME.h / 2 - k * c.y };
})();

// ---------- output containers ----------
const ops = [];
const numbers = [];
const beatsOut = [];
const op = (t, sel, kind, extra = {}) => ops.push({ t: Math.round(t * 1000) / 1000, sel, kind, ...extra });
const fadeIn = (t, sel, d = 0.12) => op(t, sel, "fromTo", { from: { autoAlpha: 0 }, vars: { autoAlpha: 1 }, d });
const beatVis = (id, start, end) => { op(start, `#${id}`, "set", { vars: { autoAlpha: 1 } }); op(end, `#${id}`, "set", { vars: { autoAlpha: 0 } }); };
const num = (text, spoken, t, scene, source, extra = {}) => numbers.push({ text, spoken, t, scene, ...source, ...extra });
// Count-up as text steps: value eases out (power2.out) from 0 to `value` over `d` seconds, one text set per frame.
const fmtShortPage = (v) => fmtShort(v);
function countText(t0, sel, value, d) {
  const steps = Math.max(1, Math.round(d * cfg.fps));
  for (let k = 0; k <= steps; k++) {
    const p = k / steps, e = 1 - (1 - p) * (1 - p);
    op(t0 + (k / cfg.fps), sel, "text", { text: fmtShortPage(Math.round(value * e)) });
  }
}

// Map frame markup. focus: ids lit; dim: others dimmed; halo: pulse rings on focus ids.
function mapFrame(id, fr, vb, { focus = [], dimOthers = false, halo = false, cls = "" } = {}) {
  const paths = shapes.map((s) => {
    const isFocus = focus.includes(s.id);
    const c = ["prov"];
    if (dimOthers && !isFocus) c.push("dim");
    return `<path id="${id}-${s.id}" class="${c.join(" ")}" d="${s.d}"/>`;
  }).join("\n");
  const rings = halo ? focus.map((fid) => {
    const s = shapes.find((x) => x.id === fid);
    return `<path id="${id}-halo-${fid}" class="halo" d="${s.d}"/>`;
  }).join("\n") : "";
  return `<div class="map-frame ${cls}" id="${id}" style="left:${fr.left}px;top:${fr.top}px;width:${fr.w}px;height:${fr.h}px">
<div class="zoom" id="${id}-g" style="position:absolute;left:0;top:0;width:${fr.w}px;height:${fr.h}px"><svg viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid meet"><g>
${paths}
${rings}
</g></svg></div></div>`;
}
const pid = (id, name) => `${id}`;

// Label HTML at a page position; anchor "c" centres on the point, "l" puts the box to the left of it.
function label(id, x, y, name, value, anchor = "c") {
  const tx = anchor === "l" ? "translate(-100%,-50%)" : anchor === "r" ? "translate(0,-50%)" : "translate(-50%,-50%)";
  const v = value ? `<div class="lv">${value}</div>` : "";
  return `<div class="lbl" id="${id}" style="left:${x}px;top:${y}px;transform:${tx}"><div class="ln">${name}</div>${v}</div>`;
}
function dot(id, x, y) { return `<div class="dot" id="${id}" style="left:${x}px;top:${y}px"></div>`; }

// ---------- beats ----------
const beats = [];
// B1 hook: title, dim map backdrop
{
  const id = "B1";
  const title = `<div class="hook"><div class="hook-a" id="B1-a">UMP</div><div class="hook-b" id="B1-b">vs gaji asli</div></div>`;
  beats.push({ id, framing: "title", start: 0, end: beatEnd.b1, html: `
<section class="clip beat" id="${id}" data-start="0" data-duration="${beatEnd.b1}" data-track-index="1">
  <div class="backdrop">${mapFrame("B1-map", { left: 40, top: 960, w: 1000, h: 363 }, { x: VB.x, y: VB.y, w: VB.w, h: VB.h })}</div>
  <div class="hook-wrap" style="top:600px">${title}</div>
</section>`,
    hero: { id: "B1-hook", from: 0, to: beatEnd.b1 } });
  op(T.b1, "#B1-a", "fromTo", { from: { autoAlpha: 0.4, y: 40 }, vars: { autoAlpha: 1, y: 0 }, d: 0.35, ease: "back.out(1.6)" });
  op(T.b1 + 0.12, "#B1-b", "fromTo", { from: { autoAlpha: 0.4, y: 40 }, vars: { autoAlpha: 1, y: 0 }, d: 0.35, ease: "back.out(1.6)" });
  op(0, "#B1-map .prov", "set", { vars: { opacity: 0.2 } });
  op(0.6, "#brand", "fromTo", { from: { autoAlpha: 0 }, vars: { autoAlpha: 1 }, d: 0.3 });
  beatVis(id, 0, beatEnd.b1);
}
// B2 jakarta-locate: full-country map, DKI Jakarta lit
{
  const id = "B2"; const j = prov["DKI Jakarta"]; const sid = idByName[j.name];
  const c = pagePx(FULLVB, FRAME, ...Object.values(bboxCentre(sid)));
  const lx = c.x - 6, ly = c.y + 66;
  beats.push({ id, framing: "full-map", start: beatEnd.b1, end: beatEnd.b2, html: `
<section class="clip beat" id="${id}" data-start="${beatEnd.b1}" data-duration="${beatEnd.b2 - beatEnd.b1}" data-track-index="1">
  <div class="headline" style="top:330px">UMP <span id="B2-year" style="visibility:hidden">2026</span> <span id="B2-hi" style="visibility:hidden">tertinggi</span></div>
  ${mapFrame("B2-map", FRAME, FULLVB, { focus: [sid], dimOthers: true, halo: true })}
  ${dot("B2-dot", c.x, c.y)}
  ${label("B2-lbl", lx, ly, "DKI Jakarta", null, "r")}
</section>`, hero: { id: "B2-map", from: beatEnd.b1, to: beatEnd.b2 } });
  op(T.jakarta, `#B2-map #B2-map-${sid}`, "set", { vars: { opacity: 1, filter: "drop-shadow(0 0 10px rgba(255,210,63,0.9))" } });
  op(T.jakarta, `#B2-map #B2-map-${sid}`, "set", { vars: { opacity: 1 } });
  op(T.jakarta, `#B2-map-halo-${sid}`, "fromTo", { from: { opacity: 0.2 }, vars: { opacity: 0.9, yoyo: true, repeat: 3 }, d: 0.4 });
  fadeIn(T.jakarta, "#B2-dot"); fadeIn(T.jakarta, "#B2-lbl");
  fadeIn(T.year, "#B2-year", 0.1); fadeIn(T.tertinggi, "#B2-hi", 0.1);
  beatVis(id, beatEnd.b1, beatEnd.b2);
}
// B3 jakarta-number: big number count-up and slam, lands on the spoken number
{
  const id = "B3"; const j = prov["DKI Jakarta"];
  const txt = fmtShort(j.ump); const spoken = spokenShort(txt);
  if (spoken !== S.s2_jakarta.cue_words[1]) fail(`B3 spoken phrase ${spoken}`);
  beats.push({ id, framing: "big-number", start: beatEnd.b2, end: beatEnd.b3, html: `
<section class="clip beat" id="${id}" data-start="${beatEnd.b2}" data-duration="${beatEnd.b3 - beatEnd.b2}" data-track-index="1">
  <div class="kicker" style="top:420px">UMP</div>
  <div class="kicker2" id="B3-k2" style="top:480px">DKI Jakarta</div>
  <div class="big" id="B3-num" style="top:560px">Rp0,00 jt</div>
  <div class="sub" id="B3-sub" style="top:820px">per bulan</div>
</section>`, hero: { id: "B3-num", from: beatEnd.b2, to: beatEnd.b3 } });
  countText(T.num_jakarta, "#B3-num", j.ump, 0.5);
  op(T.num_jakarta + 0.5, "#B3-num", "fromTo", { from: { scale: 1.08 }, vars: { scale: 1 }, d: 0.25, ease: "back.out(2)" });
  fadeIn(T.num_jakarta, "#B3-sub"); fadeIn(T.num_jakarta, "#B3-k2");
  beatVis(id, beatEnd.b2, beatEnd.b3);
  num(txt, spoken, T.num_jakarta, "s2_jakarta", { derive: `ump:DKI Jakarta` });
  num("2026", spokenInt("2026"), T.year, "s2_jakarta", { derive: "year" });
}
// B4 jabar-zoom: Jawa Barat fills 60% of frame width (zoom ~ K)
{
  const id = "B4"; const j = prov["Jawa Barat"]; const txt = fmtShort(j.ump); const spoken = spokenShort(txt);
  if (spoken !== S.s2_jakarta.cue_words[3]) fail(`B4 spoken phrase ${spoken}`);
  const sid = idByName[j.name];
  const coverage = geo.provs[sid].w * JABAR_ZOOM.k / VB.w;
  if (coverage < 0.6) fail(`Jawa Barat fills ${coverage.toFixed(2)} of width, need >= 0.6`);
  const cEl = { left: FRAME.left + FRAME.w / 2, top: FRAME.top + FRAME.h / 2 };
  beats.push({ id, framing: "zoom-province", start: beatEnd.b3, end: beatEnd.b4, html: `
<section class="clip beat" id="${id}" data-start="${beatEnd.b3}" data-duration="${beatEnd.b4 - beatEnd.b3}" data-track-index="1">
  ${mapFrame("B4-map", FRAME, FULLVB, { focus: [sid], dimOthers: true, cls: "zoomable" })}
  ${label("B4-lbl", cEl.left, cEl.top - 150, "Jawa Barat", txt, "c")}
</section>`, hero: { id: "B4-map", from: beatEnd.b3, to: beatEnd.b4 } });
  op(T.b4, "#B4-map #B4-map-" + sid, "set", { vars: { opacity: 1, filter: "drop-shadow(0 0 10px rgba(255,210,63,0.9))" } });
  op(T.b4, "#B4-map #B4-map-" + sid, "set", { vars: { opacity: 1 } });
  op(T.b4, "#B4-map-g", "set", { vars: { transformOrigin: "0px 0px", scale: 1, x: 0, y: 0 } });
  op(T.b4 + 0.05, "#B4-map-g", "fromTo", { from: { scale: 1, x: 0, y: 0 }, vars: { scale: JABAR_ZOOM.k, x: JABAR_ZOOM.tx, y: JABAR_ZOOM.ty }, d: 1.3, ease: "power3.inOut" });
  fadeIn(numJabar.time, "#B4-lbl", 0.2);
  beatVis(id, beatEnd.b3, beatEnd.b4);
  num(txt, spoken, numJabar.time, "s2_jakarta", { derive: "ump:Jawa Barat" });
}
// B5 aceh-bars: UMP vs average wage, locator with Aceh lit
{
  const id = "B5"; const ptxt = fmtShort(aceh.ump), atxt = fmtShort(aceh.avg);
  const track = 500; const maxV = aceh.ump;
  const wUMP = track, wAvg = Math.round(track * aceh.avg / maxV);
  const LOC = { left: 360, top: 480, w: 360, h: Math.round(360 * VB.h / VB.w) };
  const locVB = VB;
  beats.push({ id, framing: "bars", start: beatEnd.b4, end: beatEnd.b5, html: `
<section class="clip beat" id="${id}" data-start="${beatEnd.b4}" data-duration="${beatEnd.b5 - beatEnd.b4}" data-track-index="1">
  <div class="kicker2" id="B5-title" style="top:340px;left:65px;width:875px;text-align:center;font-size:120px;font-family:var(--font-display);font-weight:400;letter-spacing:0">${aceh.name.toUpperCase()}</div>
  ${mapFrame("B5-loc", LOC, locVB, { focus: [idByName["Aceh"]], dimOthers: true, cls: "locator" })}
  <div class="bar-row" style="top:690px"><div class="bar-label">UMP (batas bawah)</div>
    <div class="bar-track" style="width:875px"><div class="bar-fill fill-accent" id="B5-f1" style="width:0px"></div>
    <div class="bar-val" id="B5-v1" style="left:0px">Rp0,00 jt</div></div></div>
  <div class="bar-row" style="top:920px"><div class="bar-label">Gaji rata-rata buruh</div>
    <div class="bar-track" style="width:875px"><div class="bar-fill fill-bad" id="B5-f2" style="width:0px"></div>
    <div class="bar-val" id="B5-v2" style="left:0px">Rp0,00 jt</div></div></div>
</section>`, hero: { id: "B5-bars", from: beatEnd.b4, to: beatEnd.b5 } });
  op(T.aceh, "#B5-loc #B5-loc-" + idByName["Aceh"], "set", { vars: { opacity: 1, filter: "drop-shadow(0 0 10px rgba(255,210,63,0.9))" } });
  op(T.aceh, "#B5-loc #B5-loc-" + idByName["Aceh"], "set", { vars: { opacity: 1 } });
  op(T.aceh, "#B5-title", "fromTo", { from: { autoAlpha: 0, y: 20 }, vars: { autoAlpha: 1, y: 0 }, d: 0.2 });
  // bars grow and the value rides the bar end; the value counts to its number on the cue
  op(T.bar_ump, "#B5-f1", "fromTo", { from: { width: 0 }, vars: { width: wUMP }, d: 0.9, ease: "power3.out" });
  op(T.bar_ump, "#B5-v1", "fromTo", { from: { left: 0 }, vars: { left: wUMP + 24 }, d: 0.9, ease: "power3.out" });
  countText(T.bar_ump, "#B5-v1", aceh.ump, 0.9);
  op(T.bar_avg, "#B5-f2", "fromTo", { from: { width: 0 }, vars: { width: wAvg }, d: 0.9, ease: "power3.out" });
  op(T.bar_avg, "#B5-v2", "fromTo", { from: { left: 0 }, vars: { left: wAvg + 24 }, d: 0.9, ease: "power3.out" });
  countText(T.bar_avg, "#B5-v2", aceh.avg, 0.9);
  beatVis(id, beatEnd.b4, beatEnd.b5);
  num(ptxt, spokenShort(ptxt), T.bar_ump, "s3_aceh", { derive: "ump:Aceh" });
  num(atxt, spokenShort(atxt), T.bar_avg, "s3_aceh", { derive: "avg:Aceh" });
}
// B6 ten-lowest: 10 lowest avg wages; 7 below UMP (red), 3 above (teal)
{
  const id = "B6"; const bottomIds = bottom10.map((p) => idByName[p.name]);
  const belowIds = below.map((p) => idByName[p.name]); const aboveIds = above.map((p) => idByName[p.name]);
  const lblLam = pagePx(FULLVB, FRAME, ...Object.values(bboxCentre(idByName["Lampung"])));
  const lblSum = pagePx(FULLVB, FRAME, ...Object.values(bboxCentre(idByName["Sumatera Utara"])));
  beats.push({ id, framing: "full-map", start: beatEnd.b5, end: beatEnd.b6, html: `
<section class="clip beat" id="${id}" data-start="${beatEnd.b5}" data-duration="${beatEnd.b6 - beatEnd.b5}" data-track-index="1">
  <div class="sevenrow"><div class="seven" id="B6-7">7</div><div class="seven-txt" id="B6-10">dari 10<br>provinsi</div></div>
  <div class="sub2" id="B6-sub">rata-rata gaji di bawah UMP</div>
  ${mapFrame("B6-map", FRAME, FULLVB, { focus: bottomIds, dimOthers: true })}
  ${label("B6-lam", lblLam.x + 24, lblLam.y + 6, "Lampung", null, "r")}
  ${label("B6-sum", lblSum.x + 28, lblSum.y - 22, "Sumatera Utara", null, "r")}
  <div class="legend" id="B6-leg"><span class="chip c-bad"></span>di bawah UMP<span class="chip c-good"></span>di atas UMP</div>
</section>`, hero: { id: "B6-map", from: beatEnd.b5, to: beatEnd.b6 } });
  for (const sid of bottomIds) op(T.sepuluh, `#B6-map #B6-map-${sid}`, "set", { vars: { opacity: 1, fill: "#9fb2cc" } });
  for (const sid of belowIds) { op(T.tujuh, `#B6-map #B6-map-${sid}`, "set", { vars: { fill: "#ff6b35", filter: "drop-shadow(0 0 10px rgba(255,210,63,0.9))" } }); }
  for (const sid of aboveIds) { op(T.tujuh, `#B6-map #B6-map-${sid}`, "set", { vars: { fill: "#2dd4bf", filter: "drop-shadow(0 0 10px rgba(255,210,63,0.9))" } }); }
  op(T.tujuh, "#B6-7", "fromTo", { from: { scale: 1.08, autoAlpha: 0 }, vars: { scale: 1, autoAlpha: 1 }, d: 0.35, ease: "back.out(2)" });
  fadeIn(T.sepuluh, "#B6-10");
  fadeIn(T.di_bawah, "#B6-sub");
  fadeIn(T.lampung, "#B6-lam"); fadeIn(T.sumut, "#B6-sum");
  fadeIn(T.tujuh, "#B6-leg");
  beatVis(id, beatEnd.b5, beatEnd.b6);
  num("7", "tujuh", T.tujuh, "s4_bottom10", { derive: "count_below" });
  num("10", "sepuluh", T.sepuluh, "s4_bottom10", { derive: "group_size" });
}
// B7 close-credit: source card and follow CTA
{
  const id = "B7"; const s5 = S.s5_close;
  beats.push({ id, framing: "credit", start: beatEnd.b6, end: beatEnd.b7, html: `
<section class="clip beat" id="${id}" data-start="${beatEnd.b6}" data-duration="${beatEnd.b7 - beatEnd.b6}" data-track-index="1">
  <div class="card" id="B7-card" style="top:470px">${s5.on_screen_text}</div>
  <div class="cta" id="B7-cta" style="top:940px"><span>Follow ${cfg.brand}</span></div>
</section>`, hero: { id: "B7-card", from: beatEnd.b6, to: beatEnd.b7 } });
  fadeIn(T.follow, "#B7-cta", 0.2);
  op(T.follow, "#B7-cta", "fromTo", { from: { scale: 0.85 }, vars: { scale: 1 }, d: 0.3, ease: "back.out(2)" });
  beatVis(id, beatEnd.b6, beatEnd.b7);
  num("2025", "dua ribu dua puluh lima", T.b7, "s5_close", { citation: true, derive: "citation" });
}
// Citation numbers (map credit and map licence) are declared in the lint-visible list too.
num("4.0", "", 0, "overlay", { citation: true, derive: "citation" });

// ---------- captions (word-synced, max two lines per group) ----------
const sentStartIdx = new Set(sentences.map((s) => words.findIndex((w) => Math.abs(w.start - s.start) < 1e-6)).filter((i) => i >= 0));
const groups = [];
{
  let cur = [];
  const chars = (g) => g.map((w) => w.text).join(" ").length;
  words.forEach((w, i) => {
    if (cur.length && (sentStartIdx.has(i) || chars(cur) + 1 + w.text.length > 44)) { groups.push(cur); cur = []; }
    cur.push({ ...w, i });
  });
  if (cur.length) groups.push(cur);
}
const capStart = groups.map((g) => g[0].start - 0.05);
const capHTML = groups.map((g, gi) => {
  const s = capStart[gi];
  // A group ends 0.15 s after its last word, but never after the next group's displayed start.
  const e = Math.min(g[g.length - 1].end + 0.15, gi + 1 < groups.length ? capStart[gi + 1] - 0.01 : TOTAL);
  const spans = g.map((w) => `<span class="w" id="cw-${w.i}">${w.text}</span>`).join(" ");
  op(s, `#cap-${gi}`, "set", { vars: { autoAlpha: 1 } });
  op(e, `#cap-${gi}`, "set", { vars: { autoAlpha: 0 } });
  for (const w of g) {
    op(w.start, `#cw-${w.i}`, "set", { vars: { className: "+=on" } });
    op(w.end, `#cw-${w.i}`, "set", { vars: { className: "-=on" } });
  }
  return `<div class="clip cap" id="cap-${gi}" data-start="${s.toFixed(3)}" data-duration="${(e - s).toFixed(3)}" data-track-index="5">${spans}</div>`;
}).join("\n");

// ---------- beat DOM, skeleton and runtime data ----------
// Beat DOM: beats are sections with hard cuts between them.
const fmtJSON = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const timeline = {
  total: TOTAL, fps: cfg.fps, sceneStart: sceneStart.map((t) => Math.round(t * 1000) / 1000),
  cues: Object.fromEntries(Object.entries(T).map(([k, v]) => [k, Math.round(v * 1000) / 1000])),
  beats: beats.map((b) => ({ id: b.id, framing: b.framing, start: b.start, end: b.end, hero: b.hero })),
  numbers, ops, groups: groups.length, dataNoShape,
  scenes: scenes.map((s, i) => ({ id: s.id, start: sceneStart[i], first: sceneFirst[i], vo: s.vo_text, on_screen: s.on_screen_text, cue_words: s.cue_words })),
  safe: cfg.safe, hero_band: cfg.hero_band,
  bottom10: bottom10.map((p) => p.name), below: below.map((p) => p.name), above: above.map((p) => p.name),
  overlays: { brand: cfg.brand, badge: cfg.badge, map_credit: cfg.map_credit },
  inputs_sha256: Object.fromEntries(Object.entries(cfg.inputs).map(([k, rel]) => [k, createHash("sha256").update(readFileSync(P(rel))).digest("hex").slice(0, 12)])),
};

const beatsHTML = beats.map((b) => b.html).join("\n");
const css = readFileSync(P("components/video.css"), "utf8");
const runtime = readFileSync(P("components/video.js"), "utf8");
const cssVars = `:root{--safe-top:${cfg.safe.top}px;--safe-bottom:${cfg.safe.bottom}px;--safe-left:${cfg.safe.left}px;--safe-right:${cfg.safe.right}px;--safe-w:${cfg.width - cfg.safe.left - cfg.safe.right}px;--safe-h:${cfg.height - cfg.safe.top - cfg.safe.bottom}px}`;

const page = `<!doctype html>
<!-- GENERATED by tools/build.mjs from research/script.json, research/data.csv and assets/words.json. Do not hand-edit. -->
<html lang="id" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${cfg.width}, height=${cfg.height}" />
<title>UMP vs gaji asli (draft)</title>
<style>
${cssVars}
${css}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${cfg.width}" data-height="${cfg.height}" data-fps="${cfg.fps}">
<div class="grain"></div>
${beatsHTML}
${capHTML}
<div class="clip overlay badge" id="badge" data-start="0" data-duration="${TOTAL}" data-track-index="6">${cfg.badge}</div>
<div class="clip overlay brand" id="brand" data-start="0" data-duration="${TOTAL}" data-track-index="6">${cfg.brand}</div>
<div class="clip overlay mapcredit" id="mapcredit" data-start="0" data-duration="${TOTAL}" data-track-index="6">${cfg.map_credit}</div>
<audio id="vo" src="assets/vo.mp3" data-start="0" data-duration="${VO_SECONDS}" data-volume="1" preload="auto"></audio>
</div>
<script type="application/json" id="video-data">${fmtJSON({ total: TOTAL, fps: cfg.fps, ops })}</script>
<script src="vendor/gsap.min.js"></script>
<script>${runtime}</script>
<script>
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
window.__timelines["main"] = tl;
window.VideoBuild(tl, JSON.parse(document.getElementById("video-data").textContent));
tl.seek(0);
</script>
</body>
</html>
`;
// Inline CSS is the single source of styling; fonts are referenced as assets/fonts/*.woff2.
mkdirSync(P("build"), { recursive: true });
writeFileSync(P("index.html"), page, "utf8");
writeFileSync(P("build/timeline.json"), JSON.stringify(timeline, null, 1) + "\n", "utf8");
console.log(`build: index.html written, total ${TOTAL}s, ${beats.length} beats, ${groups.length} caption groups, ${ops.length} ops`);
for (const b of beats) console.log(`  ${b.id.padEnd(3)} ${b.framing.padEnd(13)} ${b.start.toFixed(3).padStart(7)} -> ${b.end.toFixed(3).padStart(7)}`);
if (dataNoShape.length) console.log(`  note: data provinces without a 34-map shape (not used in this video): ${dataNoShape.join(", ")}`);
