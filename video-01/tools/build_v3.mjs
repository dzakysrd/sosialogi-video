// Builds video-01 v3: index_v3.html (composition), build/v3/timeline.json, assets/v3/{vo.mp3,words.json,sentences.json}.
// Inputs: research/script_v3.json, research/data.csv, research/umk_examples.csv, the VO variant named in
// video.v3.config.json (voice.variant -> voice/samples/v3/<variant>/), assets/map/indonesia-34.svg.
// Every beat starts and ends on a word cue. Every number on screen is derived from the data and spoken at its cue.
// Run: node tools/build_v3.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { makeCue } from "./lib/cue.mjs";
import { fmtShort, spokenShort, spokenInt } from "./lib/nums.mjs";
import { parseCsv } from "./lib/csv.mjs";
import { getGeometry } from "./geometry.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (rel) => resolve(ROOT, rel);
const cfg = JSON.parse(readFileSync(P("video.v3.config.json"), "utf8"));
const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
const dataRows = parseCsv(readFileSync(P(cfg.inputs.data), "utf8"));
const umkRows = parseCsv(readFileSync(P(cfg.inputs.umk), "utf8"));
const svgRaw = readFileSync(P(cfg.inputs.map), "utf8").replace(/<\?xml[^>]*>\s*/, "");

// ---------- voice variant (one line in the config switches it) ----------
const voiceDir = join(P(cfg.voice.dir), cfg.voice.variant);
const words = JSON.parse(readFileSync(join(voiceDir, "words.json"), "utf8"));
const sentences = JSON.parse(readFileSync(join(voiceDir, "sentences.json"), "utf8"));
mkdirSync(P("assets/v3"), { recursive: true });
for (const f of ["vo.mp3", "words.json", "sentences.json"]) copyFileSync(join(voiceDir, f), join(P("assets/v3"), f));
const VO_SECONDS = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", P("assets/v3/vo.mp3")], { encoding: "utf8" }).trim());

const { cue, cueSpan } = makeCue(words);
const fail = (m) => { throw new Error("build_v3: " + m); };
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---------- script checks ----------
const scenes = script.scenes;
const S = Object.fromEntries(scenes.map((s) => [s.id, s]));
const wordCounts = scenes.map((s) => s.vo_text.split(/\s+/).filter(Boolean).length);
const allVo = scenes.map((s) => s.vo_text).join(" ");
const totalWords = wordCounts.reduce((a, b) => a + b, 0);
if (totalWords !== words.length) fail(`word count ${words.length} != script ${totalWords}`);
const [WMIN, WMAX] = script.word_count_target;
if (totalWords < WMIN || totalWords > WMAX) fail(`script has ${totalWords} words, target ${WMIN}-${WMAX}`);
if (/\d/.test(allVo)) fail("digits in vo_text (speak numbers in words)");
if (/melanggar/i.test(allVo)) fail('vo_text must not say "melanggar"');

// ---------- data (all numbers come from here) ----------
const SHAPE_OF = { "Papua Barat Daya": "Papua Barat", "Papua Selatan": "Papua", "Papua Pegunungan": "Papua", "Papua Tengah": "Papua" };
const prov = {};
for (const r of dataRows) prov[r.province] = { name: r.province, ump: Number(r.ump_2026), avg: Number(r.avg_wage) };
const provList = Object.values(prov);
if (provList.length !== 38) fail(`data has ${provList.length} provinces, expected 38`);
const ratio = (p) => p.avg / p.ump;
const umk = Object.fromEntries(umkRows.map((r) => [r.kabkota.replace(/^(Kabupaten|Kota) /, ""), Number(r.umk_2026)]));
const below = provList.filter((p) => p.avg < p.ump);
const byRatio = [...provList].sort((a, b) => ratio(a) - ratio(b));
const lowestUMP = provList.reduce((a, b) => (b.ump < a.ump ? b : a));
const highestUMP = provList.reduce((a, b) => (b.ump > a.ump ? b : a));
if (below.length !== 24) fail(`below-UMP count ${below.length}, script says 24`);
if (byRatio[0].name !== "Aceh") fail(`lowest ratio is ${byRatio[0].name}, script says Aceh`);
if (byRatio.at(-1).name !== "Jawa Barat") fail(`highest ratio is ${byRatio.at(-1).name}, script says Jawa Barat`);
if (lowestUMP.name !== "Jawa Barat") fail(`lowest UMP is ${lowestUMP.name}, script says Jawa Barat`);
if (highestUMP.name !== "DKI Jakarta") fail(`highest UMP is ${highestUMP.name}, hook says DKI Jakarta`);
if (!(prov["DKI Jakarta"].avg < prov["DKI Jakarta"].ump)) fail("Jakarta average should be below its UMP");
if (!(umk.Karawang > prov["Jawa Barat"].ump)) fail("Karawang UMK should be above the Jabar UMP");
if (spokenShort(fmtShort(umk.Karawang)) !== "lima koma delapan sembilan juta") fail("Karawang spoken value");

// ---------- map ----------
const geo = getGeometry(P(cfg.inputs.map), P("build/v3"));
const shapes = [...svgRaw.matchAll(/<path id="([^"]+)" data-name="([^"]+)"[^>]*?\sd="([^"]+)"/g)].map((m) => ({ id: m[1], name: m[2], d: m[3] }));
if (shapes.length !== 34) fail(`map has ${shapes.length} shapes, expected 34`);
const idByName = Object.fromEntries(shapes.map((s) => [s.name, s.id]));
const shapeOf = (name) => idByName[SHAPE_OF[name] ?? name];
for (const p of provList) if (!shapeOf(p.name)) fail(`no map shape for ${p.name}`);
const groups = {};
for (const p of provList) (groups[shapeOf(p.name)] ||= []).push(p);
const shapeStatus = (sid) => {
  const ps = groups[sid];
  if (ps.every((p) => p.avg < p.ump)) return "red";
  if (ps.every((p) => p.avg >= p.ump)) return "teal";
  return "hatch";
};
const VB = { x: geo.viewBox[0], y: geo.viewBox[1], w: geo.viewBox[2], h: geo.viewBox[3] };
const bb = (ids) => {
  const x0 = Math.min(...ids.map((i) => geo.provs[i].x)), y0 = Math.min(...ids.map((i) => geo.provs[i].y));
  const x1 = Math.max(...ids.map((i) => geo.provs[i].x + geo.provs[i].w)), y1 = Math.max(...ids.map((i) => geo.provs[i].y + geo.provs[i].h));
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
};
const centre = (sid) => { const g = geo.provs[sid]; return { x: g.x + g.w / 2, y: g.y + g.h / 2 }; };
const vbAt = (fr, cx, cy, s) => ({ x: cx - fr.w / (2 * s), y: cy - fr.h / (2 * s), w: fr.w / s, h: fr.h / s });
const toPage = (fr, vb, ux, uy) => ({ x: fr.left + (ux - vb.x) * (fr.w / vb.w), y: fr.top + (uy - vb.y) * (fr.h / vb.h) });

// Frames (page px). Hero content is centred on y ~ 860 (safe box 220..1500).
const FR = {
  nat: { left: 40, top: 830, w: 1000, h: 380 },
  java: { left: 40, top: 600, w: 1000, h: 470 },
  sumatra: { left: 240, top: 560, w: 600, h: 340 },
  jabar: { left: 40, top: 470, w: 1000, h: 500 },
  karawang: { left: 110, top: 470, w: 860, h: 440 },
};
const JAVA = ["id-bt", "id-jk", "id-jb", "id-jt", "id-yo", "id-ji"];
const SUMATRA = ["id-ac", "id-su", "id-sb", "id-ri", "id-ja", "id-ss", "id-be", "id-la"];
const jv = bb(JAVA), sv = bb(SUMATRA);
const JAKW = ["id-bt", "id-jk", "id-jb"], jw = bb(JAKW);   // Jakarta locator crop: Banten, DKI and the west of Jawa Barat
const SUMN = ["id-ac", "id-su"], sn = bb(SUMN);            // Aceh locator crop: north Sumatra
const SID = { jak: idByName["DKI Jakarta"], jb: idByName["Jawa Barat"], ac: idByName["Aceh"] };
const VB_NAT = { x: VB.x, w: VB.w, h: FR.nat.h * VB.w / FR.nat.w, y: VB.y + VB.h / 2 - (FR.nat.h * VB.w / FR.nat.w) / 2 };
const sJava = FR.java.w / (jw.w * 1.25);
const VB_JAVA = vbAt(FR.java, jw.cx, jw.cy, sJava);
const sSum = Math.min(FR.sumatra.w / (sn.w * 1.6), FR.sumatra.h / (sn.h * 1.5));
const VB_SUM = vbAt(FR.sumatra, sn.cx, sn.cy, sSum);
const sJabar = (0.6 * FR.jabar.w) / geo.provs[SID.jb].w; // Jawa Barat fills 60% of the frame width
const jbC = centre(SID.jb);
const VB_JABAR = vbAt(FR.jabar, jbC.x, jbC.y, sJabar);
const VB_KW = vbAt(FR.karawang, jbC.x, jbC.y, (0.6 * FR.karawang.w) / geo.provs[SID.jb].w);
// Karawang pin: a labelled pin inside Jawa Barat, placed by eye on the north coast east of DKI Jakarta. It is not a district border.
const KW = { x: 211.5, y: 236.5 };
// Mainland pins for Jakarta and Aceh. The path bounding boxes of DKI (Thousand Islands) and Aceh (outlying islands) are
// too wide, so their box centres fall in the sea. These points are the centroids of the lit mainland, measured on the rendered stills.
const JAK_PIN = { x: 201.1, y: 234.0 }, ACEH_PIN = { x: 29.9, y: 52.3 };

// ---------- timing: every beat boundary is a word cue ----------
const T = {};
const sceneFirst = ["UMP", "Tahun", "Secara", "Yang", "Jawa", "Ini"];
const wordStartIdx = []; { let acc = 0; for (const c of wordCounts) { wordStartIdx.push(acc); acc += c; } }
const sceneStart = scenes.map((s, i) => {
  const after = i === 0 ? -1 : words[wordStartIdx[i - 1] + wordCounts[i - 1] - 1].end;
  return cue(sceneFirst[i], after);
});
sceneStart.forEach((t, i) => { if (Math.abs(t - words[wordStartIdx[i]].start) > 1e-9) fail(`scene ${i} cue != first word`); });
const C = (name, word, after) => { const sp = cueSpan(word, after); T[name] = sp.time; return sp; };
C("tapi", "Tapi", sceneStart[0]);
C("tahun", "Tahun", T.tapi);
if (Math.abs(T.tahun - sceneStart[1]) > 1e-6) fail("scene 2 must start at 'Tahun'");
C("year", spokenInt("2026"), T.tahun);
C("jak_ump", spokenShort(fmtShort(prov["DKI Jakarta"].ump)), T.year);
C("jak_avg", spokenShort(fmtShort(prov["DKI Jakarta"].avg)), T.jak_ump);
C("secara", "Secara", T.jak_avg);
C("n24", spokenInt(String(below.length)), T.secara);
C("n38", spokenInt(String(provList.length)), T.n24);
C("yang", "Yang", T.n38);
C("aceh", "Aceh", T.yang);
C("ac_ump", spokenShort(fmtShort(prov.Aceh.ump)), T.aceh);
C("ac_avg", spokenShort(fmtShort(prov.Aceh.avg)), T.ac_ump);
C("jabar", "Jawa Barat", T.ac_avg);
C("jb_ump", spokenShort(fmtShort(prov["Jawa Barat"].ump)), T.jabar);
C("jb_avg", spokenShort(fmtShort(prov["Jawa Barat"].avg)), T.jb_ump);
C("batas", "UMP cuma batas provinsi", T.jb_avg);
C("karawang", "Karawang", T.batas);
C("kw_val", spokenShort(fmtShort(umk.Karawang)), T.karawang);
C("ini", "Ini", T.kw_val);
C("sumber", "Sumbernya", T.ini);
C("follow", "Follow", T.sumber);
const lastWordEnd = words[words.length - 1].end;
const TOTAL = r3(lastWordEnd + cfg.tail_s);
const B = {
  b1: [0, T.tahun], b2: [T.tahun, T.jak_ump], b3: [T.jak_ump, T.secara], b4: [T.secara, T.yang],
  b5: [T.yang, T.jabar], b6: [T.jabar, T.batas], b7: [T.batas, T.ini], b8: [T.ini, T.sumber], b9: [T.sumber, TOTAL],
};
// length gates from the config
const hookSpan = words[wordCounts[0] - 1].end - words[0].start;
const jabarSpan = T.ini - T.jabar;
const closeSpan = TOTAL - T.ini;
if (hookSpan > cfg.hook_max_s + 1e-9) fail(`hook VO ${hookSpan.toFixed(2)} s > ${cfg.hook_max_s} (try voice variant v2 or edit the hook)`);
if (jabarSpan > cfg.jabar_max_s + 1e-9) fail(`Jawa Barat section ${jabarSpan.toFixed(2)} s > ${cfg.jabar_max_s}`);
if (closeSpan > cfg.close_max_s + 1e-9) fail(`close ${closeSpan.toFixed(2)} s > ${cfg.close_max_s}`);
if (TOTAL > cfg.total_max_s + 1e-9) fail(`total ${TOTAL} s > ${cfg.total_max_s}`);
for (const k of Object.keys(T)) if (!Number.isFinite(T[k])) fail(`cue ${k} unresolved`);

// ---------- output registries ----------
const ops = [];
const numbers = [];
const beats = [];
const op = (t, sel, kind, extra = {}) => ops.push({ t: r3(t), sel, kind, ...extra });
const set = (t, sel, vars) => op(t, sel, "set", { vars });
const show = (t, sel, d = 0.15) => op(t, sel, "fromTo", { from: { autoAlpha: 0 }, vars: { autoAlpha: 1 }, d });
const slam = (t, sel) => op(t, sel, "fromTo", { from: { autoAlpha: 0, y: 16 }, vars: { autoAlpha: 1, y: 0 }, d: 0.28, ease: "back.out(2)" });
const widthTo = (t, sel, from, to, d = 0.9) => op(t, sel, "fromTo", { from: { width: from }, vars: { width: to }, d, ease: "power3.out" });
const beatVis = (id, [a, b]) => { set(a, `#${id}`, { autoAlpha: 1 }); set(b, `#${id}`, { autoAlpha: 0 }); };
const num = (text, spoken, t, scene, derive) => numbers.push({ key: text.match(/\d+(?:,\d+)?/g).join(""), text, spoken, t: r3(t), scene, derive });
const beat = (id, framing, [a, b], html, hero) => beats.push({ id, framing, start: r3(a), end: r3(b), hero: { from: r3(a), to: r3(b), el: hero }, html });
const pin = (id, x, y, extra = "") => `<div class="dot" id="${id}" style="left:${r3(x)}px;top:${r3(y)}px;${extra}"></div>`;
const others = (sid) => shapes.map((s) => s.id).filter((x) => x !== sid);

// Map frame: provinces are paths `${id}-${shapeId}`. data-hero marks the frame as the hero for the centre gate.
function mapFrame(id, fr, vb, { dim = [], hatch = false, halo = null, fade = false } = {}) {
  const defs = hatch ? `<defs><pattern id="${id}-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#ff6b35"/><rect width="4.5" height="9" fill="#2dd4bf"/></pattern></defs>` : "";
  const paths = shapes.map((s) => `<path id="${id}-${s.id}" class="prov${dim.includes(s.id) ? " dim" : ""}" d="${s.d}"/>`).join("\n");
  const ring = halo ? `<path id="${id}-halo-${halo}" class="halo" d="${shapes.find((x) => x.id === halo).d}"/>` : "";
  return `<div class="map-frame${fade ? " fade-b" : ""}" id="${id}" data-hero="1" style="left:${fr.left}px;top:${fr.top}px;width:${fr.w}px;height:${fr.h}px"><svg viewBox="${r3(vb.x)} ${r3(vb.y)} ${r3(vb.w)} ${r3(vb.h)}" preserveAspectRatio="xMidYMid meet">${defs}<g>${paths}${ring}</g></svg></div>`;
}
const litShape = (id, sid, t) => set(t, `#${id}-${sid}`, { opacity: 1, fill: "#ffd23f", filter: "drop-shadow(0 0 12px rgba(255,210,63,0.9))" });
const pulse = (t, id, sid) => op(t, `#${id}-halo-${sid}`, "fromTo", { from: { opacity: 0.2 }, vars: { opacity: 0.9, yoyo: true, repeat: 3 }, d: 0.4 });

// ---------- B1 hook: "UMP TERTINGGI", then the claim in full at 'Tapi' ----------
beat("B1", "claim", B.b1, `
<section class="clip beat" id="B1" data-start="0" data-duration="${r3(B.b1[1])}" data-track-index="1">
  <div class="claim-1" id="B1-a" data-tb="1" data-hero="1" style="top:640px">
    <div class="c1-a">UMP</div>
    <div class="c1-b">TERTINGGI</div>
  </div>
  <div class="claim-2" id="B1-b" data-tb="1" data-hero="1" style="top:630px;visibility:hidden">
    <div class="c2-a">TAPI GAJI</div>
    <div class="c2-b">RATA-RATANYA</div>
    <div class="c2-c">DI BAWAH UMP</div>
  </div>
</section>`, "B1-a");
beatVis("B1", B.b1);
set(T.tapi, "#B1-a", { autoAlpha: 0 });
set(T.tapi, "#B1-b", { autoAlpha: 1 });

// ---------- B2 locate: Java zoom, DKI Jakarta lit and labelled ----------
{
  const id = "B2";
  const c = toPage(FR.java, VB_JAVA, JAK_PIN.x, JAK_PIN.y);
  const labelTop = 1110, leadTop = c.y + 22;
  beat(id, "locate-java", B.b2, `
<section class="clip beat" id="${id}" data-start="${r3(B.b2[0])}" data-duration="${r3(B.b2[1] - B.b2[0])}" data-track-index="1">
  <div class="headline" data-tb="1" data-hero="1" style="top:460px">UMP <span id="B2-year" style="visibility:hidden">2026</span></div>
  ${mapFrame("B2-map", FR.java, VB_JAVA, { dim: others(SID.jak), halo: SID.jak })}
  ${pin("B2-dot", c.x, c.y)}
  <div class="leader" id="B2-lead" style="left:${r3(c.x - 1.5)}px;top:${r3(leadTop)}px;height:${r3(labelTop - leadTop)}px"></div>
  <div class="lbl" id="B2-lbl" data-tb="1" style="left:${r3(Math.max(65, c.x - 150))}px;top:${labelTop}px"><div class="ln">DKI Jakarta</div></div>
</section>`, "B2-map");
  beatVis(id, B.b2);
  litShape("B2-map", SID.jak, B.b2[0]);
  pulse(B.b2[0], "B2-map", SID.jak);
  show(B.b2[0], "#B2-dot"); show(B.b2[0], "#B2-lead"); show(B.b2[0], "#B2-lbl");
  show(T.year, "#B2-year", 0.12);
  num("2026", spokenInt("2026"), T.year, "s2_jakarta", "year");
}

// ---------- B3 Jakarta bars: UMP vs average, bigger and centred ----------
{
  const id = "B3", j = prov["DKI Jakarta"];
  const w2 = Math.round(875 * j.avg / j.ump);
  beat(id, "bars", B.b3, `
<section class="clip beat" id="${id}" data-start="${r3(B.b3[0])}" data-duration="${r3(B.b3[1] - B.b3[0])}" data-track-index="1">
  <div class="bars tall tb" id="B3-g" data-tb="1" data-hero="1" style="top:470px;height:800px;visibility:hidden">
    <div class="kicker" style="top:0">DKI Jakarta</div>
    <div class="brow" id="B3-r1" style="top:100px"><div class="bname">UMP</div><div class="bval" id="B3-v1" style="visibility:hidden">${fmtShort(j.ump)}</div></div>
    <div class="btrack" id="B3-t1" style="top:250px"><div class="bfill fill-accent" id="B3-f1"></div></div>
    <div class="brow" id="B3-r2" style="top:470px"><div class="bname">Gaji rata-rata</div><div class="bval" id="B3-v2" style="visibility:hidden">${fmtShort(j.avg)}</div></div>
    <div class="btrack" id="B3-t2" style="top:620px"><div class="bfill fill-bad" id="B3-f2"></div></div>
  </div>
</section>`, "B3-g");
  beatVis(id, B.b3);
  show(B.b3[0], "#B3-g", 0.1);
  widthTo(T.jak_ump, "#B3-f1", 0, 875); slam(T.jak_ump, "#B3-v1");
  widthTo(T.jak_avg, "#B3-f2", 0, w2); slam(T.jak_avg, "#B3-v2");
  num(fmtShort(j.ump), spokenShort(fmtShort(j.ump)), T.jak_ump, "s2_jakarta", "ump:DKI Jakarta");
  num(fmtShort(j.avg), spokenShort(fmtShort(j.avg)), T.jak_avg, "s2_jakarta", "avg:DKI Jakarta");
}

// ---------- B4 national: 24 of 38 provinces turn red, province by province ----------
{
  const id = "B4";
  beat(id, "full-map", B.b4, `
<section class="clip beat" id="${id}" data-start="${r3(B.b4[0])}" data-duration="${r3(B.b4[1] - B.b4[0])}" data-track-index="1">
  <div class="hero-group tb" id="B4-g" data-tb="1" data-hero="1" style="top:440px;height:380px;visibility:hidden">
    <div class="big" id="B4-n24" style="top:0">24</div>
    <div class="bigmid" id="B4-dari" style="top:250px">dari 38 provinsi</div>
  </div>
  ${mapFrame("B4-map", FR.nat, VB_NAT, { hatch: true })}
  <div class="legend tb" id="B4-leg" data-tb="1" style="top:1240px;visibility:hidden"><span class="chip c-bad"></span>di bawah UMP<span class="chip c-good"></span>di atas UMP<span class="chip c-mix"></span>campuran (Papua)</div>
</section>`, "B4-map");
  beatVis(id, B.b4);
  show(T.n24, "#B4-g", 0.1);
  slam(T.n24, "#B4-n24");
  show(T.n38, "#B4-dari", 0.2);
  num(String(below.length), spokenInt(String(below.length)), T.n24, "s3_nasional", "count_below");
  num(String(provList.length), spokenInt(String(provList.length)), T.n38, "s3_nasional", "count_total");
  // sweep: red (all below) and hatch (mixed) shapes in order of their lowest ratio, then teal (all above)
  const sids = Object.keys(groups);
  const minRatio = (sid) => Math.min(...groups[sid].map(ratio));
  const reds = sids.filter((s) => shapeStatus(s) !== "teal").sort((a, b) => minRatio(a) - minRatio(b));
  const teals = sids.filter((s) => shapeStatus(s) === "teal").sort((a, b) => minRatio(a) - minRatio(b));
  const tStart = T.n38 + 0.1, tEnd = T.yang - 0.5;
  const step = (tEnd - tStart) / Math.max(1, reds.length - 1);
  reds.forEach((sid, i) => {
    const fill = shapeStatus(sid) === "red" ? "#ff6b35" : `url(#${id}-map-hatch)`;
    set(tStart + i * step, `#${id}-map-${sid}`, { fill, opacity: 1 });
  });
  teals.forEach((sid, i) => set(tEnd + i * 0.02, `#${id}-map-${sid}`, { fill: "#2dd4bf", opacity: 1 }));
  show(tEnd, "#B4-leg", 0.2);
}

// ---------- B5 Aceh: Sumatra locator (600 px frame, Aceh lit) and bars ----------
{
  const id = "B5", a = prov.Aceh;
  const pinP = toPage(FR.sumatra, VB_SUM, ACEH_PIN.x, ACEH_PIN.y);
  const w2 = Math.round(875 * a.avg / a.ump);
  beat(id, "locator-bars", B.b5, `
<section class="clip beat" id="${id}" data-start="${r3(B.b5[0])}" data-duration="${r3(B.b5[1] - B.b5[0])}" data-track-index="1">
  <div class="headline" id="B5-title" data-tb="1" data-hero="1" style="top:430px;font-size:120px;visibility:hidden">Aceh</div>
  ${mapFrame("B5-map", FR.sumatra, VB_SUM, { dim: others(SID.ac), halo: SID.ac, fade: true })}
  ${pin("B5-dot", pinP.x, pinP.y)}
  <div class="bars compact tb" id="B5-g" data-tb="1" data-hero="1" style="top:940px;height:372px;visibility:hidden">
    <div class="brow" id="B5-r1" style="top:0"><div class="bname">UMP</div><div class="bval" id="B5-v1" style="visibility:hidden">${fmtShort(a.ump)}</div></div>
    <div class="btrack" id="B5-t1" style="top:96px"><div class="bfill fill-accent" id="B5-f1"></div></div>
    <div class="brow" id="B5-r2" style="top:200px"><div class="bname">Gaji rata-rata</div><div class="bval" id="B5-v2" style="visibility:hidden">${fmtShort(a.avg)}</div></div>
    <div class="btrack" id="B5-t2" style="top:296px"><div class="bfill fill-bad" id="B5-f2"></div></div>
  </div>
</section>`, "B5-map");
  beatVis(id, B.b5);
  show(B.b5[0], "#B5-title", 0.15);
  show(B.b5[0], "#B5-g", 0.1);
  litShape("B5-map", SID.ac, T.aceh);
  pulse(T.aceh, "B5-map", SID.ac);
  show(T.aceh, "#B5-dot");
  widthTo(T.ac_ump, "#B5-f1", 0, 875); slam(T.ac_ump, "#B5-v1");
  widthTo(T.ac_avg, "#B5-f2", 0, w2); slam(T.ac_avg, "#B5-v2");
  num(fmtShort(a.ump), spokenShort(fmtShort(a.ump)), T.ac_ump, "s4_aceh", "ump:Aceh");
  num(fmtShort(a.avg), spokenShort(fmtShort(a.avg)), T.ac_avg, "s4_aceh", "avg:Aceh");
}

// ---------- B6 Jawa Barat: lowest UMP, average above it ----------
{
  const id = "B6", jb = prov["Jawa Barat"];
  const c = toPage(FR.jabar, VB_JABAR, jbC.x, jbC.y);
  beat(id, "zoom-province", B.b6, `
<section class="clip beat" id="${id}" data-start="${r3(B.b6[0])}" data-duration="${r3(B.b6[1] - B.b6[0])}" data-track-index="1">
  ${mapFrame("B6-map", FR.jabar, VB_JABAR, { dim: others(SID.jb), halo: SID.jb })}
  ${pin("B6-dot", c.x, c.y)}
  <div class="hero-group tb" id="B6-g" data-tb="1" data-hero="1" style="top:1000px;height:256px;visibility:hidden">
    <div class="kicker" style="top:0">Jawa Barat</div>
    <div class="tile t-acc" id="B6-t1" style="left:0;top:56px"><div class="tl">UMP terendah</div><div class="tv" id="B6-v1" style="visibility:hidden">${fmtShort(jb.ump)}</div></div>
    <div class="tile" id="B6-t2" style="left:455px;top:56px"><div class="tl">Rata-rata gaji</div><div class="tv" id="B6-v2" style="visibility:hidden">${fmtShort(jb.avg)}</div></div>
  </div>
</section>`, "B6-map");
  beatVis(id, B.b6);
  litShape("B6-map", SID.jb, B.b6[0]);
  pulse(B.b6[0], "B6-map", SID.jb);
  show(B.b6[0], "#B6-dot");
  show(B.b6[0], "#B6-g", 0.1);
  show(T.jb_ump, "#B6-v1", 0.12);
  show(T.jb_avg, "#B6-v2", 0.12);
  num(fmtShort(jb.ump), spokenShort(fmtShort(jb.ump)), T.jb_ump, "s5_jabar", "ump:Jawa Barat");
  num(fmtShort(jb.avg), spokenShort(fmtShort(jb.avg)), T.jb_avg, "s5_jabar", "avg:Jawa Barat");
}

// ---------- B7 UMK: Karawang pin, UMP Jabar vs UMK Karawang (replaces the static 'batas provinsi' card) ----------
{
  const id = "B7", kw = umk.Karawang, jb = prov["Jawa Barat"];
  const kwP = toPage(FR.karawang, VB_KW, KW.x, KW.y);
  beat(id, "tiles-map", B.b7, `
<section class="clip beat" id="${id}" data-start="${r3(B.b7[0])}" data-duration="${r3(B.b7[1] - B.b7[0])}" data-track-index="1">
  ${mapFrame("B7-map", FR.karawang, VB_KW, { dim: others(SID.jb), halo: SID.jb })}
  ${pin("B7-pin", kwP.x, kwP.y)}
  <div class="hero-group tb" id="B7-g" data-tb="1" data-hero="1" style="top:960px;height:256px;visibility:hidden">
    <div class="kicker" style="top:0">UMP = batas provinsi</div>
    <div class="tile" id="B7-t1" style="left:0;top:56px"><div class="tl">UMP Jabar</div><div class="tv" id="B7-v1">${fmtShort(jb.ump)}</div></div>
    <div class="tile t-acc" id="B7-t2" style="left:455px;top:56px"><div class="tl">UMK Karawang</div><div class="tv" id="B7-v2" style="visibility:hidden">${fmtShort(kw)}</div></div>
  </div>
</section>`, "B7-map");
  beatVis(id, B.b7);
  litShape("B7-map", SID.jb, B.b7[0]);
  show(B.b7[0], "#B7-g", 0.15);
  show(T.karawang, "#B7-pin");
  op(T.karawang, "#B7-map-halo-" + SID.jb, "fromTo", { from: { opacity: 0.2 }, vars: { opacity: 0.9, yoyo: true, repeat: 3 }, d: 0.4 });
  slam(T.kw_val, "#B7-v2");
  num(fmtShort(kw), spokenShort(fmtShort(kw)), T.kw_val, "s5_jabar", "umk:Karawang");
}

// ---------- B8 caveat card (from 'Ini') ----------
beat("B8", "caveat-card", B.b8, `
<section class="clip beat" id="B8" data-start="${r3(B.b8[0])}" data-duration="${r3(B.b8[1] - B.b8[0])}" data-track-index="1">
  <div class="card tb" id="B8-card" data-tb="1" data-hero="1" style="top:690px">Ini rata-rata gaji bersih buruh, bukan bukti perusahaan tidak patuh.</div>
</section>`, "B8-card");
beatVis("B8", B.b8);

// ---------- B9 final card: sources (once, 30 px, two lines) and the CTA pill ----------
beat("B9", "close-card", B.b9, `
<section class="clip beat" id="B9" data-start="${r3(B.b9[0])}" data-duration="${r3(B.b9[1] - B.b9[0])}" data-track-index="1">
  <div class="pill tb" id="B9-cta" data-tb="1" data-hero="1" style="top:720px"><span>Follow ${cfg.brand}</span></div>
  <div class="sources tb cite" id="B9-src" data-tb="1" style="top:900px">${cfg.sources_line}</div>
</section>`, "B9-cta");
beatVis("B9", B.b9);
slam(T.sumber, "#B9-cta");
show(T.sumber, "#B9-src", 0.3);

// ---------- captions (word-synced; chunks of at most 5 words and 34 characters; a new chunk at each sentence) ----------
const sentStartIdx = new Set(sentences.map((s) => words.findIndex((w) => Math.abs(w.start - s.start) < 1e-6)).filter((i) => i >= 0));
const capGroups = [];
{
  const NUMW = new Set(["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas", "belas", "puluh", "ratus", "ribu", "seratus", "seribu", "koma", "juta"]);
  const isNum = (w) => NUMW.has(w.text.toLowerCase().replace(/[^\p{L}]/gu, ""));
  let cur = [];
  const chars = (g) => g.map((w) => w.text).join(" ").length;
  words.forEach((w, i) => {
    if (cur.length) {
      const prev = cur[cur.length - 1];
      const sentenceBreak = sentStartIdx.has(i);
      const phraseBreak = /[,.;:!?]$/.test(prev.text) && cur.length >= 2;
      const tooBig = cur.length >= 5 || chars(cur) + 1 + w.text.length > 34;
      const numStart = isNum(w) && !isNum(prev);     // a number phrase starts its own caption
      if (sentenceBreak || phraseBreak || numStart || tooBig) { capGroups.push(cur); cur = []; }
    }
    cur.push({ ...w, i });
  });
  if (cur.length) capGroups.push(cur);
}
const capStart = capGroups.map((g) => g[0].start - 0.05);
const capHTML = capGroups.map((g, gi) => {
  const s = capStart[gi];
  const e = Math.min(g[g.length - 1].end + 0.15, gi + 1 < capGroups.length ? capStart[gi + 1] - 0.01 : TOTAL);
  const spans = g.map((w) => `<span class="w" id="cw-${w.i}">${w.text}</span>`).join(" ");
  set(s, `#cap-${gi}`, { autoAlpha: 1 });
  set(e, `#cap-${gi}`, { autoAlpha: 0 });
  for (const w of g) { set(w.start, `#cw-${w.i}`, { className: "+=on" }); set(w.end, `#cw-${w.i}`, { className: "-=on" }); }
  return `<div class="clip cap tb" id="cap-${gi}" data-tb="1" data-start="${s.toFixed(3)}" data-duration="${(e - s).toFixed(3)}" data-track-index="5">${spans}</div>`;
}).join("\n");

// ---------- persistent overlay: brand tag only (no per-frame source or map credit) ----------
set(0, "#brand", { autoAlpha: 0 });
show(0.6, "#brand", 0.3);

// ---------- page ----------
const fmtJSON = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const beatsHTML = beats.map((b) => b.html).join("\n");
const css = readFileSync(P("components/video_v3.css"), "utf8");
const runtime = readFileSync(P("components/video.js"), "utf8");
const cssVars = `:root{--safe-top:${cfg.safe.top}px;--safe-bottom:${cfg.safe.bottom}px;--safe-left:${cfg.safe.left}px;--safe-right:${cfg.safe.right}px;--safe-w:${cfg.width - cfg.safe.left - cfg.safe.right}px;--safe-h:${cfg.height - cfg.safe.top - cfg.safe.bottom}px}`;
const page = `<!doctype html>
<!-- GENERATED by tools/build_v3.mjs from research/script_v3.json, research/data.csv, research/umk_examples.csv and voice/samples/v3/${cfg.voice.variant}. Do not hand-edit. -->
<html lang="id" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${cfg.width}, height=${cfg.height}" />
<title>UMP vs gaji asli (v3)</title>
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
<div class="clip overlay brand" id="brand" data-start="0" data-duration="${TOTAL}" data-track-index="6">${cfg.brand}</div>
<audio id="vo" src="assets/v3/vo.mp3" data-start="0" data-duration="${VO_SECONDS}" data-volume="1" preload="auto"></audio>
</div>
<script type="application/json" id="video-data">${fmtJSON({ total: TOTAL, fps: cfg.fps, ops: ops.filter((o) => o.kind !== "noop") })}</script>
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

writeFileSync(P("index_v3.html"), page, "utf8");
mkdirSync(P("build/v3"), { recursive: true });
const timeline = {
  version: "v3", voice_variant: cfg.voice.variant, total: TOTAL, fps: cfg.fps,
  cues: Object.fromEntries(Object.entries(T).map(([k, v]) => [k, r3(v)])),
  beats: beats.map((b) => ({ id: b.id, framing: b.framing, start: b.start, end: b.end, hero: b.hero })),
  numbers, ops: ops.filter((o) => o.kind !== "noop"),
  scenes: scenes.map((s, i) => ({ id: s.id, start: r3(sceneStart[i]), vo: s.vo_text, on_screen: s.on_screen_text, cue_words: s.cue_words })),
  words: totalWords, vo_seconds: VO_SECONDS, last_word_end: lastWordEnd,
  gates: { hook_span: r3(hookSpan), jabar_span: r3(jabarSpan), close_span: r3(closeSpan), total: TOTAL },
  safe: cfg.safe, hero_band: cfg.hero_band, sources_line: cfg.sources_line,
  facts: { below: below.map((p) => p.name), below_count: below.length, lowest_ratio: byRatio[0].name, highest_ratio: byRatio.at(-1).name, lowest_ump: lowestUMP.name, highest_ump: highestUMP.name, umk_karawang: umk.Karawang },
  pins: { jakarta: JAK_PIN, aceh: ACEH_PIN, karawang: KW },
  sids: { jakarta: SID.jak, jabar: SID.jb, aceh: SID.ac },
  karawang_note: "approximate label pin, not a district border",
  geometry: { FR, VB_NAT, VB_JAVA, VB_SUM, VB_JABAR, VB_KW },
};
writeFileSync(P("build/v3/timeline.json"), JSON.stringify(timeline, null, 1) + "\n", "utf8");
console.log(`build_v3: index_v3.html written (voice ${cfg.voice.variant}), total ${TOTAL}s, hook ${hookSpan.toFixed(2)}s, Jawa Barat section ${jabarSpan.toFixed(2)}s, close ${closeSpan.toFixed(2)}s, ${beats.length} beats, ${capGroups.length} caption chunks, ${ops.length} ops`);
for (const b of beats) console.log(`  ${b.id.padEnd(3)} ${b.framing.padEnd(14)} ${b.start.toFixed(3).padStart(7)} -> ${b.end.toFixed(3).padStart(7)}`);
