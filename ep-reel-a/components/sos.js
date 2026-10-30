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

  var BUILDERS = {
    claim: claim,
    pair: pair,
    grid: grid,
    textcard: textcard,
    rankbars: rankbars,
    stack: stack,
    close: close,
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
