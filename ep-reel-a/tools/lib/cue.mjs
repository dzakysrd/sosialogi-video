// Word-cue resolver. A cue is the start time of the next EXACT token match of a word (or word sequence)
// after a given time. Normalisation: lowercase, split on anything that is not a letter or digit
// (so "Rata-rata" -> ["rata","rata"], "UMP-nya" -> ["ump","nya"]). No prefix matching.

const SPLIT = /[^\p{L}\p{N}]+/u;

export function tokenize(words) {
  const toks = [];
  for (const w of words) {
    for (const t of String(w.text).toLowerCase().split(SPLIT)) {
      if (t) toks.push({ t, start: w.start, end: w.end });
    }
  }
  return toks;
}

export function phraseTokens(phrase) {
  return String(phrase).toLowerCase().split(SPLIT).filter(Boolean);
}

// Returns { cueSpan(word, after) -> {time, end, index}, cue(word, after) -> time }.
export function makeCue(words) {
  const toks = tokenize(words);

  function cueSpan(word, after = -Infinity) {
    const pt = phraseTokens(word);
    if (pt.length === 0) throw new Error(`cue "${word}" is empty after normalisation`);
    for (let i = 0; i + pt.length <= toks.length; i++) {
      if (toks[i].start <= after) continue;
      let ok = true;
      for (let j = 0; j < pt.length; j++) {
        if (toks[i + j].t !== pt[j]) { ok = false; break; }
      }
      if (ok) return { time: toks[i].start, end: toks[i + pt.length - 1].end, index: i };
    }
    throw new Error(`cue "${word}" not found after ${after}`);
  }

  const cue = (word, after) => cueSpan(word, after).time;
  return { cue, cueSpan, toks };
}
