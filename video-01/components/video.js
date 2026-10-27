// Runtime for video-01: turns the op list written by tools/build.mjs into one paused GSAP timeline.
// Plain script, no network, no randomness. Every op is placed at an absolute time (a word cue).
(function (global) {
  "use strict";

  function build(tl, data) {
    data.ops.forEach(function (o) {
      var targets = document.querySelectorAll(o.sel);
      if (!targets.length) throw new Error("video-01: no element for " + o.sel);
      var t = o.t;
      var d = o.d == null ? 0 : o.d;
      var ease = o.ease || "power2.out";
      if (o.kind === "set") {
        tl.set(targets, o.vars, t);
      } else if (o.kind === "fromTo") {
        tl.fromTo(targets, o.from, Object.assign({ duration: d, ease: ease, immediateRender: false }, o.vars), t);
      } else if (o.kind === "text") {
        tl.set(targets, { textContent: o.text }, t);
      } else {
        throw new Error("video-01: unknown op kind " + o.kind);
      }
    });
    return tl;
  }

  global.VideoBuild = build;
})(window);
