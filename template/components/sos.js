/* SOS components v1: reusable scene builders for the Sosialogi-style data explainer.
 *
 * Plain browser script, loaded after vendor/gsap.min.js. No network, no randomness.
 * Each builder appends DOM inside its scene <section> and adds tweens to ONE paused master
 * timeline at ABSOLUTE times (scene start + offset), so any frame can be seeked deterministically.
 *
 * Public API: window.SOS.build(cfg) -> paused GSAP timeline (cfg = scenes.json normalised by tools/build.mjs).
 * Scene types: title, map, bignumber, bars. Overlays (brand tag, DEMO badge, source line, captions)
 * are static DOM written by the build and animated here.
 */
(function (global) {
  "use strict";

  // ---------- helpers ----------
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  var toneCache = {};
  function toneColor(tone) {
    var name = { good: "--good", bad: "--bad", neutral: "--neutral", ink: "--ink", accent: "--accent" }[tone] || "--neutral";
    if (!toneCache[name]) {
      toneCache[name] = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    return toneCache[name];
  }

  // Indonesian number format: "." for thousands, "," for decimals.
  function groupThousands(digits) {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function fmtFull(v) {
    return (v < 0 ? "-" : "") + "Rp" + groupThousands(String(Math.round(Math.abs(v))));
  }
  function fmtShort(v) {
    return (v < 0 ? "-" : "") + "Rp" + (Math.abs(v) / 1e6).toFixed(2).replace(".", ",") + " jt";
  }
  function fmt(v, format) {
    return format === "short" ? fmtShort(v) : fmtFull(v);
  }

  // Count-up = GSAP property tween on textContent with a formatting modifier.
  // Property tweens are re-applied on every seek. onUpdate callbacks are not guaranteed
  // during seeks (the runtime seeks with suppressEvents), so do not use them for text.
  function countUp(tl, node, to, format, at, dur) {
    tl.fromTo(
      node,
      { textContent: 0 },
      {
        textContent: to,
        duration: dur,
        ease: "power2.out",
        modifiers: {
          textContent: function (v) {
            return fmt(parseFloat(v), format);
          },
        },
      },
      at
    );
  }

  // ---------- TitleCard ----------
  // s: { text, kicker? }   Words wrapped in *asterisks* are drawn in the accent colour.
  function TitleCard(tl, sec, s, t0) {
    var wrap = make("div", "title-card");
    if (s.kicker) wrap.appendChild(make("div", "kicker", s.kicker));

    var head = make("h1", "title-text");
    var words = String(s.text).split(/\s+/).filter(Boolean);
    words.forEach(function (raw, i) {
      var accent = /^\*.+\*$/.test(raw);
      head.appendChild(make("span", "word" + (accent ? " accent" : ""), raw.replace(/\*/g, "")));
      if (i < words.length - 1) head.appendChild(document.createTextNode(" "));
    });
    wrap.appendChild(head);
    sec.appendChild(wrap);

    var kicker = wrap.querySelector(".kicker");
    if (kicker) {
      tl.fromTo(kicker, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, t0 + 0.05);
    }
    // Words pop in one by one from a visible start state, so frame 0 already shows the hook.
    tl.fromTo(
      head.querySelectorAll(".word"),
      { opacity: 0.5, y: 40, scale: 0.85 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)", stagger: 0.12 },
      t0
    );
  }

  // ---------- MapHighlight ----------
  // s: { title?, format?, focus?: "provinces" | "all" | [ids], provinces: [{id, value, tone, pos?}] }
  //   pos: above | below | left | right  (where the label sits relative to the province point)
  var MAP_W = 880; // px, fits the safe box
  var MAP_PAD = 36; // map units of breathing room around the zoom target
  var MAP_MAX_ZOOM = 4;

  function MapHighlight(tl, sec, s, t0) {
    var tpl = document.getElementById("map-svg");
    var svg = document.importNode(tpl.content.querySelector("svg"), true);
    var vb = svg.getAttribute("viewBox").trim().split(/\s+/).map(Number); // [x, y, w, h]
    var mapH = MAP_W * (vb[3] / vb[2]);

    var block = make("div", "map-block");
    if (s.title) block.appendChild(make("div", "block-title", s.title));
    var frame = make("div", "map-frame");
    frame.style.height = mapH + "px";
    frame.appendChild(svg);
    block.appendChild(frame);
    sec.appendChild(block);

    var byId = {};
    svg.querySelectorAll("path[id]").forEach(function (p) {
      byId[p.id] = p;
    });
    var group = svg.querySelector("#provinces");
    gsapSetInstant(group, { transformOrigin: "0px 0px", scale: 1, x: 0, y: 0 });

    var provinces = s.provinces || [];
    var focusIds;
    if (Array.isArray(s.focus)) focusIds = s.focus;
    else if (s.focus === "all") focusIds = null;
    else focusIds = provinces.map(function (p) { return p.id; });

    // Fill highlighted provinces with their tone colour.
    provinces.forEach(function (p, i) {
      tl.to(byId[p.id], { fill: toneColor(p.tone), duration: 0.5, ease: "power1.out" }, t0 + 0.6 + i * 0.15);
    });

    // Zoom target: union of focus bboxes, in map units.
    var box = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };
    if (focusIds && focusIds.length) {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      focusIds.forEach(function (id) {
        var b = byId[id].getBBox();
        minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
      });
      box = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    var k = Math.min(vb[2] / (box.w + 2 * MAP_PAD), vb[3] / (box.h + 2 * MAP_PAD));
    k = Math.max(1, Math.min(MAP_MAX_ZOOM, k));
    var cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    var tx = vb[0] + vb[2] / 2 - k * cx;
    var ty = vb[1] + vb[3] / 2 - k * cy;

    var zoomAt = t0 + 0.5, zoomDur = 1.3;
    var labelsAt = t0 + 0.6;
    if (k > 1.001) {
      tl.fromTo(group, { scale: 1, x: 0, y: 0 }, { scale: k, x: tx, y: ty, duration: zoomDur, ease: "power3.inOut" }, zoomAt);
      labelsAt = zoomAt + zoomDur + 0.05;
    }

    // Labels and dots sit in frame pixels at the zoomed position (computed once, shown after the zoom).
    var pxPerUnit = MAP_W / vb[2];
    provinces.forEach(function (p, i) {
      var path = byId[p.id];
      var b = path.getBBox();
      var px = b.x + b.width / 2, py = b.y + b.height / 2;
      var sx = (k * px + tx - vb[0]) * pxPerUnit;
      var sy = (k * py + ty - vb[1]) * pxPerUnit;

      var anchor = make("div", "map-anchor");
      anchor.style.left = sx + "px";
      anchor.style.top = sy + "px";
      var dot = make("div", "map-dot");
      dot.style.background = toneColor(p.tone);
      var label = make("div", "map-label pos-" + (p.pos || "above"));
      label.appendChild(make("div", "ml-name", path.getAttribute("data-name")));
      label.appendChild(make("div", "ml-val tone-" + p.tone, fmt(p.value, s.format || "short")));
      anchor.appendChild(dot);
      anchor.appendChild(label);
      frame.appendChild(anchor);

      gsapSetInstant(dot, { xPercent: -50, yPercent: -50 });
      var placement = { above: [-50, -100], below: [-50, 0], left: [-100, -50], right: [0, -50] }[p.pos || "above"];
      gsapSetInstant(label, { xPercent: placement[0], yPercent: placement[1] });

      var at = labelsAt + i * 0.14;
      tl.fromTo(dot, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, at);
      tl.fromTo(label, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, at + 0.05);
    });
  }

  // ---------- BigNumber ----------
  // s: { label, value, format: full|short, alt?: full|short, sublabel?, tone?: ink|good|bad|accent|neutral }
  function BigNumber(tl, sec, s, t0) {
    var format = s.format || "full";
    var box = make("div", "bignum");
    box.appendChild(make("div", "bn-label", s.label || ""));
    var val = make("div", "bn-value tone-" + (s.tone || "ink"), fmt(0, format));
    box.appendChild(val);
    if (s.sublabel) box.appendChild(make("div", "bn-sub", s.sublabel));
    if (s.alt) box.appendChild(make("div", "bn-alt", fmt(s.value, s.alt)));
    sec.appendChild(box);

    tl.fromTo(box.querySelector(".bn-label"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, t0 + 0.05);
    countUp(tl, val, s.value, format, t0 + 0.25, 1.5);
    var sub = box.querySelector(".bn-sub");
    if (sub) tl.fromTo(sub, { opacity: 0 }, { opacity: 1, duration: 0.4 }, t0 + 0.6);
    var alt = box.querySelector(".bn-alt");
    if (alt) tl.fromTo(alt, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, t0 + 1.0);
  }

  // ---------- BarCompare ----------
  // s: { title?, format?, bars: [{label, value, tone?}] (2 to 5) }
  var BAR_MAX_W = 480; // px for the longest bar; leaves room on the right for its value
  function BarCompare(tl, sec, s, t0) {
    var format = s.format || "full";
    var dense = s.bars.length >= 4;
    var box = make("div", "bars" + (dense ? " dense" : ""));
    if (s.title) box.appendChild(make("div", "bars-title", s.title));
    var max = Math.max.apply(null, s.bars.map(function (b) { return b.value; }));

    s.bars.forEach(function (b, i) {
      var row = make("div", "bar-row");
      row.appendChild(make("div", "bar-label", b.label));
      var track = make("div", "bar-track");
      var fill = make("div", "bar-fill tone-" + (b.tone || "neutral"));
      var w = (b.value / max) * BAR_MAX_W;
      var val = make("div", "bar-value", fmt(0, format));
      val.style.left = w + 18 + "px";
      track.appendChild(fill);
      track.appendChild(val);
      row.appendChild(track);
      box.appendChild(row);

      var at = t0 + 0.3 + i * 0.22;
      tl.fromTo(row, { opacity: 0 }, { opacity: 1, duration: 0.25 }, at - 0.1);
      tl.fromTo(fill, { width: 0 }, { width: w, duration: 0.9, ease: "power3.out" }, at);
      countUp(tl, val, b.value, format, at, 0.9);
    });
    sec.appendChild(box);
  }

  var BUILDERS = {
    title: TitleCard,
    map: MapHighlight,
    bignumber: BigNumber,
    bars: BarCompare,
  };

  // ---------- overlays (static DOM from the build; animated here) ----------
  // data-anim="fade": fade in at data-start (persistent items).
  // data-anim="caption": fade + rise in at data-start, fade out before data-start + data-duration.
  function animateOverlays(tl, root) {
    root.querySelectorAll(".overlay").forEach(function (el) {
      var start = parseFloat(el.getAttribute("data-start"));
      var dur = parseFloat(el.getAttribute("data-duration"));
      if (el.getAttribute("data-anim") === "caption") {
        tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, start);
        tl.to(el, { opacity: 0, duration: 0.2, ease: "power1.in" }, start + dur - 0.2);
      } else {
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 }, start);
      }
    });
  }

  // gsap.set with no timeline, applied now (used for static initial state).
  function gsapSetInstant(target, vars) {
    global.gsap.set(target, vars);
  }

  // ---------- master builder ----------
  function build(cfg) {
    var tl = global.gsap.timeline({ paused: true });
    cfg.scenes.forEach(function (s) {
      var sec = document.querySelector('section.scene[data-index="' + s.index + '"]');
      var builder = BUILDERS[s.type];
      if (!sec || !builder) throw new Error("SOS: missing section or builder for scene " + s.index + " (" + s.type + ")");
      // Scenes after the first fade in; scene 0 starts fully visible so frame 0 is not blank.
      if (s.start > 0) tl.fromTo(sec, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, s.start);
      tl.to(sec, { opacity: 0, duration: 0.25, ease: "power1.in" }, s.start + s.duration - 0.25);
      builder(tl, sec, s, s.start, s.duration);
    });
    animateOverlays(tl, document.getElementById("root"));
    return tl;
  }

  global.SOS = { build: build, fmt: { full: fmtFull, short: fmtShort } };
})(window);
