#!/usr/bin/env node
// Reel A storyboard: builds static keyframes (storyboard/frames/sNN_k.png),
// two overview sheets (storyboard/sheet_1.jpg, sheet_2.jpg) and storyboard/storyboard.html.
// Run from anywhere:  node ep-reel-a/tools/storyboard.mjs
// Colours are approximations, not official brand colours. LOGO is a placeholder.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
const OUT = path.join(ROOT, 'storyboard');
const FRAME_DIR = path.join(OUT, 'frames');
const W = 1080;
const H = 1920;
const SAFE = { x0: 65, x1: 940, y0: 220, y1: 1500 };
const ACC = '#F7A600';
const BLUE = '#2F80ED';
const WIRE = '#7F9CC8';

const FONT_FILES = {
  anton: 'anton-latin-400-normal.woff2',
  inter400: 'inter-latin-400-normal.woff2',
  inter700: 'inter-latin-700-normal.woff2',
};

function fontCss(embedded) {
  const src = (f) => (embedded
    ? `url(data:font/woff2;base64,${fs.readFileSync(path.join(FONT_DIR, f)).toString('base64')}) format('woff2')`
    : `url('../assets/fonts/${f}') format('woff2')`);
  return `@font-face{font-family:'Anton';font-style:normal;font-weight:400;font-display:block;src:${src(FONT_FILES.anton)}}
@font-face{font-family:'Inter';font-style:normal;font-weight:400;font-display:block;src:${src(FONT_FILES.inter400)}}
@font-face{font-family:'Inter';font-style:normal;font-weight:700;font-display:block;src:${src(FONT_FILES.inter700)}}`;
}
const EMB_FONTS = fontCss(true);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- script data (v2, approved) ----------
const SCENE = {
  1: { dur: '~3.5 s', vo: 'Panel surya nggak butuh panas. Yang dia butuh: cahaya.' },
  2: { dur: '~9 s', vo: 'Sel surya mengubah energi cahaya langsung jadi listrik lewat efek fotovoltaik. Cahaya yang diserap sel melepaskan elektron di sambungan p-n, dan aliran elektron itulah listriknya.' },
  3: { dur: '~5 s', vo: 'Kalau yang mengubah sinar matahari jadi panas, itu alat yang berbeda: solar thermal collector.' },
  4: { dur: '~6 s', vo: 'Listrik dari panel itu arus searah, atau DC. Untuk diubah ke AC, sering dipakai inverter.' },
  5: { dur: '~9 s', vo: 'Ambil satu panel sebagai contoh: dua belas volt, lima ampere. Disambung seri, tegangannya dijumlah. Dua panel jadi dua puluh empat volt, arusnya tetap lima ampere.' },
  6: { dur: '~7 s', vo: 'Kalau tiga panel disambung paralel, arusnya yang dijumlah. Tegangannya tetap dua belas volt, arusnya jadi lima belas ampere.' },
  7: { dur: '~4 s', vo: null },
};

// ---------- helpers ----------
function panel(x, y, w, h, cols, rows) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#0E3A7A" stroke="${BLUE}" stroke-width="6"/>`;
  const p = 16;
  const cw = (w - 2 * p) / cols;
  const ch = (h - 2 * p) / rows;
  const g = 6;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      s += `<rect x="${(x + p + i * cw + g / 2).toFixed(1)}" y="${(y + p + j * ch + g / 2).toFixed(1)}" width="${(cw - g).toFixed(1)}" height="${(ch - g).toFixed(1)}" rx="3" fill="${BLUE}" opacity="${0.35 + 0.25 * ((i + j) % 2)}"/>`;
    }
  }
  return s;
}

function term(cx, cy, sign, fill = ACC, ink = '#0B1B3F') {
  return `<circle cx="${cx}" cy="${cy}" r="24" fill="${fill}"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-weight="700" font-size="36" fill="${ink}">${sign}</text>`;
}

const svgEl = (left, top, w, h, inner) =>
  `<svg class="key" style="left:${left}px;top:${top}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;

const head = (html, o) =>
  `<div class="txt head" style="left:${o.left ?? 65}px;top:${o.top}px;width:${o.width ?? 875}px;font-size:${o.size}px;color:${o.color ?? ACC};text-align:${o.align ?? 'center'}">${html}</div>`;

const label = (html, o) =>
  `<div class="txt" style="left:${o.left ?? 65}px;top:${o.top}px;width:${o.width ?? 875}px;font:${o.weight ?? 700} ${o.size}px/1.2 Inter,sans-serif;color:${o.color ?? '#fff'};text-align:${o.align ?? 'center'}">${html}</div>`;

const HEAD_CELL = `CAHAYA -&gt; LISTRIK`;

// ---------- frame bodies (S1..S7) ----------
function thermo() {
  return `<rect x="130" y="20" width="60" height="280" rx="30" fill="none" stroke="#fff" stroke-width="12"/>
<circle cx="160" cy="330" r="62" fill="none" stroke="#fff" stroke-width="12"/>
<rect x="145" y="150" width="30" height="180" fill="${ACC}"/>
<circle cx="160" cy="330" r="42" fill="${ACC}"/>
${[60, 120, 180, 240].map((y) => `<line x1="210" y1="${y}" x2="240" y2="${y}" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`).join('')}
<line x1="50" y1="30" x2="300" y2="390" stroke="#FF4D4D" stroke-width="30" stroke-linecap="round"/>`;
}

const s1a = () =>
  head('BUKAN<br>PANAS.', { top: 380, size: 236, color: ACC }) +
  svgEl(370, 920, 340, 420, thermo());

const s1b = () => {
  let rays = '';
  for (const a of [8, 18, 28, 38, 48]) {
    const r = (a * Math.PI) / 180;
    rays += `<line x1="${(120 + 95 * Math.cos(r)).toFixed(1)}" y1="${(90 + 95 * Math.sin(r)).toFixed(1)}" x2="${(120 + 380 * Math.cos(r)).toFixed(1)}" y2="${(90 + 380 * Math.sin(r)).toFixed(1)}" stroke="${ACC}" stroke-width="10" stroke-linecap="round" opacity=".85"/>`;
  }
  const sun = `<circle cx="120" cy="90" r="92" fill="${ACC}" opacity=".22"/><circle cx="120" cy="90" r="62" fill="${ACC}"/>`;
  const tilted = `<g transform="translate(600 340) rotate(-18)">${panel(-200, -140, 400, 280, 4, 3)}</g>`;
  return head('CAHAYA.', { top: 330, size: 230, color: ACC }) + svgEl(65, 640, 875, 600, rays + sun + tilted);
};

const s2a = () => {
  const photons = [200, 300, 380, 460, 560]
    .map((x) => `<path d="M${x} 80 q14 20 0 40 q-14 20 0 40 q14 20 0 40 q-14 20 0 40" fill="none" stroke="${ACC}" stroke-width="7" stroke-linecap="round"/><polygon points="${x - 14},236 ${x + 14},236 ${x},266" fill="${ACC}"/>`)
    .join('');
  const cell = `<rect x="120" y="300" width="520" height="220" fill="${BLUE}"/>
<text x="380" y="440" text-anchor="middle" font-family="Anton" font-size="150" fill="#fff">n</text>
<rect x="120" y="520" width="520" height="220" fill="#164C9E"/>
<text x="380" y="660" text-anchor="middle" font-family="Anton" font-size="150" fill="#fff">p</text>
<rect x="120" y="740" width="520" height="30" fill="${WIRE}"/>
<line x1="120" y1="520" x2="640" y2="520" stroke="${ACC}" stroke-width="10"/>
<line x1="640" y1="520" x2="656" y2="520" stroke="${ACC}" stroke-width="4"/>
<text x="662" y="506" font-family="Inter" font-weight="700" font-size="30" fill="${ACC}">sambungan</text>
<text x="662" y="546" font-family="Inter" font-weight="700" font-size="30" fill="${ACC}">p-n</text>`;
  return head(HEAD_CELL, { top: 318, size: 96 }) + svgEl(65, 400, 875, 800, photons + cell);
};

const s2b = () => {
  const electrons = [[260, 110], [400, 110], [620, 110], [740, 240], [740, 330], [740, 690], [600, 760], [420, 760], [260, 760], [200, 600]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#5FA8FF" stroke="#fff" stroke-width="3"/>`)
    .join('');
  const inner = `<text x="40" y="60" font-family="Inter" font-weight="700" font-size="40" fill="${ACC}">efek fotovoltaik</text>
<rect x="80" y="170" width="240" height="120" fill="${BLUE}"/>
<text x="200" y="256" text-anchor="middle" font-family="Anton" font-size="80" fill="#fff">n</text>
<rect x="80" y="290" width="240" height="120" fill="#164C9E"/>
<text x="200" y="376" text-anchor="middle" font-family="Anton" font-size="80" fill="#fff">p</text>
<line x1="80" y1="290" x2="320" y2="290" stroke="${ACC}" stroke-width="8"/>
<path d="M200,170 L200,110 L740,110 L740,450" fill="none" stroke="${WIRE}" stroke-width="10" stroke-linejoin="round"/>
<path d="M740,590 L740,760 L200,760 L200,410" fill="none" stroke="${WIRE}" stroke-width="10" stroke-linejoin="round"/>
<polyline points="490,94 510,110 490,126" fill="none" stroke="${ACC}" stroke-width="7"/>
<circle cx="740" cy="520" r="120" fill="${ACC}" opacity=".25"/>
<circle cx="740" cy="520" r="70" fill="${ACC}"/>
<path d="M715,545 L728,505 L740,545 L752,505 L765,545" fill="none" stroke="#7A4D00" stroke-width="6"/>
${electrons}`;
  return head(HEAD_CELL, { top: 318, size: 96 }) + svgEl(65, 400, 875, 800, inner);
};

const s3a = () => {
  const collector = [0, 1, 2, 3, 4]
    .map((i) => `<rect x="${20 + i * 76}" y="20" width="56" height="220" rx="28" fill="#0E3A7A" stroke="${BLUE}" stroke-width="6"/><rect x="${30 + i * 76}" y="40" width="36" height="180" rx="18" fill="${ACC}" opacity=".55"/>`)
    .join('') + `<rect x="0" y="250" width="400" height="20" rx="6" fill="${WIRE}"/>`;
  const flame = `<path d="M200,10 C260,90 290,140 280,180 C272,215 128,215 120,180 C110,140 140,90 200,10 Z" fill="${ACC}"/><path d="M200,110 C225,140 235,165 225,190 C218,205 182,205 175,190 C168,170 180,140 200,110 Z" fill="#FFD84D"/>`;
  const bolt = `<line x1="217" y1="262" x2="217" y2="292" stroke="#fff" stroke-width="8"/><path d="M240,300 L180,395 L220,395 L195,455 L265,360 L225,360 L252,300 Z" fill="${ACC}"/><text x="217" y="512" text-anchor="middle" font-family="Anton" font-size="64" fill="${ACC}">LISTRIK</text>`;
  const leftGfx = svgEl(65, 620, 435, 520, panel(20, 0, 400, 250, 5, 3) + bolt);
  const rightContainer = `<div class="key" style="left:540px;top:300px;width:400px;height:900px;opacity:.4">` +
    head('SOLAR THERMAL<br>COLLECTOR', { left: 0, top: 0, width: 400, size: 58, align: 'left' }) +
    label('PANAS', { left: 0, top: 150, width: 400, size: 30, align: 'left' }) +
    svgEl(0, 260, 400, 300, collector) +
    svgEl(0, 600, 400, 240, flame) +
    head('PANAS', { left: 0, top: 860, width: 400, size: 60 }) +
    `</div>`;
  return head('PANEL SURYA', { left: 65, top: 300, width: 435, size: 72, align: 'left' }) +
    label('CAHAYA -&gt; LISTRIK', { left: 65, top: 400, width: 435, size: 30, align: 'left' }) +
    `<div class="key" style="left:520px;top:300px;width:3px;height:800px;background:rgba(255,255,255,.3)"></div>` +
    leftGfx + rightContainer;
};

const s4a = () => {
  const battery = `<rect x="60" y="150" width="170" height="100" rx="10" fill="none" stroke="#fff" stroke-width="8"/>
<rect x="230" y="180" width="16" height="40" fill="#fff"/>
<line x1="100" y1="160" x2="100" y2="240" stroke="#fff" stroke-width="10"/>
<line x1="140" y1="180" x2="140" y2="220" stroke="#fff" stroke-width="10"/>
<line x1="180" y1="160" x2="180" y2="240" stroke="#fff" stroke-width="10"/>
<text x="262" y="150" font-family="Inter" font-weight="700" font-size="44" fill="#fff">+</text>
<text x="30" y="150" font-family="Inter" font-weight="700" font-size="44" fill="#fff">-</text>`;
  const wire = `<line x1="246" y1="200" x2="860" y2="200" stroke="${BLUE}" stroke-width="14" stroke-linecap="round"/>`;
  const chevrons = [340, 460, 580, 700, 800]
    .map((x) => `<polyline points="${x - 18},176 ${x + 14},200 ${x - 18},224" fill="none" stroke="${ACC}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  return head('ARUS SEARAH (DC)', { top: 300, size: 96 }) + svgEl(65, 520, 875, 420, battery + wire + chevrons);
};

const s4b = () => {
  let sine = '';
  for (let x = 530; x <= 720; x += 2) {
    const y = 200 - 60 * Math.sin(((x - 530) / 126.67) * 2 * Math.PI);
    sine += `${x},${y.toFixed(1)} `;
  }
  const inner = `<text x="20" y="168" font-family="Anton" font-size="60" fill="${ACC}">DC</text>
<path d="M20,200 L260,200" stroke="${BLUE}" stroke-width="12" fill="none"/>
<rect x="260" y="120" width="270" height="160" rx="14" fill="#0B1B3F" stroke="${ACC}" stroke-width="8"/>
<text x="395" y="216" text-anchor="middle" font-family="Anton" font-size="46" fill="#fff">INVERTER</text>
<polyline points="${sine.trim()}" fill="none" stroke="${ACC}" stroke-width="10" stroke-linejoin="round"/>
<text x="625" y="330" text-anchor="middle" font-family="Anton" font-size="64" fill="${ACC}">AC</text>
<line x1="720" y1="200" x2="760" y2="200" stroke="#fff" stroke-width="8"/>
<path d="M760,200 L810,150 L860,200" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>
<rect x="770" y="200" width="80" height="80" fill="none" stroke="#fff" stroke-width="8"/>
<rect x="800" y="230" width="20" height="50" fill="#fff"/>
<text x="810" y="330" text-anchor="middle" font-family="Inter" font-weight="700" font-size="30" fill="#fff">RUMAH</text>`;
  return head('INVERTER', { top: 280, size: 150 }) + label('DC -&gt; AC', { top: 440, size: 44, color: ACC }) + svgEl(65, 560, 875, 480, inner);
};

const s5a = () =>
  `<div class="txt" style="left:65px;top:300px;width:875px;text-align:center"><span class="tag">ANGKA CONTOH</span></div>` +
  svgEl(190, 400, 500, 560,
    panel(40, 20, 420, 400, 4, 6) +
    `<line x1="110" y1="420" x2="110" y2="466" stroke="${BLUE}" stroke-width="10"/><line x1="390" y1="420" x2="390" y2="466" stroke="${BLUE}" stroke-width="10"/>` +
    term(110, 490, '+', ACC, '#0B1B3F') + term(390, 490, '-', BLUE, '#fff')) +
  head('12 V · 5 A', { top: 1000, size: 130, color: '#fff' });

const s5b = () =>
  head('SERI', { top: 250, size: 170 }) +
  head('24 V', { top: 410, size: 250 }) +
  label('<span class="cnt">5 A</span><span class="out">tetap</span>', { top: 660, size: 56 }) +
  svgEl(65, 760, 875, 420,
    panel(60, 60, 320, 300, 3, 5) + panel(495, 60, 320, 300, 3, 5) +
    `<line x1="330" y1="30" x2="545" y2="30" stroke="${BLUE}" stroke-width="8"/>` +
    `<line x1="110" y1="54" x2="110" y2="60" stroke="#fff" stroke-width="8"/><line x1="330" y1="54" x2="330" y2="60" stroke="#fff" stroke-width="8"/>` +
    `<line x1="545" y1="54" x2="545" y2="60" stroke="#fff" stroke-width="8"/><line x1="765" y1="54" x2="765" y2="60" stroke="#fff" stroke-width="8"/>` +
    term(110, 30, '-', BLUE, '#fff') + term(330, 30, '+', ACC) + term(545, 30, '-', BLUE, '#fff') + term(765, 30, '+', ACC));

const s6a = () => {
  let inner = `<rect x="100" y="40" width="16" height="480" rx="6" fill="${ACC}"/>
<rect x="800" y="40" width="16" height="480" rx="6" fill="${BLUE}"/>
<text x="108" y="30" text-anchor="middle" font-family="Inter" font-weight="700" font-size="36" fill="${ACC}">+</text>
<text x="808" y="30" text-anchor="middle" font-family="Inter" font-weight="700" font-size="36" fill="${BLUE}">-</text>`;
  for (const y0 of [60, 230, 400]) {
    const m = y0 + 65;
    inner += panel(300, y0, 300, 130, 5, 2) +
      `<line x1="116" y1="${m}" x2="246" y2="${m}" stroke="${ACC}" stroke-width="8"/>` +
      `<line x1="294" y1="${m}" x2="300" y2="${m}" stroke="#fff" stroke-width="8"/>` +
      term(270, m, '+', ACC) +
      `<line x1="600" y1="${m}" x2="606" y2="${m}" stroke="#fff" stroke-width="8"/>` +
      `<line x1="654" y1="${m}" x2="800" y2="${m}" stroke="${BLUE}" stroke-width="8"/>` +
      term(630, m, '-', BLUE, '#fff');
  }
  return head('PARALEL', { top: 250, size: 170 }) +
    head('15 A', { top: 410, size: 230 }) +
    label('<span class="cnt">12 V</span><span class="out">tetap</span>', { top: 650, size: 56 }) +
    svgEl(65, 720, 875, 560, inner);
};

const s7a = () =>
  `<div class="key" style="left:100px;top:620px;width:840px;height:600px;border-radius:36px;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.22)">` +
  `<div class="txt" style="left:310px;top:40px;width:220px;height:90px;border:2px solid rgba(255,255,255,.75);border-radius:8px;display:flex;align-items:center;justify-content:center;font:700 26px/1 Inter,sans-serif;letter-spacing:.12em">LOGO</div>` +
  head('ELECTRO POWER', { left: 0, top: 170, width: 836, size: 84, color: '#fff' }) +
  head('INDONESIA', { left: 0, top: 262, width: 836, size: 84 }) +
  `<div class="txt" style="left:150px;top:400px;width:540px;height:120px;border:6px dashed ${ACC};border-radius:16px;display:flex;align-items:center;justify-content:center;font:700 56px/1 Inter,sans-serif;color:${ACC}">[CTA KELAS]</div>` +
  `</div>`;

// ---------- frame list (order matters) ----------
const FRAMES_DEF = [
  { id: 's1_a', scene: 1, cap: { text: 'Panel surya nggak butuh panas', hi: 4 }, motion: 'thermometer dicoret masuk, teks BUKAN PANAS. muncul cepat', body: s1a },
  { id: 's1_b', scene: 1, cap: { text: 'Yang dia butuh: cahaya.', hi: 3 }, motion: 'sinar matahari masuk dari kiri atas, panel miring menyala, CAHAYA. membesar', body: s1b },
  { id: 's2_a', scene: 2, cap: { text: 'Sel surya mengubah energi cahaya', hi: 4 }, motion: 'foton kuning masuk dari atas, menembus lapisan n, sambungan p-n menyala', body: s2a },
  { id: 's2_b', scene: 2, cap: { text: 'melepaskan elektron di sambungan', hi: 3 }, motion: 'elektron biru mengalir dari sambungan lewat kawat ke lampu yang menyala', body: s2b },
  { id: 's3_a', scene: 3, cap: { text: 'yang mengubah sinar matahari', hi: 2 }, motion: 'panel dan kolektor muncul berdampingan, sisi kanan meredup ke 40%', body: s3a },
  { id: 's4_a', scene: 4, cap: { text: 'arus searah, atau DC', hi: 3 }, motion: 'panah arus bergerak satu arah sepanjang kawat dari baterai', body: s4a },
  { id: 's4_b', scene: 4, cap: { text: 'sering dipakai inverter', hi: 2 }, motion: 'garis DC rata masuk inverter, keluar gelombang AC, lalu ke rumah', body: s4b },
  { id: 's5_a', scene: 5, cap: { text: 'Ambil satu panel sebagai contoh', hi: 4 }, motion: 'panel tunggal muncul, tag ANGKA CONTOH lalu 12 V · 5 A', body: s5a },
  { id: 's5_b', scene: 5, cap: { text: 'Disambung seri, tegangannya dijumlah', hi: 1 }, motion: 'dua panel tersambung seri, 24 V naik, 5 A tetap', body: s5b },
  { id: 's6_a', scene: 6, cap: { text: 'arusnya yang dijumlah', hi: 2 }, motion: 'tiga panel tersambung paralel lewat dua rel, 15 A naik, 12 V tetap', body: s6a },
  { id: 's7_a', scene: 7, cap: null, motion: 'kartu CTA masuk, nama brand muncul, [CTA KELAS] berkedip', body: s7a },
];

const SHEETS = [
  { file: 'sheet_1.jpg', ids: ['s1_a', 's1_b', 's2_a', 's2_b', 's3_a', 's4_a', 's4_b'] },
  { file: 'sheet_2.jpg', ids: ['s5_a', 's5_b', 's6_a', 's7_a'] },
];

const sceneLabel = (f) => `S${f.scene} · ${SCENE[f.scene].dur} · ${f.id}`;
const voExcerpt = (f) => (SCENE[f.scene].vo ? `${SCENE[f.scene].vo.slice(0, 60)}...` : '(CTA, tanpa VO)');

// ---------- page builders ----------
const BASE_CSS = `*{box-sizing:border-box}
html,body{margin:0;padding:0;width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:linear-gradient(180deg,#0B1B3F 0%,#12306B 100%);color:#fff;font-family:Inter,sans-serif}
.txt,.key{position:absolute}
.txt{white-space:nowrap}
.head{font-family:Anton,sans-serif;font-weight:400;line-height:.95;text-transform:uppercase}
.logo{left:65px;top:232px;width:140px;height:56px;border:2px solid rgba(255,255,255,.75);border-radius:8px;display:flex;align-items:center;justify-content:center;font:700 22px/1 Inter,sans-serif;letter-spacing:.12em}
.dots{left:436px;top:1440px;width:208px;height:16px;display:flex;align-items:center;gap:12px}
.dot{display:block;width:16px;height:16px;border-radius:8px;background:rgba(255,255,255,.35)}
.dot.on{width:40px;background:${ACC}}
.cap{left:65px;top:1346px;width:875px;text-align:center}
.pill{display:inline-block;background:rgba(11,27,63,.72);border-radius:999px;padding:14px 32px;font:700 36px/1.2 Inter,sans-serif;white-space:nowrap}
.pill .hi{color:${ACC}}
.tag{display:inline-block;background:${ACC};color:#0B1B3F;font:700 40px/1.2 Inter,sans-serif;padding:12px 36px;border-radius:12px}
.cnt{font:700 56px/1.2 Inter,sans-serif;color:#fff}
.out{display:inline-block;border:3px solid #fff;border-radius:999px;padding:4px 20px;font:700 30px/1.2 Inter,sans-serif;margin-left:14px;vertical-align:middle}`;

function chromeHtml(f) {
  const dots = Array.from({ length: 7 }, (_, i) => `<span class="dot${i + 1 === f.scene ? ' on' : ''}"></span>`).join('');
  const cap = f.cap
    ? `<div class="txt cap"><span class="pill">${f.cap.text.split(' ').map((w, i) => `<span${i === f.cap.hi ? ' class="hi"' : ''}>${esc(w)}</span>`).join(' ')}</span></div>`
    : '';
  return `<div class="key logo">LOGO</div><div class="key dots">${dots}</div>${cap}`;
}

function framePage(f) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${f.id}</title><style>${EMB_FONTS}\n${BASE_CSS}</style></head><body>${f.body()}${chromeHtml(f)}</body></html>`;
}

// Runs inside the page: returns boxes outside the safe box for .txt/.key elements.
function safeCheck({ x0, x1, y0, y1 }) {
  const out = [];
  document.querySelectorAll('.txt,.key').forEach((el) => {
    const rects = [el.getBoundingClientRect()];
    el.querySelectorAll('*').forEach((c) => rects.push(c.getBoundingClientRect()));
    const rg = document.createRange();
    rg.selectNodeContents(el);
    // text runs: horizontal axis only (font ascent/descent boxes overshoot the line box vertically)
    const textRects = [...rg.getClientRects()];
    for (const r of rects) {
      if (r.width === 0 && r.height === 0) continue;
      if (r.left < x0 || r.right > x1 || r.top < y0 || r.bottom > y1) {
        out.push({
          cls: el.getAttribute('class'),
          text: (el.textContent || '').trim().slice(0, 40),
          box: [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v)),
        });
        break;
      }
    }
    for (const r of textRects) {
      if (r.width === 0) continue;
      if (r.left < x0 || r.right > x1) {
        out.push({
          cls: el.getAttribute('class'),
          text: (el.textContent || '').trim().slice(0, 40),
          box: [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v)),
        });
        break;
      }
    }
  });
  return out;
}

function imgSize(buf) {
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

async function waitFonts(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([document.fonts.load('80px Anton'), document.fonts.load('700 40px Inter')]);
    await document.fonts.ready;
    return { anton: document.fonts.check('80px Anton'), inter700: document.fonts.check('700 40px Inter') };
  });
}

async function renderFrame(browser, f) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  try {
    await page.setContent(framePage(f), { waitUntil: 'load' });
    const fonts = await waitFonts(page);
    const violations = await page.evaluate(safeCheck, SAFE);
    const buf = await page.screenshot({ type: 'png', fullPage: false });
    return { buf, fonts, violations };
  } finally {
    await page.close();
  }
}

function sheetHtml(ids, uris) {
  const cards = ids.map((id) => {
    const f = FRAMES_DEF.find((x) => x.id === id);
    return `<div class="card"><img src="${uris[id]}" alt="${id}"><div class="cap"><div class="t">${esc(sceneLabel(f))}</div><div class="vo">${esc(voExcerpt(f))}</div><div class="mo">Gerak: ${esc(f.motion)}</div></div></div>`;
  }).join('');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${EMB_FONTS}
*{box-sizing:border-box}
body{margin:0;background:#fff;font-family:Inter,sans-serif;width:1244px;padding:24px}
.grid{display:grid;grid-template-columns:repeat(3,360px);gap:28px}
.card{width:360px;background:#fff}
.card img{display:block;width:360px;height:640px;border:1px solid #d8dee9}
.cap{background:#fff;color:#0B1B3F;padding:10px 2px 6px;font-size:19px;line-height:1.35}
.t{font-weight:700}
.mo{color:#33415C}
</style></head><body><div class="grid">${cards}</div></body></html>`;
}

async function renderSheet(browser, sheet, buffers) {
  const uris = {};
  for (const id of sheet.ids) uris[id] = `data:image/png;base64,${buffers[id].toString('base64')}`;
  const page = await browser.newPage({ viewport: { width: 1244, height: 900 }, deviceScaleFactor: 1 });
  try {
    await page.setContent(sheetHtml(sheet.ids, uris), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const outPath = path.join(OUT, sheet.file);
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 85, fullPage: true });
    return outPath;
  } finally {
    await page.close();
  }
}

function storyboardHtml() {
  const figs = FRAMES_DEF.map((f) =>
    `<figure><img src="frames/${f.id}.png" width="360" alt="${f.id}"><figcaption><div class="t">${esc(sceneLabel(f))}</div><div class="vo">${esc(voExcerpt(f))}</div><div class="mo">Gerak: ${esc(f.motion)}</div></figcaption></figure>`
  ).join('\n');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reel A storyboard</title><style>${fontCss(false)}
body{margin:0;padding:16px;font-family:Inter,sans-serif;background:#0B1B3F;color:#fff}
h1{font-family:Anton,sans-serif;font-weight:400;font-size:32px;color:${ACC};margin:0 0 6px}
p{margin:0 0 16px;font-size:15px;opacity:.85}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
figure{margin:0;background:#fff;color:#0B1B3F;border-radius:8px;overflow:hidden}
figure img{display:block;width:100%;height:auto}
figcaption{padding:10px 12px 12px;font-size:16px;line-height:1.35}
.t{font-weight:700}.mo{color:#33415C}
</style></head><body><h1>Reel A storyboard (static keyframes)</h1><p>Colours are approximations, not official brand colours. LOGO is a placeholder. VO excerpts are the script v2 lines.</p><div class="grid">\n${figs}\n</div></body></html>`;
}

// ---------- main ----------
async function main() {
  fs.mkdirSync(FRAME_DIR, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.log(`launch failed, retrying with --no-sandbox: ${String(e.message).split('\n')[0]}`);
    browser = await chromium.launch({ args: ['--no-sandbox'] });
  }
  const problems = [];
  const buffers = {};
  try {
    for (const f of FRAMES_DEF) {
      const r = await renderFrame(browser, f);
      buffers[f.id] = r.buf;
      fs.writeFileSync(path.join(FRAME_DIR, `${f.id}.png`), r.buf);
      const fontOk = r.fonts.anton && r.fonts.inter700;
      console.log(`frame ${f.id}: fonts anton=${r.fonts.anton} inter700=${r.fonts.inter700} safe-box violations=${r.violations.length}`);
      if (!fontOk) problems.push(`fonts not loaded for ${f.id}`);
      for (const v of r.violations) problems.push(`safe-box ${f.id}: ${JSON.stringify(v)}`);
    }
    if (problems.length) {
      console.log('CHECK FAILED:');
      for (const p of problems) console.log('  ' + p);
      process.exitCode = 1;
      return;
    }
    for (const sheet of SHEETS) {
      await renderSheet(browser, sheet, buffers);
    }
    fs.writeFileSync(path.join(OUT, 'storyboard.html'), storyboardHtml());
  } finally {
    await browser.close();
  }
  console.log('frames:');
  for (const f of FRAMES_DEF) {
    const p = path.join(FRAME_DIR, `${f.id}.png`);
    const s = imgSize(fs.readFileSync(p));
    console.log(`  ${p} ${s.w}x${s.h}`);
  }
  console.log('sheets:');
  for (const sheet of SHEETS) {
    const p = path.join(OUT, sheet.file);
    const s = imgSize(fs.readFileSync(p));
    console.log(`  ${p} ${s.w}x${s.h}`);
  }
  console.log(`html: ${path.join(OUT, 'storyboard.html')}`);
  console.log('ALL CHECKS PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
