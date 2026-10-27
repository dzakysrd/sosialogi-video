// Builds video-01 v2: index.html (composition) and build/v2/timeline.json.
// Inputs: research/script_v2.json, research/data.csv, research/umk_examples.csv, assets/v2/{words,sentences}.json,
// assets/map/indonesia-34.svg. Every beat starts and ends on a word cue (except the 2.5 s hook card, a fixed length).
// Every number on screen is derived from the data and spoken at the cue that reveals it. Run: node tools/build_v2.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { makeCue } from "./lib/cue.mjs";
import { fmtShort, spokenShort, spokenInt } from "./lib/nums.mjs";
import { parseCsv } from "./lib/csv.mjs";
import { getGeometry } from "./geometry.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (rel) => resolve(ROOT, rel);
const cfg = JSON.parse(readFileSync(P("video.v2.config.json"), "utf8"));
const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
const dataRows = parseCsv(readFileSync(P(cfg.inputs.data), "utf8"));
const umkRows = parseCsv(readFileSync(P(cfg.inputs.umk), "utf8"));
const words = JSON.parse(readFileSync(P(cfg.inputs.words), "utf8"));
const sentences = JSON.parse(readFileSync(P(cfg.inputs.sentences), "utf8"));
const svgRaw = readFileSync(P(cfg.inputs.map), "utf8").replace(/<\?xml[^>]*>\s*/, "");
const { cue, cueSpan } = makeCue(words);
const fail = (m) => { throw new Error("build_v2: " + m); };
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---------- script checks ----------
const scenes = script.scenes;
const S = Object.fromEntries(scenes.map((s) => [s.id, s]));
const wordCounts = scenes.map((s) => s.vo_text.split(/\s+/).filter(Boolean).length);
const allVo = scenes.map((s) => s.vo_text).join(" ");
const totalWords = wordCounts.reduce((a, b) => a + b, 0);
if (totalWords !== words.length) fail(`word count ${words.length} != script ${totalWords}`);
if (totalWords < 105 || totalWords > 130) fail(`script has ${totalWords} words, target 105-130`);
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
// planner claims that the script words depend on
if (below.length !== 24) fail(`below-UMP count ${below.length}, script says 24`);
if (byRatio[0].name !== "Aceh") fail(`lowest ratio is ${byRatio[0].name}, script says Aceh`);
if (byRatio.at(-1).name !== "Jawa Barat") fail(`highest ratio is ${byRatio.at(-1).name}, script says Jawa Barat`);
if (lowestUMP.name !== "Jawa Barat") fail(`lowest UMP is ${lowestUMP.name}, script says Jawa Barat`);
if (!(prov["DKI Jakarta"].avg < prov["DKI Jakarta"].ump) || !/Bahkan di Jakarta/.test(S.s1_hook.vo_text)) fail("Jakarta claim");
if (!/dua puluh empat dari tiga puluh delapan/.test(S.s3_nasional.vo_text)) fail("s3 count wording");
if (!/Yang paling jauh di bawah UMP itu Aceh/.test(S.s4_aceh.vo_text)) fail("s4 Aceh wording");
if (!/UMP-nya terendah se-Indonesia/.test(S.s5_jabar.vo_text)) fail("s5 Jawa Barat wording");
if (!(umk.Karawang > prov["Jawa Barat"].ump)) fail("Karawang UMK should be above the Jabar UMP");
if (!/Di Karawang, UMK-nya lima koma delapan sembilan juta/.test(S.s5_jabar.vo_text)) fail("s5 Karawang wording");
if (!/UMK-nya lima koma delapan sembilan juta/.test(S.s5_jabar.vo_text) || spokenShort(fmtShort(umk.Karawang)) !== "lima koma delapan sembilan juta") fail("Karawang spoken value");

// ---------- map ----------
const geo = getGeometry(P(cfg.inputs.map), P("build"));
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

const FR = {
  nat: { left: 40, top: 820, w: 1000, h: 380 },
  java: { left: 40, top: 560, w: 1000, h: 380 },
  sumatra: { left: 240, top: 470, w: 600, h: 430 },
  jabar: { left: 40, top: 520, w: 1000, h: 500 },
};
const JAVA = ["id-bt", "id-jk", "id-jb", "id-jt", "id-yo", "id-ji"];
const SUMATRA = ["id-ac", "id-su", "id-sb", "id-ri", "id-ja", "id-ss", "id-be", "id-la"];
const jv = bb(JAVA), sv = bb(SUMATRA);
const SID = { jak: idByName["DKI Jakarta"], jb: idByName["Jawa Barat"], ac: idByName["Aceh"] };
const VB_NAT = { x: VB.x, w: VB.w, h: FR.nat.h * VB.w / FR.nat.w, y: VB.y + VB.h / 2 - (FR.nat.h * VB.w / FR.nat.w) / 2 };
const sJava = FR.java.w / (jv.w * 1.15);
const VB_JAVA = vbAt(FR.java, jv.cx, jv.cy, sJava);
const sSum = Math.min(FR.sumatra.w / (sv.w * 1.25), FR.sumatra.h / (sv.h * 1.08));
const VB_SUM = vbAt(FR.sumatra, sv.cx, sv.cy, sSum);
const sJabar = (0.6 * FR.jabar.w) / geo.provs[SID.jb].w; // Jawa Barat fills 60% of the frame width
const jbC = centre(SID.jb);
const VB_JABAR = vbAt(FR.jabar, jbC.x, jbC.y, sJabar);

// ---------- timing: every beat boundary is a word cue ----------
const T = {};
const C = (name, word, after) => { const sp = cueSpan(word, after); T[name] = sp.time; return sp; };
const sceneFirst = ["Bahkan", "Tahun", "Secara", "Yang", "Tapi", "Ini"];
const wordStartIdx = []; { let acc = 0; for (const c of wordCounts) { wordStartIdx.push(acc); acc += c; } }
const sceneStart = scenes.map((s, i) => {
  const after = i === 0 ? -1 : words[wordStartIdx[i - 1] + wordCounts[i - 1] - 1].end;
  return cue(sceneFirst[i], after);
});
sceneStart.forEach((t, i) => { if (Math.abs(t - words[wordStartIdx[i]].start) > 1e-9) fail(`scene ${i} cue != first word`); });
T.hookEnd = cfg.hook_card_s;                                   // fixed 2.5 s claim card
C("tahun", "Tahun", T.hookEnd);
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
C("tapi", "Tapi", T.ac_avg);
C("terendah", "terendah", T.tapi);
C("jb_ump", spokenShort(fmtShort(prov["Jawa Barat"].ump)), T.terendah);
C("jb_avg", spokenShort(fmtShort(prov["Jawa Barat"].avg)), T.jb_ump);
C("batas", "UMP itu batas provinsi", T.jb_avg);
C("umk", "UMK", T.batas);
C("karawang", "Karawang", T.umk);
C("kw_val", spokenShort(fmtShort(umk.Karawang)), T.karawang);
C("ini", "Ini", T.kw_val);
C("follow", "Follow", T.ini);
C("cta", "perusahaan", T.ini);   // the CTA pill appears on the caveat, so it holds about 2.5 s to the end
const lastWordEnd = words[words.length - 1].end;
const TOTAL = r3(lastWordEnd + cfg.tail_s);
const B = {
  b1: [0, T.hookEnd], b2: [T.hookEnd, T.jak_ump], b3: [T.jak_ump, T.secara], b4: [T.secara, T.yang],
  b5: [T.yang, T.tapi], b6: [T.tapi, T.batas], b7: [T.batas, T.ini], b8: [T.ini, TOTAL],
};
if (B.b1[1] > cfg.hook_card_s + 1e-9) fail("hook card longer than 2.5 s");
if (TOTAL - B.b8[0] > cfg.close_max_s + 1e-9) fail(`close ${(TOTAL - B.b8[0]).toFixed(2)} s, limit ${cfg.close_max_s}`);
if (TOTAL > 60) fail(`total ${TOTAL} s exceeds 60 s`);
for (const k of Object.keys(T)) if (!Number.isFinite(T[k])) fail(`cue ${k} unresolved`);
const VO_SECONDS = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", P(cfg.inputs.vo)], { encoding: "utf8" }).trim());

// ---------- output registries ----------
const ops = [];
const numbers = [];
const beats = [];
const op = (t, sel, kind, extra = {}) => ops.push({ t: r3(t), sel, kind, ...extra });
const set = (t, sel, vars) => op(t, sel, "set", { vars });
const show = (t, sel, d = 0.15) => op(t, sel, "fromTo", { from: { autoAlpha: 0 }, vars: { autoAlpha: 1 }, d });
const slam = (t, sel) => op(t, sel, "fromTo", { from: { autoAlpha: 0, y: 16 }, vars: { autoAlpha: 1, y: 0 }, d: 0.28, ease: "back.out(2)" });  // settles in place: the box never leaves the safe zone
const widthTo = (t, sel, from, to, d = 0.9) => op(t, sel, "fromTo", { from: { width: from }, vars: { width: to }, d, ease: "power3.out" });
const beatVis = (id, [a, b]) => { set(a, `#${id}`, { autoAlpha: 1 }); set(b, `#${id}`, { autoAlpha: 0 }); };
const num = (text, spoken, t, scene, derive) => numbers.push({ key: text.match(/\d+(?:,\d+)?/g).join(""), text, spoken, t: r3(t), scene, derive });
const beat = (id, framing, [a, b], html, hero) => beats.push({ id, framing, start: r3(a), end: r3(b), hero: { from: r3(a), to: r3(b), el: hero }, html });
const pin = (id, x, y, extra = "") => `<div class="dot" id="${id}" style="left:${r3(x)}px;top:${r3(y)}px;${extra}"></div>`;

// Map frame: lit/dim/halo/hatch. Shape paths are `${id}-${shapeId}`.
function mapFrame(id, fr, vb, { dim = [], hatch = false, cls = "", halo = null } = {}) {
  const defs = hatch ? `<defs><pattern id="${id}-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#ff6b35"/><rect width="4.5" height="9" fill="#2dd4bf"/></pattern></defs>` : "";
  const paths = shapes.map((s) => `<path id="${id}-${s.id}" class="prov${dim.includes(s.id) ? " dim" : ""}" d="${s.d}"/>`).join("\n");
  const ring = halo ? `<path id="${id}-halo-${halo}" class="halo" d="${shapes.find((x) => x.id === halo).d}"/>` : "";
  return `<div class="map-frame ${cls}" id="${id}" style="left:${fr.left}px;top:${fr.top}px;width:${fr.w}px;height:${fr.h}px"><svg viewBox="${r3(vb.x)} ${r3(vb.y)} ${r3(vb.w)} ${r3(vb.h)}" preserveAspectRatio="xMidYMid meet">${defs}<g>${paths}${ring}</g></svg></div>`;
}
const litShape = (id, sid, t) => {  // lit shape: accent fill with glow
  set(t, `#${id}-${sid}`, { opacity: 1, fill: "#ffd23f", filter: "drop-shadow(0 0 10px rgba(255,210,63,0.9))" });
};
const others = (sid) => shapes.map((s) => s.id).filter((x) => x !== sid);
const pulse = (t, id, sid) => op(t, `#${id}-halo-${sid}`, "fromTo", { from: { opacity: 0.2 }, vars: { opacity: 0.9, yoyo: true, repeat: 3 }, d: 0.4 });

// ---------- B1 hook: the claim is the first frame (no title card) ----------
beat("B1", "claim", B.b1, `
<section class="clip beat" id="B1" data-start="0" data-duration="${r3(B.b1[1])}" data-track-index="1">
  <div class="claim" style="top:560px">
    <div class="claim-k">Bahkan di</div>
    <div class="claim-jk">Jakarta</div>
    <div class="claim-sub">rata-rata gaji buruh</div>
    <div class="claim-hot">di bawah UMP</div>
  </div>
</section>`, "claim-block");
beatVis("B1", B.b1);

// ---------- B2 locate: zoom on Java, DKI Jakarta pinned ----------
{
  const id = "B2";
  const c = toPage(FR.java, VB_JAVA, centre(SID.jak).x, centre(SID.jak).y);
  const leadTop = c.y + 22, labelTop = 1000;
  const dimAll = others(SID.jak);
  beat(id, "locate-java", B.b2, `
<section class="clip beat" id="${id}" data-start="${r3(B.b2[0])}" data-duration="${r3(B.b2[1] - B.b2[0])}" data-track-index="1">
  <div class="headline" style="top:380px">UMP <span id="B2-year" style="visibility:hidden">2026</span></div>
  ${mapFrame("B2-map", FR.java, VB_JAVA, { dim: dimAll, halo: SID.jak })}
  ${pin("B2-dot", c.x, c.y)}
  <div class="leader" id="B2-lead" style="left:${r3(c.x - 1.5)}px;top:${r3(leadTop)}px;height:${r3(labelTop - leadTop)}px"></div>
  <div class="lbl" id="B2-lbl" style="left:65px;top:${labelTop}px"><div class="ln">DKI Jakarta</div></div>
</section>`, "B2-map");
  beatVis(id, B.b2);
  litShape("B2-map", SID.jak, B.b2[0]);
  pulse(B.b2[0], "B2-map", SID.jak);
  show(B.b2[0], "#B2-dot"); show(B.b2[0], "#B2-lead"); show(B.b2[0], "#B2-lbl");
  show(T.year, "#B2-year", 0.12);
  num("2026", spokenInt("2026"), T.year, "s2_jakarta", "year");
}

// ---------- B3 Jakarta bars: UMP vs average, values slam in on their cues ----------
{
  const id = "B3", j = prov["DKI Jakarta"];
  const w2 = Math.round(875 * j.avg / j.ump);
  beat(id, "bars", B.b3, `
<section class="clip beat" id="${id}" data-start="${r3(B.b3[0])}" data-duration="${r3(B.b3[1] - B.b3[0])}" data-track-index="1">
  <div class="kicker" style="top:470px">DKI Jakarta</div>
  <div class="brow" id="B3-r1" style="top:600px"><div class="bname">UMP (batas bawah)</div><div class="bval" id="B3-v1" style="visibility:hidden">${fmtShort(j.ump)}</div></div>
  <div class="btrack" id="B3-t1" style="top:730px"><div class="bfill fill-accent" id="B3-f1"></div></div>
  <div class="brow" id="B3-r2" style="top:900px"><div class="bname">Rata-rata gaji bersih buruh</div><div class="bval" id="B3-v2" style="visibility:hidden">${fmtShort(j.avg)}</div></div>
  <div class="btrack" id="B3-t2" style="top:1030px"><div class="bfill fill-bad" id="B3-f2"></div></div>
</section>`, "B3-t1");
  beatVis(id, B.b3);
  show(B.b3[0], "#B3-r1", 0.1); show(B.b3[0], "#B3-r2", 0.1); show(B.b3[0], "#B3-t1", 0.1); show(B.b3[0], "#B3-t2", 0.1);
  widthTo(T.jak_ump, "#B3-f1", 0, 875);  slam(T.jak_ump, "#B3-v1");
  widthTo(T.jak_avg, "#B3-f2", 0, w2);   slam(T.jak_avg, "#B3-v2");
  num(fmtShort(j.ump), spokenShort(fmtShort(j.ump)), T.jak_ump, "s2_jakarta", "ump:DKI Jakarta");
  num(fmtShort(j.avg), spokenShort(fmtShort(j.avg)), T.jak_avg, "s2_jakarta", "avg:DKI Jakarta");
}

// ---------- B4 national: 24 of 38 provinces turn red, province by province ----------
{
  const id = "B4";
  beat(id, "full-map", B.b4, `
<section class="clip beat" id="${id}" data-start="${r3(B.b4[0])}" data-duration="${r3(B.b4[1] - B.b4[0])}" data-track-index="1">
  <div class="kicker" style="top:380px">Provinsi di bawah UMP</div>
  <div class="big" id="B4-n24" style="top:450px">24</div>
  <div class="bigmid" id="B4-dari" style="top:696px;font-size:92px;visibility:hidden">dari 38 provinsi</div>
  ${mapFrame("B4-map", FR.nat, VB_NAT, { hatch: true })}
  <div class="hatchnote" id="B4-hnote">Papua: tiga dari empat prov. di bawah UMP</div>
  <div class="legend" id="B4-leg"><span class="chip c-bad"></span>di bawah UMP<span class="chip c-good"></span>di atas UMP</div>
</section>`, "B4-map");
  beatVis(id, B.b4);
  slam(T.n24, "#B4-n24");
  show(T.n38, "#B4-dari", 0.2);
  num(String(below.length), spokenInt(String(below.length)), T.n24, "s3_nasional", "count_below");
  num(String(provList.length), spokenInt(String(provList.length)), T.n38, "s3_nasional", "count_total");
  // sweep: red (all below) and hatch (mixed) shapes in order of their lowest ratio, then teal (all above)
  const sids = Object.keys(groups);
  const minRatio = (sid) => Math.min(...groups[sid].map(ratio));
  const reds = sids.filter((s) => shapeStatus(s) !== "teal").sort((a, b) => minRatio(a) - minRatio(b));
  const teals = sids.filter((s) => shapeStatus(s) === "teal").sort((a, b) => minRatio(a) - minRatio(b));
  const tStart = 13.55, step = (15.45 - tStart) / Math.max(1, reds.length - 1);
  reds.forEach((sid, i) => {
    const t = tStart + i * step;
    const fill = shapeStatus(sid) === "red" ? "#ff6b35" : `url(#${id}-map-hatch)`;
    set(t, `#${id}-map-${sid}`, { fill, opacity: 1 });
  });
  teals.forEach((sid, i) => set(15.7 + i * 0.05, `#${id}-map-${sid}`, { fill: "#2dd4bf", opacity: 1 }));
  show(15.7, "#B4-leg", 0.2);
  show(15.7, "#B4-hnote", 0.2);
}

// ---------- B5 Aceh locator (Sumatra, 600 px frame) and bars ----------
{
  const id = "B5", a = prov.Aceh;
  const ac = centre(SID.ac);
  const pinP = toPage(FR.sumatra, VB_SUM, ac.x, ac.y);
  const w2 = Math.round(875 * a.avg / a.ump);
  const dimAll = others(SID.ac);
  beat(id, "locator-bars", B.b5, `
<section class="clip beat" id="${id}" data-start="${r3(B.b5[0])}" data-duration="${r3(B.b5[1] - B.b5[0])}" data-track-index="1">
  <div class="headline" id="B5-title" style="top:340px;font-size:120px">Aceh</div>
  ${mapFrame("B5-map", FR.sumatra, VB_SUM, { dim: dimAll, halo: SID.ac })}
  ${pin("B5-dot", pinP.x, pinP.y)}
  <div class="brow compact" id="B5-r1" style="top:930px"><div class="bname">UMP (batas bawah)</div><div class="bval" id="B5-v1" style="visibility:hidden">${fmtShort(a.ump)}</div></div>
  <div class="btrack compact" id="B5-t1" style="top:1010px"><div class="bfill fill-accent" id="B5-f1"></div></div>
  <div class="brow compact" id="B5-r2" style="top:1100px"><div class="bname">Rata-rata gaji bersih buruh</div><div class="bval" id="B5-v2" style="visibility:hidden">${fmtShort(a.avg)}</div></div>
  <div class="btrack compact" id="B5-t2" style="top:1180px"><div class="bfill fill-bad" id="B5-f2"></div></div>
</section>`, "B5-map");
  beatVis(id, B.b5);
  show(B.b5[0], "#B5-r1", 0.1); show(B.b5[0], "#B5-r2", 0.1); show(B.b5[0], "#B5-t1", 0.1); show(B.b5[0], "#B5-t2", 0.1);
  litShape("B5-map", SID.ac, T.aceh);
  pulse(T.aceh, "B5-map", SID.ac);
  show(T.aceh, "#B5-dot");
  widthTo(T.ac_ump, "#B5-f1", 0, 875); slam(T.ac_ump, "#B5-v1");
  widthTo(T.ac_avg, "#B5-f2", 0, w2); slam(T.ac_avg, "#B5-v2");
  num(fmtShort(a.ump), spokenShort(fmtShort(a.ump)), T.ac_ump, "s4_aceh", "ump:Aceh");
  num(fmtShort(a.avg), spokenShort(fmtShort(a.avg)), T.ac_avg, "s4_aceh", "avg:Aceh");
}

// ---------- B6 Jawa Barat zoom: lowest UMP, average above it ----------
{
  const id = "B6", jb = prov["Jawa Barat"];
  const c = toPage(FR.jabar, VB_JABAR, jbC.x, jbC.y);
  const dimAll = others(SID.jb);
  beat(id, "zoom-province", B.b6, `
<section class="clip beat" id="${id}" data-start="${r3(B.b6[0])}" data-duration="${r3(B.b6[1] - B.b6[0])}" data-track-index="1">
  <div class="headline" style="top:340px">Jawa Barat</div>
  <div class="sub" id="B6-sub" style="top:462px">UMP terendah se-Indonesia</div>
  ${mapFrame("B6-map", FR.jabar, VB_JABAR, { dim: dimAll, halo: SID.jb })}
  ${pin("B6-dot", c.x, c.y)}
  <div class="tile t-acc" id="B6-t1" style="left:65px;top:1050px"><div class="tl">UMP (batas bawah)</div><div class="tv">${fmtShort(jb.ump)}</div></div>
  <div class="tile" id="B6-t2" style="left:520px;top:1050px"><div class="tl">Rata-rata gaji</div><div class="tv">${fmtShort(jb.avg)}</div></div>
</section>`, "B6-map");
  beatVis(id, B.b6);
  litShape("B6-map", SID.jb, B.b6[0]);
  pulse(B.b6[0], "B6-map", SID.jb);
  show(B.b6[0], "#B6-dot");
  show(T.terendah, "#B6-sub", 0.2);
  show(T.jb_ump, "#B6-t1", 0.12);
  show(T.jb_avg, "#B6-t2", 0.12);
  num(fmtShort(jb.ump), spokenShort(fmtShort(jb.ump)), T.jb_ump, "s5_jabar", "ump:Jawa Barat");
  num(fmtShort(jb.avg), spokenShort(fmtShort(jb.avg)), T.jb_avg, "s5_jabar", "avg:Jawa Barat");
}

// ---------- B7 explainer: UMP is the provincial floor; each kabupaten/kota has its own UMK ----------
{
  const id = "B7", kw = umk.Karawang;
  beat(id, "explainer", B.b7, `
<section class="clip beat" id="${id}" data-start="${r3(B.b7[0])}" data-duration="${r3(B.b7[1] - B.b7[0])}" data-track-index="1">
  <div class="explain-jk" id="B7-jk" style="position:absolute;left:65px;width:875px;text-align:center;top:380px;font-size:180px;visibility:hidden">UMP</div>
  <div class="explain-sub" id="B7-sub" style="position:absolute;left:65px;width:875px;text-align:center;top:570px;visibility:hidden">batas provinsi</div>
  <div class="card" id="B7-card" style="top:690px;font-size:56px">Tiap kabupaten dan kota punya UMK sendiri</div>
  <div class="kicker2" id="B7-kw" style="top:960px;color:var(--accent)">UMK Karawang</div>
  <div class="big" id="B7-val" style="top:1030px;font-size:190px">${fmtShort(kw)}</div>
</section>`, "B7-card");
  beatVis(id, B.b7);
  show(B.b7[0], "#B7-jk", 0.15); show(B.b7[0], "#B7-sub", 0.15);
  show(T.umk, "#B7-card", 0.2);
  show(T.karawang, "#B7-kw", 0.15);
  slam(T.kw_val, "#B7-val");
  num(fmtShort(kw), spokenShort(fmtShort(kw)), T.kw_val, "s5_jabar", "umk:Karawang");
}

// ---------- B8 close: caveat (about 4 s) and CTA; the hold is the tail ----------
{
  const id = "B8";
  beat(id, "close-card", B.b8, `
<section class="clip beat" id="${id}" data-start="${r3(B.b8[0])}" data-duration="${r3(B.b8[1] - B.b8[0])}" data-track-index="1">
  <div class="card" id="B8-card" style="top:500px">Ini rata-rata gaji bersih buruh, bukan bukti perusahaan tidak patuh.</div>
  <div class="pill" id="B8-cta" style="top:940px"><span>Follow ${cfg.brand}</span></div>
</section>`, "B8-card");
  beatVis(id, B.b8);
  show(B.b8[0], "#B8-card", 0.2);
  slam(T.cta, "#B8-cta");
}

// ---------- captions (word-synced, max two lines per group) ----------
const sentStartIdx = new Set(sentences.map((s) => words.findIndex((w) => Math.abs(w.start - s.start) < 1e-6)).filter((i) => i >= 0));
const capGroups = [];
{
  let cur = [];
  const chars = (g) => g.map((w) => w.text).join(" ").length;
  words.forEach((w, i) => {
    if (cur.length && (sentStartIdx.has(i) || chars(cur) + 1 + w.text.length > 44)) { capGroups.push(cur); cur = []; }
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
  return `<div class="clip cap" id="cap-${gi}" data-start="${s.toFixed(3)}" data-duration="${(e - s).toFixed(3)}" data-track-index="5">${spans}</div>`;
}).join("\n");

// ---------- persistent overlays ----------
set(0, "#brand", { autoAlpha: 0 });
show(0.6, "#brand", 0.3);
// timed overlays keep visibility from data-start, so the credit is hidden explicitly until the Jawa Barat beat
set(0, "#srccredit", { autoAlpha: 0 });
show(T.tapi, "#srccredit", 0.3);

// ---------- page ----------
const fmtJSON = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const beatsHTML = beats.map((b) => b.html).join("\n");
const css = readFileSync(P("components/video_v2.css"), "utf8");
const runtime = readFileSync(P("components/video.js"), "utf8");
const cssVars = `:root{--safe-top:${cfg.safe.top}px;--safe-bottom:${cfg.safe.bottom}px;--safe-left:${cfg.safe.left}px;--safe-right:${cfg.safe.right}px;--safe-w:${cfg.width - cfg.safe.left - cfg.safe.right}px;--safe-h:${cfg.height - cfg.safe.top - cfg.safe.bottom}px}`;
const page = `<!doctype html>
<!-- GENERATED by tools/build_v2.mjs from research/script_v2.json, research/data.csv, research/umk_examples.csv and assets/v2. Do not hand-edit. -->
<html lang="id" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${cfg.width}, height=${cfg.height}" />
<title>UMP vs gaji asli (v2)</title>
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
<div class="clip overlay mapcredit cite" id="mapcredit" data-start="0" data-duration="${TOTAL}" data-track-index="6">${cfg.map_credit}</div>
<div class="srccredit cite" id="srccredit" data-start="0" data-duration="${TOTAL}" data-track-index="6">${cfg.source_credit}</div>
<audio id="vo" src="${cfg.inputs.vo}" data-start="0" data-duration="${VO_SECONDS}" data-volume="1" preload="auto"></audio>
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

mkdirSync(P("build/v2"), { recursive: true });
writeFileSync(P("index.html"), page, "utf8");
const timeline = {
  version: "v2", total: TOTAL, fps: cfg.fps, cues: Object.fromEntries(Object.entries(T).map(([k, v]) => [k, r3(v)])),
  beats: beats.map((b) => ({ id: b.id, framing: b.framing, start: b.start, end: b.end, hero: b.hero })),
  numbers, ops: ops.filter((o) => o.kind !== "noop"),
  scenes: scenes.map((s, i) => ({ id: s.id, start: r3(sceneStart[i]), vo: s.vo_text, on_screen: s.on_screen_text, cue_words: s.cue_words })),
  words: wordCounts.reduce((a, b) => a + b, 0), vo_seconds: VO_SECONDS, last_word_end: lastWordEnd,
  safe: cfg.safe, hero_band: cfg.hero_band, cfg_badge: cfg.badge,
  facts: { below: below.map((p) => p.name), below_count: below.length, lowest_ratio: byRatio[0].name, highest_ratio: byRatio.at(-1).name, lowest_ump: lowestUMP.name, umk_karawang: umk.Karawang },
  overlays: { brand: cfg.brand, map_credit: cfg.map_credit, source_credit: cfg.source_credit },
  inputs_sha256: Object.fromEntries(Object.entries(cfg.inputs).map(([k, rel]) => [k, createHash("sha256").update(readFileSync(P(rel))).digest("hex").slice(0, 12)])),
  geometry: { FR, VB_NAT, VB_JAVA, VB_SUM, VB_JABAR },
};
writeFileSync(P("build/v2/timeline.json"), JSON.stringify(timeline, null, 1) + "\n", "utf8");
console.log(`build_v2: index.html written, total ${TOTAL}s, ${beats.length} beats, ${capGroups.length} caption groups, ${ops.length} ops`);
for (const b of beats) console.log(`  ${b.id.padEnd(3)} ${b.framing.padEnd(14)} ${b.start.toFixed(3).padStart(7)} -> ${b.end.toFixed(3).padStart(7)}`);
