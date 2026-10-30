// Lint for video-02 (PRD-14). Exits non-zero on any failure; prints every failure and a summary.
// Run after the build: `node tools/lint.mjs` (npm run lint).
// Inputs: video.config.json, the script (research/video-02/script_v1.json), scenes.json, assets/vo/words.json (the take, copied
// by the build), build/timeline.json and index.html.
// Static: the take against the script; the numbers registry (each spoken at its cue, repeats point to an earlier entry); the
// gates; caption chunks (limits, number runs whole, every spoken word in one caption word, captions in step with index.html);
// dead air.
// Browser probe: headless Chrome opens index.html (a file:// URL) and is driven over the DevTools protocol; it seeks
// window.__timelines.main at each sample time. Nothing is written to the repo.
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { phraseTokens } from "./lib/cue.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (rel) => resolve(ROOT, rel);
const r3 = (x) => Math.round(x * 1000) / 1000;
const fx = (x) => Math.round(x);
const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const stripScriptPunct = (s) => String(s).replace(/[.,:;!?]+$/u, ""); // the build appends the script's punctuation to a caption word
const TOKEN_RE = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g; // PRD-14 token pattern
const tokensOf = (s) => String(s ?? "").match(TOKEN_RE) ?? [];
const CUE_TOL = 0.001;
const DIGIT_LEAD = 0.05; // a digit may show this long before its cue (sample rounding)
const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "x"];

const failures = []; // { letter, msg }
const oks = {};      // letter -> [text], printed when the letter has no failure
const fail = (letter, msg) => failures.push({ letter, msg });
const ok = (letter, text) => { (oks[letter] ??= []).push(text); };

// Probe failures that repeat over many samples are reported once, with their first and last time and the count.
const groups = new Map();
const note = (letter, key, t, msg) => {
  const g = groups.get(key);
  if (g) { g.count++; g.last = t; } else groups.set(key, { letter, msg, first: t, last: t, count: 1 });
};
function flushGroups() {
  for (const g of groups.values()) {
    const span = g.count > 1 ? `; last at t=${g.last}; ${g.count} samples` : "";
    fail(g.letter, `${g.msg} [first at t=${g.first}${span}]`);
  }
}

// ---------- the browser probe: runs inside the page (serialised with toString) ----------
function PROBE(times) {
  var tl = window.__timelines && window.__timelines["main"];
  if (!tl) return { error: 'window.__timelines["main"] is missing' };
  function effOp(e) {
    var o = 1;
    for (var a = e; a && a.nodeType === 1; a = a.parentElement) {
      var cs = getComputedStyle(a);
      if (cs.display === "none") return 0;
      o *= parseFloat(cs.opacity);
    }
    return o;
  }
  function visible(e) { return getComputedStyle(e).visibility === "visible" && effOp(e) > 0.001; }
  function textNodes(e) {
    var out = [];
    for (var i = 0; i < e.childNodes.length; i++) {
      var n = e.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim()) out.push(n);
    }
    return out;
  }
  function rectsOf(n) {
    var r = document.createRange();
    r.selectNodeContents(n);
    var rs = r.getClientRects(), out = [];
    for (var i = 0; i < rs.length; i++) if (rs[i].width > 0 && rs[i].height > 0) out.push({ l: rs[i].left, t: rs[i].top, r: rs[i].right, b: rs[i].bottom });
    return out;
  }
  // Layout box of a text node: horizontally its own extent (so nowrap overflow counts); vertically, in a block element, the
  // element's line boxes (the content area of a large display font is taller than its line box).
  function boxesOf(n) {
    var p = n.parentElement;
    var rs = rectsOf(n);
    if (!p || getComputedStyle(p).display !== "block") return rs;
    var pb = p.getBoundingClientRect();
    return rs.map(function (q) { return { l: q.l, r: q.r, t: pb.top, b: pb.bottom }; });
  }
  function union(rs) {
    var u = { l: 1e9, t: 1e9, r: -1e9, b: -1e9 };
    rs.forEach(function (q) { u.l = Math.min(u.l, q.l); u.t = Math.min(u.t, q.t); u.r = Math.max(u.r, q.r); u.b = Math.max(u.b, q.b); });
    return u;
  }
  function lineCount(rs) {
    var tops = rs.map(function (q) { return q.t; }).sort(function (a, b) { return a - b; });
    var n = 0, last = -1e9;
    tops.forEach(function (y) { if (y - last > 4) { n++; last = y; } });
    return n;
  }
  var out = { fonts: [], samples: [] };
  document.fonts.forEach(function (f) { out.fonts.push(f.family + " " + f.weight + " " + f.status); });
  times.forEach(function (t) {
    tl.seek(t, false);
    var rec = { t: t, blocks: [], cites: [], digits: [] };
    document.querySelectorAll("[data-tb]").forEach(function (b) {
      if (!visible(b)) return;
      var name = b.getAttribute("data-tb");
      var entry = {
        name: name,
        cap: name === "caption",
        txt: (b.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
        allowOverlap: b.hasAttribute("data-layout-allow-overlap") && effOp(b) < 0.999
      };
      if (entry.cap) {
        var wr = [];
        var spans = b.querySelectorAll(".w");
        spans.forEach(function (w) { textNodes(w).forEach(function (n) { wr = wr.concat(rectsOf(n)); }); });
        var cr = b.getBoundingClientRect();
        entry.box = { l: cr.left, t: cr.top, r: cr.right, b: cr.bottom };
        entry.lines = lineCount(wr); // every word, hidden number runs included: they keep their space
        entry.words = spans.length;
      } else {
        var rs = [];
        b.querySelectorAll("*").forEach(function (e) {
          if (textNodes(e).length === 0 || !visible(e)) return;
          textNodes(e).forEach(function (n) { rs = rs.concat(boxesOf(n)); });
        });
        if (!rs.length) return;
        entry.box = union(rs);
      }
      rec.blocks.push(entry);
    });
    document.querySelectorAll(".cite").forEach(function (c) {
      if (!visible(c)) return;
      var rs = [];
      textNodes(c).forEach(function (n) { rs = rs.concat(rectsOf(n)); });
      if (!rs.length) return;
      rec.cites.push({ fs: parseFloat(getComputedStyle(c).fontSize), lines: lineCount(rs) });
    });
    document.querySelectorAll("#root *").forEach(function (e) {
      var ns = textNodes(e).filter(function (n) { return /\d/.test(n.textContent); });
      if (!ns.length || !visible(e)) return;
      var where = (e.id ? "#" + e.id : e.tagName.toLowerCase()) + (e.className && typeof e.className === "string" ? "." + e.className.trim().replace(/\s+/g, ".") : "");
      var cite = !!e.closest(".cite");
      ns.forEach(function (n) { rec.digits.push({ txt: n.textContent.replace(/\s+/g, " ").trim(), where: where, cite: cite }); });
    });
    out.samples.push(rec);
  });
  return out;
}

// ---------- DevTools driver: one headless Chrome, one page, no files written ----------
function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const stack = ["/root/.cache/hyperframes/chrome"];
  while (stack.length) {
    const d = stack.pop();
    if (!existsSync(d)) continue;
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) stack.push(p);
      else if (n === "chrome-headless-shell") return p;
    }
  }
  return null;
}

async function runProbe(chromePath, url, times) {
  const userDir = mkdtempSync(join(tmpdir(), "video02-lint-"));
  const proc = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars",
    "--remote-debugging-port=0", `--user-data-dir=${userDir}`, "--window-size=1080,1920", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  let ws = null;
  try {
    const port = await new Promise((resolveP, reject) => {
      let buf = "";
      const timer = setTimeout(() => reject(new Error("no DevTools port after 30 s")), 30000);
      proc.stderr.on("data", (d) => {
        buf += d.toString();
        const m = buf.match(/DevTools listening on ws:\/\/[^:\s]+:(\d+)\//);
        if (m) { clearTimeout(timer); resolveP(Number(m[1])); }
      });
      proc.on("exit", (code) => { clearTimeout(timer); reject(new Error(`chrome exited with code ${code} before it opened DevTools`)); });
    });
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("no page target in Chrome");
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("websocket error")); });
    let seq = 0;
    const pending = new Map();
    const events = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message)); else res(msg.result);
      } else if (msg.method && events.has(msg.method)) {
        events.get(msg.method)(msg.params);
      }
    };
    const send = (method, params = {}) => new Promise((res, rej) => {
      const id = ++seq;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const once = (method, ms) => new Promise((res, rej) => {
      const timer = setTimeout(() => rej(new Error(`${method} timed out`)), ms);
      events.set(method, (p) => { clearTimeout(timer); events.delete(method); res(p); });
    });
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
    const loaded = once("Page.loadEventFired", 60000);
    await send("Page.navigate", { url });
    await loaded;
    await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true, returnByValue: true });
    const r = await send("Runtime.evaluate", { expression: `(${PROBE.toString()})(${JSON.stringify(times)})`, returnByValue: true });
    if (r.exceptionDetails) throw new Error("probe threw: " + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
    if (!r.result || r.result.value === undefined) throw new Error("probe returned no value");
    return r.result.value;
  } finally {
    try { ws?.close(); } catch { /* already closed */ }
    proc.kill("SIGKILL");
    rmSync(userDir, { recursive: true, force: true });
  }
}

// ---------- main ----------
async function main() {
  const cfg = JSON.parse(readFileSync(P("video.config.json"), "utf8"));
  const script = JSON.parse(readFileSync(P(cfg.inputs.script), "utf8"));
  const plan = JSON.parse(readFileSync(P(cfg.inputs.scenes), "utf8"));
  const words = JSON.parse(readFileSync(P("assets/vo/words.json"), "utf8"));
  const tl = JSON.parse(readFileSync(P("build/timeline.json"), "utf8"));
  const html = readFileSync(P("index.html"), "utf8");
  const reg = tl.numbers ?? [];
  const caps = tl.captions ?? [];

  // ---------- a. the take against the script ----------
  const S = script.scenes;
  const N = S.length;
  const sceneWords = S.map((s) => s.vo_text.split(/\s+/).filter(Boolean));
  const sceneRange = [];
  { let a = 0; for (const ws of sceneWords) { sceneRange.push([a, a + ws.length]); a += ws.length; } }
  const scriptTokens = sceneWords.flat();
  const sceneIdx = Object.fromEntries(S.map((s, i) => [s.id, i]));
  {
    if (words.length !== scriptTokens.length) fail("a", `words.json has ${words.length} words, the script has ${scriptTokens.length}`);
    const diff = [];
    for (let k = 0; k < Math.min(words.length, scriptTokens.length); k++) {
      if (norm(words[k].text) !== norm(scriptTokens[k])) diff.push(`${k} "${words[k].text}" != "${scriptTokens[k]}"`);
    }
    if (diff.length) fail("a", `${diff.length} word(s) differ from the script: ${diff.slice(0, 5).join("; ")}`);
    for (let k = 0; k + 1 < words.length; k++) {
      if (!(words[k + 1].start > words[k].start)) { fail("a", `word ${k + 1} does not start after word ${k}`); break; }
    }
    const digitScenes = S.filter((s) => /\d/.test(s.vo_text)).map((s) => s.id);
    if (digitScenes.length) fail("a", `digits in vo_text: ${digitScenes.join(", ")}`);
    const planIds = (plan.scenes ?? []).map((s) => s.id);
    if (JSON.stringify(planIds) !== JSON.stringify(S.map((s) => s.id))) fail("a", `scenes.json ids ${JSON.stringify(planIds)} != script ids ${JSON.stringify(S.map((s) => s.id))}`);
    ok("a", `words.json ${words.length} = script ${scriptTokens.length} words; every word text matches the script (letters and digits); no digit in any vo_text; scenes.json ids = script ids`);
  }

  // ---------- b. numbers registry ----------
  {
    const toks = [];
    words.forEach((w, k) => {
      for (const t of String(w.text).toLowerCase().split(/[^\p{L}\p{N}]+/u)) if (t) toks.push({ t, k, start: w.start });
    });
    // first occurrence of the phrase inside the scene, from its first word on
    const firstCue = (si, phrase) => {
      const [a, b] = sceneRange[si];
      const pt = phraseTokens(phrase);
      for (let i = 0; i + pt.length <= toks.length; i++) {
        if (toks[i].k < a || toks[i].k >= b) continue;
        let hit = true;
        for (let j = 0; j < pt.length && hit; j++) hit = toks[i + j].t === pt[j] && toks[i + j].k < b;
        if (hit) return toks[i].start;
      }
      return null;
    };
    const declared = new Set();
    (function walk(x) {
      if (typeof x === "string") declared.add(x);
      else if (Array.isArray(x)) x.forEach(walk);
      else if (x && typeof x === "object") Object.values(x).forEach(walk);
    })(plan);
    let cues = 0, repeats = 0;
    reg.forEach((e, idx) => {
      const tag = `numbers[${idx}] "${e.text}" (${e.scene})`;
      const si = sceneIdx[e.scene];
      if (si === undefined) { fail("b", `${tag}: unknown scene`); return; }
      if (e.repeat_of !== null && e.repeat_of !== undefined) {
        repeats++;
        const o = reg[e.repeat_of];
        if (!(e.repeat_of < idx) || !o || o.repeat_of !== null) { fail("b", `${tag}: a repeat must point to an earlier, non-repeat entry (repeat_of ${e.repeat_of})`); return; }
        if (o.spoken !== e.spoken) fail("b", `${tag}: spoken "${e.spoken}" != "${o.spoken}" of entry ${e.repeat_of}`);
        if (Math.abs(o.t - e.t) > CUE_TOL) fail("b", `${tag}: t ${e.t} != ${o.t} of entry ${e.repeat_of}`);
        return;
      }
      cues++;
      const at = firstCue(si, e.spoken);
      if (at === null) { fail("b", `${tag}: "${e.spoken}" is not spoken in ${e.scene}`); return; }
      if (Math.abs(at - e.t) > CUE_TOL) fail("b", `${tag}: shown at ${e.t}, its word cue is ${r3(at)}`);
      if (!declared.has(e.spoken)) fail("b", `${tag}: spoken form "${e.spoken}" is not declared in scenes.json`);
    });
    ok("b", `${cues} numbers spoken in their scenes at the registry time (within ${CUE_TOL} s); ${repeats} repeat(s) point to an earlier entry with the same spoken form and time`);
  }

  // ---------- c. gates, recomputed from words.json and the tail ----------
  {
    const lastEnd = words.at(-1).end;
    const TOTAL = r3(lastEnd + cfg.tail_s);
    const hook = r3(words[sceneWords[0].length - 1].end - words[0].start);
    const close = r3(TOTAL - words[sceneRange[N - 1][0]].start);
    const gates = { hook: [hook, cfg.hook_max_s], close: [close, cfg.close_max_s], total: [TOTAL, cfg.total_max_s] };
    for (const [name, [v, max]] of Object.entries(gates)) if (v > max + 1e-9) fail("c", `gate ${name} ${v} s > ${max} s`);
    if (Math.abs(tl.total - TOTAL) > CUE_TOL) fail("c", `timeline total ${tl.total} != last word end ${lastEnd} + tail ${cfg.tail_s} = ${TOTAL}`);
    for (const g of tl.gates ?? []) {
      const want = gates[g.name];
      if (!want) { fail("c", `unknown gate "${g.name}" in timeline.json`); continue; }
      if (Math.abs(g.value - want[0]) > CUE_TOL || g.max !== want[1]) fail("c", `gate ${g.name} in timeline.json (${g.value}, limit ${g.max}) != recomputed (${want[0]}, limit ${want[1]})`);
    }
    ok("c", `hook ${hook} s (limit ${cfg.hook_max_s}), close ${close} s (limit ${cfg.close_max_s}), total ${TOTAL} s (limit ${cfg.total_max_s})`);
  }

  // ---------- d. caption chunks ----------
  {
    const lim = tl.caption_limits;
    if (!lim) fail("d", "build/timeline.json has no caption_limits (rebuild with the current build)");
    caps.forEach((c, k) => {
      const text = c.words.map((w) => w.text).join(" ");
      if (lim) {
        const mw = c.merged ? lim.merge_words : lim.max_words;
        const mc = c.merged ? lim.merge_chars : lim.max_chars;
        if (c.words.length > mw || text.length > mc) fail("d", `chunk ${k} "${text}": ${c.words.length} words, ${text.length} characters (limit ${mw} / ${mc}${c.merged ? ", merged" : ""})`);
      }
      if (c.start > c.words[0].start + CUE_TOL || c.end < c.words.at(-1).end - CUE_TOL) fail("d", `chunk ${k} "${text}" does not cover its words`);
    });
    // every spoken word sits in exactly one caption word (a number run or a caption_display run is one caption word)
    const cover = new Array(words.length).fill(0);
    for (const c of caps) for (const w of c.words) for (let j = w.i; j < w.i + (w.n ?? 1) && j < words.length; j++) cover[j]++;
    const notOnce = cover.map((v, k) => (v === 1 ? -1 : k)).filter((k) => k >= 0);
    if (notOnce.length) fail("d", `${notOnce.length} spoken word(s) not in exactly one caption word, first at word ${notOnce[0]}`);
    // number runs: one caption word per registry number, whole, at its cue, with the registry caption text
    const capWords = caps.flatMap((c) => c.words);
    const numCapWords = capWords.filter((w) => w.num);
    const numEntries = reg.filter((e) => e.repeat_of === null && e.caption !== null);
    if (numCapWords.length !== numEntries.length) fail("d", `${numCapWords.length} number runs in the captions, ${numEntries.length} numbers in the registry`);
    for (const e of numEntries) {
      const pt = phraseTokens(e.spoken);
      const k = words.findIndex((w) => Math.abs(w.start - e.t) < CUE_TOL);
      if (k < 0) { fail("d", `"${e.text}": no word starts at its cue ${e.t}`); continue; }
      if (!pt.every((t, j) => norm(words[k + j]?.text ?? "") === t)) fail("d", `"${e.text}": "${e.spoken}" is not the words at its cue`);
      const cw = capWords.find((w) => w.i === k);
      if (!cw) { fail("d", `"${e.text}": no caption word starts at word ${k}`); continue; }
      if (!cw.num || cw.n !== pt.length) fail("d", `"${e.text}": split across caption words (run of ${cw.n}, spoken as ${pt.length})`);
      if (stripScriptPunct(cw.text) !== e.caption) fail("d", `"${e.text}": caption "${cw.text}" != registry caption "${e.caption}"`);
      if (Math.abs(cw.start - e.t) > CUE_TOL) fail("d", `"${e.text}": caption run starts at ${cw.start}, cue ${e.t}`);
    }
    ok("d", `${caps.length} chunks; limits ${lim ? `${lim.max_words} words / ${lim.max_chars} characters, merged chunks ${lim.merge_words} / ${lim.merge_chars}` : "missing"}; ${numCapWords.length} number runs, each one whole caption word at its cue with the registry caption; every spoken word in one caption word`);
  }

  // ---------- e. dead air ----------
  {
    const gaps = [];
    let maxGap = 0;
    for (let k = 0; k + 1 < words.length; k++) {
      const g = r3(words[k + 1].start - words[k].end);
      if (g > maxGap) maxGap = g;
      if (g > 0.6) gaps.push(`${r3(words[k].end)}-${r3(words[k + 1].start)} s (${g} s, after "${words[k].text}")`);
      if (g > 1.0) fail("e", `dead air ${g} s after "${words[k].text}" (limit 1.0 s)`);
    }
    ok("e", `gaps over 0.6 s: ${gaps.length ? gaps.join("; ") : "none"}; largest gap between words ${maxGap} s (limit 1.0 s)`);
  }

  // ---------- x. index.html in step with build/timeline.json ----------
  {
    const m = html.match(/<script type="application\/json" id="scenes-config">([\s\S]*?)<\/script>/);
    if (!m) fail("x", "index.html has no scenes-config block");
    else {
      const emb = JSON.parse(m[1]);
      if (emb.total !== tl.total || JSON.stringify(emb.captions) !== JSON.stringify(tl.captions)) fail("x", "index.html is out of step with build/timeline.json (run the build)");
    }
  }

  // ---------- browser probe ----------
  const TOT = tl.total;
  const sampleSet = new Set();
  for (let k = 0; k * 0.1 <= TOT + 1e-9; k++) sampleSet.add(r3(k * 0.1));
  sampleSet.add(r3(TOT));
  for (const e of reg) for (const dt of [-0.05, 0.05]) { const x = r3(e.t + dt); if (x >= 0 && x <= TOT) sampleSet.add(x); }
  const times = [...sampleSet].sort((a, b) => a - b);

  let probe = null;
  const chrome = findChrome();
  if (!chrome) fail("x", "chrome-headless-shell not found under /root/.cache/hyperframes/chrome (set CHROME_BIN)");
  else {
    try { probe = await runProbe(chrome, pathToFileURL(P("index.html")).href, times); }
    catch (e) { fail("x", `browser probe could not run: ${e.message}`); }
    if (probe && probe.error) { fail("x", `browser probe: ${probe.error}`); probe = null; }
  }

  let blocksChecked = 0, digitsChecked = 0, capsChecked = 0, maxBlocks = 0, maxBlocksAt = 0;
  if (probe) {
    const fonts = probe.fonts ?? [];
    const notLoaded = fonts.filter((f) => !f.endsWith(" loaded"));
    if (!fonts.length || notLoaded.length) fail("x", `web fonts not loaded in Chrome (${notLoaded.join(", ") || "none listed"}); line counts would be wrong`);
    ok("x", `Chrome loaded ${fonts.length} web font face(s): ${fonts.join(", ")}`);

    const S0 = { l: cfg.safe.left, r: cfg.width - cfg.safe.right, t: cfg.safe.top, b: cfg.height - cfg.safe.bottom };
    const band = cfg.hero_band;
    const TOL = 0.5;
    const lastScene = tl.scenes.at(-1).id; // the close is the last scene (video-02 s6_close, Reel A s7_cta)
    const yuk = tl.cues.find((c) => c.scene === lastScene && /card$/.test(c.where));
    if (!yuk) fail("k", "no final-card cue in timeline.json");
    const yukT = yuk ? yuk.t : Infinity;

    for (const rec of probe.samples) {
      const t = rec.t;
      if (rec.blocks.length > maxBlocks) { maxBlocks = rec.blocks.length; maxBlocksAt = t; }
      if (rec.blocks.length > 3) {
        note("g", `g|${rec.blocks.map((b) => b.name).join(",")}`, t,
          `g: ${rec.blocks.length} visible text blocks, limit 3: ${rec.blocks.map((b) => `${b.name} "${b.txt.slice(0, 28)}"`).join(", ")}`);
      }
      for (const b of rec.blocks) {
        blocksChecked++;
        const bx = b.box;
        if (bx.l < S0.l - TOL || bx.r > S0.r + TOL || bx.t < S0.t - TOL || bx.b > S0.b + TOL) {
          note("h", `h|${b.name}|${b.txt}`, t, `h: ${b.name} "${b.txt}" outside the safe box: x ${fx(bx.l)}..${fx(bx.r)}, y ${fx(bx.t)}..${fx(bx.b)} (safe x ${S0.l}..${S0.r}, y ${S0.t}..${S0.b})`);
        }
        if (b.name === "rank-chart" && (bx.t < band.top - TOL || bx.b > band.bottom + TOL)) {
          note("h", `hb|${b.name}|${b.txt}`, t, `h: ${b.name} "${b.txt.slice(0, 30)}" outside the hero band ${band.top}..${band.bottom}: y ${fx(bx.t)}..${fx(bx.b)}`);
        }
        if (b.cap) {
          capsChecked++;
          if (b.lines !== 1) note("i", `i1|${b.txt}`, t, `i: caption wraps to ${b.lines} lines: "${b.txt}"`);
          if (b.words > 6) note("i", `i2|${b.txt}`, t, `i: caption has ${b.words} words, limit 6: "${b.txt}"`);
        }
      }
      for (let i = 0; i < rec.blocks.length; i++) {
        for (let j = i + 1; j < rec.blocks.length; j++) {
          const a = rec.blocks[i], c = rec.blocks[j];
          if (a.allowOverlap || c.allowOverlap) continue; // a block marked data-layout-allow-overlap may overlap while it cross-fades
          const ix = Math.min(a.box.r, c.box.r) - Math.max(a.box.l, c.box.l);
          const iy = Math.min(a.box.b, c.box.b) - Math.max(a.box.t, c.box.t);
          if (ix > 2 && iy > 2) {
            const pair = [`${a.name} "${a.txt}"`, `${c.name} "${c.txt}"`].sort().join(" <> ");
            note("j", `j|${pair}`, t, `j: overlap ${fx(ix)} x ${fx(iy)} px: ${pair}`);
          }
        }
      }
      for (const d of rec.digits) {
        if (d.cite) continue; // the sources line carries the citation digits
        for (const tok of tokensOf(d.txt)) {
          digitsChecked++;
          if (tok === "0" || tok.startsWith("0,")) { note("f", `f0|${tok}|${d.where}`, t, `f: zero value "${tok}" visible in "${d.txt}" (${d.where})`); continue; }
          const cands = reg.filter((e) => tokensOf(e.text).includes(tok) || tokensOf(e.caption).includes(tok));
          if (!cands.length) { note("f", `fu|${tok}|${d.where}|${d.txt}`, t, `f: "${tok}" visible in "${d.txt}" (${d.where}) matches no registered display or caption`); continue; }
          const first = Math.min(...cands.map((e) => e.t));
          if (first > t + DIGIT_LEAD + 1e-9) note("f", `fb|${tok}|${d.where}|${d.txt}`, t, `f: "${tok}" visible in "${d.txt}" (${d.where}) before its cue at ${first} s`);
        }
      }
      for (const c of rec.cites) {
        if (t < yukT - 1e-6) note("k", "k-early", t, `k: sources line visible at ${t} s, before the Yuk cue at ${yukT} s`);
        if (c.fs < 30) note("k", `k-fs|${c.fs}`, t, `k: sources line font ${c.fs} px, minimum 30`);
        if (c.lines > 2) note("k", `k-lines|${c.lines}`, t, `k: sources line wraps to ${c.lines} lines, maximum 2`);
      }
    }
    flushGroups();
    // the final card: every sample from 0.35 s after the Yuk cue to 0.25 s before the end (the last scene fades out over its last 0.2 s)
    const hasCite = (tl.citations ?? []).length > 0; // Reel A has no sources line on screen (PRD-25)
    const finalCard = probe.samples.filter((s) => s.t >= yukT + 0.35 && s.t <= TOT - 0.25);
    if (hasCite && (!finalCard.length || finalCard.some((s) => !s.cites.length))) fail("k", "the sources line is not visible throughout the final card");
    const citeTimes = probe.samples.filter((s) => s.cites.length).map((s) => s.t);
    if (!hasCite) ok("k", "no sources line in this reel (none on screen)");
    else if (citeTimes.length) ok("k", `sources line visible from ${citeTimes[0]} s to ${citeTimes.at(-1)} s (Yuk cue ${yukT} s); font ${Math.min(...probe.samples.flatMap((s) => s.cites.map((c) => c.fs)))} px or more; at most ${Math.max(...probe.samples.flatMap((s) => s.cites.map((c) => c.lines)))} lines`);
    ok("f", `${digitsChecked} visible digit tokens over ${probe.samples.length} samples; each one registered and visible no earlier than its cue (+${DIGIT_LEAD} s tolerance); no zero value`);
    ok("g", `at most ${maxBlocks} visible text blocks in a sample (at ${maxBlocksAt} s), limit 3; captions count, the brand tag does not`);
    ok("h", `${blocksChecked} block observations inside x ${S0.l}..${S0.r}, y ${S0.t}..${S0.b}; rank block inside the hero band ${band.top}..${band.bottom} when shown`);
    ok("i", `${capsChecked} caption observations: one line each, at most 6 words each`);
    ok("j", `no overlaps between visible text blocks (blocks marked data-layout-allow-overlap exempt only while fading)`);
  }

  // ---------- report ----------
  const out = ["lint video-02 (PRD-14)"];
  for (const L of LETTERS) {
    const fs = failures.filter((f) => f.letter === L);
    const texts = oks[L] ?? [];
    if (!fs.length && !texts.length) continue;
    out.push(`${fs.length ? "FAIL" : "ok  "} ${L}: ${texts.join("; ") || "no checks recorded"}`);
    for (const f of fs) out.push(`       - ${f.msg}`);
  }
  out.push(`counts: samples ${probe ? probe.samples.length : 0}, text blocks checked ${blocksChecked}, digit tokens checked ${digitsChecked}, caption chunks ${caps.length}, registry entries ${reg.length}`);
  out.push(failures.length ? `RESULT: FAIL, ${failures.length} problem(s)` : "RESULT: PASS, 0 problems");
  console.log(out.join("\n"));
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  console.log(`lint video-02: crashed: ${e.stack || e.message}`);
  process.exit(1);
});
