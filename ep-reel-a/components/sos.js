/* video-02 scene builders. Plain browser script, loaded after vendor/gsap.min.js.
 *
 * Deterministic: no network, no randomness, no Date. window.SOS.build(cfg) returns ONE paused GSAP timeline.
 * Every tween sits at an absolute time from cfg, which tools/build.mjs resolves from word cues of the voice take.
 * Text appears at its cue with a short fade and rise. Numbers are never animated through other values.
 * Each text block is a container with data-tb (one per block; captions count, the brand tag does not).
 */
(function (global) {
  "use strict";

  var ACCENT = "#F7A600";
  var BAD = "#2F80ED";
  var NEUTRAL = "#9fb2cc";
  var CAP_BASE = "rgba(255,255,255,0.96)";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  // A text block: one container per block, named for the layout rules in sos.css.
  function block(parent, id) {
    var b = el("div", "blk");
    b.setAttribute("data-tb", id);
    parent.appendChild(b);
    return b;
  }

  // Text that appears at time t: a short fade and rise.
  function appear(tl, node, t, dur) {
    tl.fromTo(node, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: dur || 0.25, ease: "power2.out" }, t);
  }

  // A part layer covers the scene. It fades in at part.from (when it is not the scene start) and out before part.to.
  function layer(tl, sec, part, scene, name) {
    var d = el("div", "part part-" + name);
    sec.appendChild(d);
    if (part.from > scene.start + 1e-9) {
      tl.fromTo(d, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, part.from);
    }
    if (part.to < scene.end - 1e-9) {
      tl.to(d, { opacity: 0, duration: 0.15, ease: "power1.in" }, part.to - 0.15);
    }
    return d;
  }

  // ---------- claim: kicker and two lines from 0 s, the reveal at its cue ----------
  function claim(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "claim");
    var b = block(L, "claim");
    if (p.kicker) b.appendChild(el("div", "kicker", p.kicker));
    p.lines.forEach(function (ln) { b.appendChild(el("div", "claim-line", ln)); });
    var r = el("div", "claim-reveal", p.reveal.text);
    b.appendChild(r);
    appear(tl, r, p.reveal.t, 0.3);
  }

  // ---------- pair: two rows, year and value each at their cue; the bar grows from the value cue ----------
  function pair(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "pair");
    var t = block(L, "pair-title");
    t.appendChild(el("div", "pair-title-text", p.title));
    var c = block(L, "pair-chart");
    p.rows.forEach(function (row) {
      var r = el("div", "pair-row");
      var head = el("div", "pair-head");
      var yr = el("span", "pair-year", row.year.text);
      var val = el("span", "pair-val", row.value.text);
      head.appendChild(yr);
      head.appendChild(val);
      var track = el("div", "pair-track");
      var fill = el("div", "pair-fill");
      track.appendChild(fill);
      r.appendChild(head);
      r.appendChild(track);
      c.appendChild(r);
      appear(tl, yr, row.year.t, 0.25);
      appear(tl, track, row.year.t, 0.25);
      appear(tl, val, row.value.t, 0.25);
      // fill width = value / 100 of the track, grown in 0.6 s from the value's cue
      tl.fromTo(fill, { width: "0%" }, { width: row.value.value + "%", duration: 0.6, ease: "power2.out" }, row.value.t);
    });
  }

  // ---------- grid: 1000 dots; unlit = the last dots in reading order; the label switches at its cue ----------
  function grid(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "grid");
    var g = block(L, "grid");
    var labelRow = el("div", "grid-label");
    var l0 = el("span", "gl", p.label);
    var l1 = el("span", "gl", p.switch.label);
    labelRow.appendChild(l0);
    labelRow.appendChild(l1);
    g.appendChild(labelRow);
    var wrap = el("div", "dot-grid");
    wrap.style.gridTemplateColumns = "repeat(" + p.cols + ", " + p.dot + "px)";
    wrap.style.gridAutoRows = p.dot + "px";
    wrap.style.gap = p.gap + "px";
    var total = p.cols * p.rows;
    var dots = [];
    for (var i = 0; i < total; i++) {
      var d = el("div", "dot");
      d.style.background = i >= total - p.unlit_from ? p.unlit : p.lit;
      wrap.appendChild(d);
      dots.push(d);
    }
    g.appendChild(wrap);

    // label switch: DULU -> SEKARANG at the cue
    tl.to(l0, { opacity: 0, duration: 0.15 }, p.switch.t);
    tl.fromTo(l1, { opacity: 0 }, { opacity: 1, duration: 0.15 }, p.switch.t);

    // unlit dots light up in reading order with a stagger over fill_s; the last unlit_to dots stay unlit
    var lighting = dots.slice(total - p.unlit_from, total - p.unlit_to);
    if (lighting.length > 0) {
      var each = lighting.length > 1 ? (p.switch.fill_s - 0.15) / (lighting.length - 1) : 0;
      tl.to(lighting, { backgroundColor: p.lit, duration: 0.15, stagger: { each: each } }, p.switch.t);
    }

    var h = block(L, "grid-headline");
    p.headline.lines.forEach(function (ln) { h.appendChild(el("div", "grid-h", ln)); });
    h.appendChild(el("div", "grid-sub", p.subline));
    appear(tl, h, p.headline.t, 0.3);
  }

  // ---------- textcard: two lines until the cue, then it is replaced ----------
  function textcard(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "textcard");
    var b = block(L, "textcard");
    p.lines.forEach(function (ln) {
      var d = el("div", "tc-line" + (ln.accent ? " accent" : ""), ln.text);
      b.appendChild(d);
      if (ln.t !== null) appear(tl, d, ln.t, 0.25); // a line with a cue appears at it (PRD-25); the others show from the part start
    });
  }

  // ---------- rankbars: title, subtitle and the five rows at the rows cue (together); the bars grow with a stagger; one row highlighted;
  // the label (two lines) at its number cue, inside the same block ----------
  function rankbars(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "rank");
    var c = block(L, "rank-chart");
    c.appendChild(el("div", "rank-title", p.title));
    var sub = el("div", "rank-sub", p.subtitle.text);
    c.appendChild(sub);
    appear(tl, sub, p.subtitle.t, 0.25);
    p.rows.forEach(function (row) {
      var r = el("div", "rank-row");
      var name = el("div", "rank-name", row.name);
      var track = el("div", "rank-track");
      var bar = el("div", "rank-bar");
      track.appendChild(bar);
      r.appendChild(name);
      r.appendChild(track);
      c.appendChild(r);
      appear(tl, r, row.t, 0.25);
      tl.fromTo(bar, { width: "0%" }, { width: row.frac_pct + "%", duration: 0.6, ease: "power2.out" }, row.grow_t);
      if (row.highlight) {
        tl.to(bar, { backgroundColor: row.highlight.color || BAD, duration: 0.2 }, row.highlight.t);
        tl.to(name, { color: ACCENT, duration: 0.2 }, row.highlight.t);
      }
    });
    var lb = el("div", "rank-label");
    p.label.lines.forEach(function (ln) { lb.appendChild(el("div", "rank-label-line", ln)); });
    lb.appendChild(el("div", "rank-label-num", p.label.text));
    c.appendChild(lb);
    appear(tl, lb, p.label.t, 0.3);
  }

  // ---------- stack: one 875 px bar of four segments, a legend, and a message that is replaced as the VO goes on ----------
  function stack(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "stack");
    var c = block(L, "stack-chart");
    c.appendChild(el("div", "stack-title", p.title));
    if (p.subtitle && p.subtitle.text) c.appendChild(el("div", "stack-sub", p.subtitle.text)); // shown from the part start (PRD-14)
    var bar = el("div", "stack-bar");
    var seg = {};
    p.segments.forEach(function (s) {
      var d = el("div", "seg");
      d.style.width = s.pct + "%";
      d.style.background = s.color;
      bar.appendChild(d);
      seg[s.id] = d;
    });
    c.appendChild(bar);
    var legend = el("div", "stack-legend");
    p.segments.forEach(function (s) {
      var item = el("span", "lg");
      var chip = el("span", "chip");
      chip.style.background = s.color;
      item.appendChild(chip);
      item.appendChild(document.createTextNode(s.label));
      legend.appendChild(item);
    });
    c.appendChild(legend);
    // the bar grows in 0.8 s from the part start
    tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: p.bar.grow_s, ease: "power2.out" }, p.from);

    var m = block(L, "stack-message");
    var prevReplace = null;
    var prevOutline = null;
    p.message.forEach(function (msg) {
      var isAdd = msg.mode === "add";
      var n = el("div", "msg " + (isAdd ? "msg-add" : "msg-main"));
      var labelStyle = msg.num ? "msg-label" : "msg-big";
      msg.lines.forEach(function (ln) {
        var ln_el = el("div", (isAdd ? "msg-sub" : labelStyle), ln);
        if (msg.color) ln_el.style.color = msg.color;
        n.appendChild(ln_el);
      });
      if (msg.num) {
        var num = el("div", "msg-num", msg.num.text);
        num.style.color = msg.num.color;
        n.appendChild(num);
      }
      m.appendChild(n);
      appear(tl, n, msg.t, 0.25);
      if (!isAdd && prevReplace) tl.to(prevReplace, { opacity: 0, duration: 0.15 }, msg.t);
      if (!isAdd) prevReplace = n;
      if (msg.outline) {
        tl.set(seg[msg.outline], { outlineStyle: "solid" }, msg.t);
        if (prevOutline && prevOutline !== msg.outline) tl.set(seg[prevOutline], { outlineStyle: "none" }, msg.t);
        prevOutline = msg.outline;
      }
    });
  }

  // End of the last spoken word that ends at or before t. The caption words cover every word of the VO.
  function lastWordEndBefore(cfg, t) {
    var last = null;
    cfg.captions.forEach(function (c) {
      c.words.forEach(function (w) {
        if (w.end <= t + 1e-9 && (last === null || w.end > last)) last = w.end;
      });
    });
    return last;
  }

  // ---------- close: the closing line, then "SELAMAT ..."; the block fades out before the card cue, and the card appears ----------
  function close(tl, sec, p, sc, cfg) {
    var L = layer(tl, sec, p, sc, "close");
    if (p.block.length) {
      var b = block(L, "close");
      // allowed to overlap only while it fades out (lint j exempts it while its opacity is below 1)
      b.setAttribute("data-layout-allow-overlap", "");
      p.block.forEach(function (it, i) {
        var n = el("div", i === 0 ? "close-item" : "close-item close-add");
        it.lines.forEach(function (ln) {
          n.appendChild(el("div", i === 0 ? "close-line" : "close-sub", ln));
        });
        b.appendChild(n);
        appear(tl, n, it.t, 0.3);
      });
      // fade from the end of the last spoken word before the card cue to the cue (PRD-15);
      // a gap under 0.1 s fades over the 0.1 s that end at the cue
      var last = lastWordEndBefore(cfg, p.card.t);
      var fadeFrom = last !== null && p.card.t - last >= 0.1 ? last : p.card.t - 0.1;
      tl.to(b, { opacity: 0, duration: p.card.t - fadeFrom, ease: "power1.in" }, fadeFrom);
    }

    var cta = block(L, "cta");
    if (p.card.kicker) cta.appendChild(el("div", "cta-kicker", p.card.kicker)); // PRD-25: a word above the handle
    cta.appendChild(el("div", "cta-pill", p.card.cta));
    appear(tl, cta, p.card.t, 0.3);

    if (p.card.sources) { // no sources line when the card has none (PRD-25)
      var src = block(L, "sources");
      src.appendChild(el("div", "cite sources-line", p.card.sources));
      appear(tl, src, p.card.t, 0.3);
    }
  }

  // ---------- PRD-26 diagrams: each part is one text block (data-tb, class dg) holding its labels (.dl) and one SVG drawing.
  // Labels are HTML; drawings are SVG at 875 x 900 px inside the hero band (y 420..1320). Times come from the resolved cues.
  var NS = "http://www.w3.org/2000/svg";
  var GROUND = "#0B1B3F";
  var PANEL = "#1B4FA8";
  var WIRE = "#9fb2cc";

  function sv(parent, tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    parent.appendChild(n);
    return n;
  }
  function svgIn(parent, w, h) {
    var s = sv(parent, "svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, "class": "dg-svg" });
    s.style.width = w + "px";
    s.style.height = h + "px";
    return s;
  }
  // a label at (x, y) in its parent; w (optional) sets the width and centres the text; px is the font size
  function txt(parent, text, cls, x, y, w, px) {
    var d = el("div", "dl " + cls, text);
    d.style.left = x + "px";
    d.style.top = y + "px";
    if (w) { d.style.width = w + "px"; d.style.textAlign = "center"; }
    if (px) d.style.fontSize = px + "px";
    parent.appendChild(d);
    return d;
  }
  // a centred label with a badge (bordered pill) or a tag (accent box) around its text
  function boxed(parent, text, cls, x, y, w, px) {
    var c = txt(parent, "", "", x, y, w, px);
    c.appendChild(el("span", cls, text));
    return c;
  }
  // a line or path drawn from nothing (pathLength 1): dash offset 1 -> 0 over dur seconds from t
  function draw(tl, node, t, dur) {
    node.setAttribute("pathLength", "1");
    node.style.strokeDasharray = "1";
    tl.fromTo(node, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur, ease: "power1.inOut" }, t);
  }
  function fadeIn(tl, node, t, dur) {
    tl.fromTo(node, { opacity: 0 }, { opacity: 1, duration: dur || 0.3, ease: "power1.out" }, t);
  }
  function diagram(L, id) {
    var b = block(L, id);
    b.classList.add("dg");
    return b;
  }
  // a dot that travels a route (points in drawing px) from its start point, one tween per leg, at speed px/s
  function travel(tl, dot, route, t0, speed) {
    var tc = t0;
    tl.set(dot, { opacity: 1 }, t0);
    for (var i = 1; i < route.length; i++) {
      var len = Math.abs(route[i][0] - route[i - 1][0]) + Math.abs(route[i][1] - route[i - 1][1]);
      tl.to(dot, { x: route[i][0] - route[0][0], y: route[i][1] - route[0][1], duration: len / speed, ease: "none" }, tc);
      tc += len / speed;
    }
    tl.to(dot, { opacity: 0, duration: 0.1 }, tc);
  }

  // ---------- pncell (s2): the cell cross-section (600 px wide), photons, the junction glow, the wire loop and the bulb (PRD-27) ----------
  // svg coordinates: x 0 = frame x 65, y 0 = frame y 420. Cell x 120..720; bulb centre x 800.
  function pncell(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "pncell");
    var b = diagram(L, "pncell");
    txt(b, p.headline, "disp", 0, 0, 875, 96);
    var s = svgIn(b, 875, 900);

    // photons: wave arrows falling onto the cell in pulses until the part ends (deterministic)
    var photons = [180, 260, 340, 420, 500, 580, 660].map(function (x) {
      var outer = sv(s, "g", { transform: "translate(" + x + " 100)" });
      var g = sv(outer, "g", {});
      sv(g, "path", { d: "M0 0 q-12 14 0 28 t0 28 t0 28", fill: "none", stroke: ACCENT, "stroke-width": 6, "stroke-linecap": "round" });
      sv(g, "polygon", { points: "-12,70 12,70 0,88", fill: ACCENT });
      return g;
    });
    for (var k = 0; p.from + k * 1.2 + 0.2 < p.to; k++) {
      photons.forEach(function (g, j) {
        var t = p.from + 0.2 + k * 1.2 + j * 0.12;
        if (t + 0.6 > p.to) return;
        tl.fromTo(g, { opacity: 0, y: 0 }, { opacity: 1, y: 45, duration: 0.5, ease: "power1.in" }, t);
        tl.to(g, { opacity: 0, duration: 0.1 }, t + 0.5);
      });
    }

    // the cell: n on top (x 120..720, y 170..420), p below (y 420..670); the junction between them
    sv(s, "rect", { x: 120, y: 170, width: 600, height: 250, fill: BAD });
    sv(s, "rect", { x: 120, y: 420, width: 600, height: 250, fill: PANEL });
    var glow = sv(s, "rect", { x: 106, y: 399, width: 628, height: 42, rx: 21, fill: ACCENT, opacity: 0 });
    var junction = sv(s, "rect", { x: 120, y: 415, width: 600, height: 10, fill: WIRE });
    [[p.n, 170], [p.p, 420]].forEach(function (lay) {
      var d = txt(b, lay[0], "disp", 120, lay[1], 600, 150);
      d.style.height = "250px";
      d.style.display = "flex";
      d.style.alignItems = "center";
      d.style.justifyContent = "center";
    });
    tl.to(junction, { attr: { fill: ACCENT }, duration: 0.2 }, p.junction.t);
    tl.fromTo(glow, { opacity: 0 }, { opacity: 0.45, duration: 0.4, ease: "power1.out" }, p.junction.t);
    var efek = txt(b, p.efek.text, "body acc", 0, 700, 875, 48);
    fadeIn(tl, efek, p.efek.t);
    var jl = txt(b, p.junction.text, "body", 0, 760, 875, 44);
    fadeIn(tl, jl, p.junction.t);

    // the external loop: n-top wire goes round the left side and along the bottom to the bulb base; p-bottom joins the bottom wire
    var wire1 = sv(s, "path", { d: "M120 220 H40 V840 H790 V430", fill: "none", stroke: WIRE, "stroke-width": 6, "stroke-linejoin": "round" });
    var wire2 = sv(s, "path", { d: "M680 670 V840", fill: "none", stroke: WIRE, "stroke-width": 6, "stroke-linejoin": "round" });
    draw(tl, wire1, p.electron.t, 0.2);
    draw(tl, wire2, p.electron.t, 0.2);
    // bulb: glass 132 px across at (800, 330), base 48 x 34 under it; the bulb is 166 px tall
    var glowB = sv(s, "circle", { cx: 790, cy: 330, r: 76, fill: ACCENT, opacity: 0 });
    var bulbBody = sv(s, "circle", { cx: 790, cy: 330, r: 66, fill: PANEL });
    var bulbFill = sv(s, "circle", { cx: 790, cy: 330, r: 66, fill: ACCENT, opacity: 0 });
    var bulbOutline = sv(s, "circle", { cx: 790, cy: 330, r: 66, fill: "none", stroke: "#ffffff", "stroke-width": 6 });
    var bulbBase = sv(s, "rect", { x: 766, y: 396, width: 48, height: 34, rx: 4, fill: WIRE });
    var filament = sv(s, "path", { d: "M772 356 L778 320 L790 350 L802 320 L808 356", fill: "none", stroke: "#ffffff", "stroke-width": 5, "stroke-linejoin": "round" });
    [bulbBody, bulbOutline, bulbBase, filament].forEach(function (n) { fadeIn(tl, n, p.electron.t, 0.2); });
    tl.fromTo(bulbFill, { opacity: 0 }, { opacity: 1, duration: 0.3 }, p.electron.t + 0.5);
    tl.fromTo(glowB, { opacity: 0 }, { opacity: 0.35, duration: 0.3 }, p.electron.t + 0.5);
    var route = [[120, 220], [40, 220], [40, 840], [790, 840], [790, 430]];
    for (var d = 0; d < 3; d++) {
      var dot = sv(s, "circle", { cx: 120, cy: 220, r: 10, fill: BAD, stroke: "#ffffff", "stroke-width": 2, opacity: 0 });
      travel(tl, dot, route, p.electron.t + 0.1 + d * 0.2, 1100);
    }
  }

  // ---------- contrast (s3): two columns of 400 px (left PV panel -> bolt; right solar thermal collector -> flame, settling at 45%) ----------
  function contrast(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "contrast");
    var b = diagram(L, "contrast");
    var s = svgIn(b, 875, 900);
    sv(s, "line", { x1: 437, y1: 20, x2: 437, y2: 840, stroke: WIRE, "stroke-width": 3, opacity: 0.6 });
    // left column: block x 0..400 (frame 65..465)
    var lh = txt(b, p.left.headline, "disp", 0, 0, 400, 88);
    lh.style.whiteSpace = "normal";
    var pv = sv(s, "g", {});
    sv(pv, "rect", { x: 50, y: 270, width: 300, height: 180, rx: 10, fill: BAD, stroke: WIRE, "stroke-width": 4 });
    [150, 250].forEach(function (x) { sv(pv, "line", { x1: x, y1: 270, x2: x, y2: 450, stroke: GROUND, "stroke-width": 4 }); });
    [330, 390].forEach(function (y) { sv(pv, "line", { x1: 50, y1: y, x2: 350, y2: y, stroke: GROUND, "stroke-width": 4 }); });
    var bolt = sv(s, "polygon", { points: "215,520 150,610 190,610 165,680 250,580 210,580 240,520", fill: ACCENT, opacity: 0 });
    var left = txt(b, p.left.label, "disp acc", 0, 712, 400, 72);
    fadeIn(tl, bolt, p.from + 0.8);
    fadeIn(tl, left, p.from + 0.8);

    // right column (block x 475..875, frame 540..940): appears at its cue, then settles at 45% opacity
    var rh = el("div", "rhalf");
    rh.style.position = "absolute";
    rh.style.left = "475px";
    rh.style.top = "0px";
    rh.style.width = "400px";
    rh.style.height = "900px";
    b.appendChild(rh);
    var rhead = txt(rh, p.right.headline.join(" "), "disp", 0, 0, 400, 88);
    rhead.style.whiteSpace = "normal";
    var rs = svgIn(rh, 400, 900);
    for (var i = 0; i < 5; i++) sv(rs, "rect", { x: 50 + i * 70, y: 330, width: 56, height: 170, rx: 28, fill: PANEL, stroke: WIRE, "stroke-width": 6 });
    sv(rs, "rect", { x: 30, y: 510, width: 340, height: 14, rx: 7, fill: WIRE });
    sv(rs, "path", { d: "M200 560 C150 610 160 670 200 720 C240 670 250 610 200 560 Z", fill: ACCENT });
    txt(rh, p.right.label, "disp acc", 0, 770, 400, 72);
    tl.fromTo(rh, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, p.right.t);
    tl.to(rh, { opacity: 0.45, duration: 0.4, ease: "power1.inOut" }, p.right.t + 0.6);
  }

  // ---------- dcac (s4): vertical chain (PRD-27): PV panel -> DC wire with arrows (DC) -> INVERTER box (360 px) -> AC wave -> house ----------
  // The AC wave leaves the inverter's left side, runs down and then along the bottom (about 680 px wide) to the house.
  function dcac(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "dcac");
    var b = diagram(L, "dcac");
    var head = txt(b, p.headline.text, "disp", 0, 0, 875, 96);
    fadeIn(tl, head, p.headline.t);
    var s = svgIn(b, 875, 900);
    var pat = sv(sv(s, "defs", {}), "pattern", { id: "dcChev", x: 420, y: 0, width: 34, height: 40, patternUnits: "userSpaceOnUse" });
    sv(pat, "path", { d: "M3 12 L17 26 L31 12", fill: "none", stroke: ACCENT, "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" });
    var pv = sv(s, "g", {});
    sv(pv, "rect", { x: 297, y: 150, width: 280, height: 150, rx: 10, fill: BAD, stroke: WIRE, "stroke-width": 4 });
    [357, 437, 517].forEach(function (x) { sv(pv, "line", { x1: x, y1: 150, x2: x, y2: 300, stroke: GROUND, "stroke-width": 4 }); });
    sv(pv, "line", { x1: 297, y1: 225, x2: 577, y2: 225, stroke: GROUND, "stroke-width": 4 });
    sv(s, "line", { x1: 437, y1: 300, x2: 437, y2: 430, stroke: BAD, "stroke-width": 10 });
    sv(s, "rect", { x: 420, y: 300, width: 34, height: 130, fill: "url(#dcChev)" });
    // the arrows move one way: the pattern shifts by one tile (40 px) every 0.5 s, repeated
    tl.fromTo(pat, { attr: { y: 0 } }, { attr: { y: 40 }, duration: 0.5, ease: "none", repeat: 13 }, p.from);
    var dc = txt(b, p.dc.text, "disp acc", 470, 330, 0, 64);
    fadeIn(tl, dc, p.dc.t);
    var inv = el("div", "dl disp acc", p.inverter.text);
    inv.style.cssText += ";left:257px;top:430px;width:360px;height:100px;border:6px solid " + ACCENT + ";background:" + GROUND + ";display:flex;align-items:center;justify-content:center;font-size:52px;";
    b.appendChild(inv);
    tl.fromTo(inv, { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, p.inverter.t);
    // output: left side of the inverter, down the left margin, then the sine wave along the bottom
    var feed = sv(s, "path", { d: "M257 480 H40 V700", fill: "none", stroke: ACCENT, "stroke-width": 8, "stroke-linejoin": "round" });
    var ac = txt(b, p.ac.text, "disp acc", 100, 580, 0, 64);
    fadeIn(tl, ac, p.ac.t);
    var sine = sv(s, "path", { d: "M40 700 q 42 -60 84 0 t 84 0 t 84 0 t 84 0 t 84 0 t 84 0 t 84 0 t 84 0", fill: "none", stroke: ACCENT, "stroke-width": 8, "stroke-linecap": "round" });
    draw(tl, feed, p.ac.t, 0.4);
    draw(tl, sine, p.ac.t + 0.4, 0.8);
    var link = sv(s, "line", { x1: 712, y1: 700, x2: 755, y2: 760, stroke: "#ffffff", "stroke-width": 6 });
    draw(tl, link, p.ac.t + 1.2, 0.2);
    var house = sv(s, "g", {});
    sv(house, "polyline", { points: "755,760 815,692 875,760", fill: "none", stroke: "#ffffff", "stroke-width": 6, "stroke-linejoin": "round" });
    sv(house, "rect", { x: 775, y: 760, width: 80, height: 70, fill: "none", stroke: "#ffffff", "stroke-width": 6 });
    sv(house, "rect", { x: 803, y: 790, width: 24, height: 40, fill: "#ffffff" });
    fadeIn(tl, house, p.ac.t + 1.2);
  }

  // ---------- series (s5): one panel (340 px), 12 V and 5 A; two panels joined in series; the voltage becomes 24 V; 5 A stays (PRD-27) ----------
  function series(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "series");
    var b = diagram(L, "series");
    txt(b, "", "", 0, 0, 875, 44).appendChild(el("span", "tag", p.tag));
    var head = txt(b, p.headline.text, "disp", 0, 80, 875, 130);
    fadeIn(tl, head, p.headline.t);
    var s = svgIn(b, 875, 900);
    // a panel group: 340 x 240 with 4 x 3 cells, a + terminal (accent) at its left top and a - terminal (blue) at its right top
    function panelG(x, y) {
      var g = sv(s, "g", {});
      sv(g, "rect", { x: x, y: y, width: 340, height: 240, rx: 12, fill: PANEL, stroke: BAD, "stroke-width": 5 });
      for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) sv(g, "rect", { x: x + 18 + c * 80, y: y + 18 + r * 76, width: 64, height: 60, rx: 4, fill: BAD });
      sv(g, "line", { x1: x + 30, y1: y - 22, x2: x + 30, y2: y, stroke: WIRE, "stroke-width": 6 });
      sv(g, "line", { x1: x + 310, y1: y - 22, x2: x + 310, y2: y, stroke: WIRE, "stroke-width": 6 });
      sv(g, "circle", { cx: x + 30, cy: y - 22, r: 22, fill: ACCENT });
      sv(g, "circle", { cx: x + 310, cy: y - 22, r: 22, fill: BAD });
      sv(g, "path", { d: "M" + (x + 20) + " " + (y - 22) + " H" + (x + 40) + " M" + (x + 30) + " " + (y - 32) + " V" + (y - 12), stroke: GROUND, "stroke-width": 4 });
      sv(g, "path", { d: "M" + (x + 300) + " " + (y - 22) + " H" + (x + 320), stroke: GROUND, "stroke-width": 4 });
      return g;
    }
    var g1 = panelG(267, 280);
    var g2 = panelG(480, 280);
    g2.setAttribute("opacity", "0");
    tl.fromTo(g1, { x: 0 }, { x: -227, duration: 0.6, ease: "power2.inOut" }, p.panel2.t);
    tl.fromTo(g2, { x: 300, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, p.panel2.t);
    // the series wire: from the - terminal of panel 1 (x 350) to the + terminal of panel 2 (x 510)
    var wire = sv(s, "line", { x1: 350, y1: 258, x2: 510, y2: 258, stroke: BAD, "stroke-width": 8 });
    draw(tl, wire, p.panel2.t + 0.6, 0.4);

    var v12 = txt(b, p.v12.text, "disp", 0, 600, 440, 180);
    fadeIn(tl, v12, p.v12.t);
    var v24 = txt(b, p.v24.text, "disp acc", 0, 600, 440, 180);
    tl.to(v12, { opacity: 0, duration: 0.15 }, p.v24.t);
    fadeIn(tl, v24, p.v24.t);
    var a5 = txt(b, p.a5.text, "disp", 440, 600, 435, 180);
    fadeIn(tl, a5, p.a5.t);
    var tetap = boxed(b, p.tetap.text, "badge", 440, 800, 435, 44);
    fadeIn(tl, tetap, p.tetap.t);
  }

  // ---------- parallel (s6): three panels (420 px) between a + bus (accent, left) and a - bus (blue, right); 12 V stays; 15 A rises (PRD-27) ----------
  function parallel(tl, sec, p, sc) {
    var L = layer(tl, sec, p, sc, "parallel");
    var b = diagram(L, "parallel");
    txt(b, p.headline, "disp", 0, 0, 875, 110);
    var s = svgIn(b, 875, 900);
    var busP = sv(s, "line", { x1: 180, y1: 150, x2: 180, y2: 590, stroke: ACCENT, "stroke-width": 12, "stroke-linecap": "round" });
    var busN = sv(s, "line", { x1: 695, y1: 150, x2: 695, y2: 590, stroke: BAD, "stroke-width": 12, "stroke-linecap": "round" });
    draw(tl, busP, p.bus.t, 0.6);
    draw(tl, busN, p.bus.t, 0.6);
    for (var k = 0; k < 3; k++) {
      var y = 150 + k * 160;
      var g = sv(s, "g", {});
      sv(g, "rect", { x: 228, y: y, width: 420, height: 120, rx: 8, fill: PANEL, stroke: BAD, "stroke-width": 4 });
      for (var r = 0; r < 2; r++) for (var c = 0; c < 6; c++) sv(g, "rect", { x: 244 + c * 66, y: y + 16 + r * 56, width: 56, height: 44, rx: 3, fill: BAD });
      var wp = sv(s, "line", { x1: 180, y1: y + 60, x2: 228, y2: y + 60, stroke: ACCENT, "stroke-width": 6 });
      var wn = sv(s, "line", { x1: 648, y1: y + 60, x2: 695, y2: y + 60, stroke: BAD, "stroke-width": 6 });
      fadeIn(tl, g, p.bus.t);
      draw(tl, wp, p.bus.t + 0.2 + k * 0.1, 0.3);
      draw(tl, wn, p.bus.t + 0.2 + k * 0.1, 0.3);
    }
    // the current: dots climb both buses at the 15 A cue
    [[180, ACCENT], [695, BAD]].forEach(function (bus) {
      for (var d = 0; d < 2; d++) {
        var dot = sv(s, "circle", { cx: bus[0], cy: 590, r: 10, fill: bus[1], stroke: "#ffffff", "stroke-width": 2, opacity: 0 });
        var t0 = p.a15.t + d * 0.2;
        tl.set(dot, { opacity: 1 }, t0);
        tl.to(dot, { y: -460, duration: 0.7, ease: "none" }, t0);
        tl.to(dot, { opacity: 0, duration: 0.1 }, t0 + 0.7);
      }
    });
    var v12 = txt(b, p.v12.text, "disp", 0, 630, 440, 160);
    fadeIn(tl, v12, p.v12.t);
    var tetap = boxed(b, p.tetap.text, "badge", 0, 800, 440, 44);
    fadeIn(tl, tetap, p.tetap.t);
    var a15 = txt(b, p.a15.text, "disp acc", 440, 630, 435, 160);
    fadeIn(tl, a15, p.a15.t);
  }

  var BUILDERS = {
    claim: claim,
    pair: pair,
    grid: grid,
    textcard: textcard,
    rankbars: rankbars,
    stack: stack,
    close: close,
    pncell: pncell,
    contrast: contrast,
    dcac: dcac,
    series: series,
    parallel: parallel,
  };

  // Captions: each chunk shows and hides on its word times; each word takes the accent colour while spoken.
  // A number run (class "num", sos.css) is invisible in its chunk until its cue (PRD-14): its space is kept, so the line does not jump.
  function captions(tl, cfg) {
    cfg.captions.forEach(function (c, k) {
      var node = document.getElementById("cap-" + k);
      if (!node) throw new Error("SOS: missing caption " + k);
      tl.set(node, { autoAlpha: 1 }, c.start);
      tl.set(node, { autoAlpha: 0 }, c.end);
      c.words.forEach(function (w) {
        var span = document.getElementById("cw-" + w.i);
        if (!span) throw new Error("SOS: missing caption word " + w.i);
        if (w.num) tl.set(span, { opacity: 1 }, w.start);
        tl.set(span, { color: ACCENT }, w.start);
        tl.set(span, { color: CAP_BASE }, w.end);
      });
    });
  }

  function brand(tl, cfg) {
    var node = document.getElementById("overlay-brand");
    if (!node) throw new Error("SOS: missing brand tag");
    tl.fromTo(node, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, cfg.brand.t);
  }

  // ---------- master builder ----------
  function build(cfg) {
    var tl = global.gsap.timeline({ paused: true });
    cfg.scenes.forEach(function (sc) {
      var sec = document.querySelector('section.scene[data-index="' + sc.index + '"]');
      if (!sec) throw new Error("SOS: missing section for scene " + sc.index);
      // Scenes fade in over 0.2 s at their start (scene 1 is visible at 0) and out over 0.2 s before their end.
      if (sc.start > 0) tl.fromTo(sec, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, sc.start);
      tl.to(sec, { opacity: 0, duration: 0.2, ease: "power1.in" }, sc.end - 0.2);
      sc.parts.forEach(function (p) {
        var f = BUILDERS[p.type];
        if (!f) throw new Error("SOS: no builder for part type " + p.type);
        f(tl, sec, p, sc, cfg);
      });
    });
    captions(tl, cfg);
    brand(tl, cfg);
    return tl;
  }

  global.SOS = { build: build };
})(window);
