// Indonesian number words (as TTS speaks them) and the Rupiah display format.
const ONES = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

export function intWords(n) {
  if (!Number.isInteger(n) || n < 0 || n >= 10000) throw new Error(`intWords: unsupported ${n}`);
  if (n < 12) return ONES[n];
  if (n < 20) return `${ONES[n - 10]} belas`;
  if (n < 100) return `${ONES[Math.floor(n / 10)]} puluh${n % 10 ? " " + ONES[n % 10] : ""}`;
  if (n < 200) return `seratus${n % 100 ? " " + intWords(n % 100) : ""}`;
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} ratus${n % 100 ? " " + intWords(n % 100) : ""}`;
  if (n < 2000) return `seribu${n % 1000 ? " " + intWords(n % 1000) : ""}`;
  return `${ONES[Math.floor(n / 1000)]} ribu${n % 1000 ? " " + intWords(n % 1000) : ""}`;
}

// Decimal digits are spoken one by one ("2,32" -> "dua koma tiga dua").
export function digitWords(digits) {
  return digits.split("").map((d) => ONES[Number(d)]).join(" ");
}

// Rupiah short format, as displayed: 5729876 -> "Rp5,73 jt".
export function fmtShort(v) {
  return `Rp${(Math.abs(v) / 1e6).toFixed(2).replace(".", ",")} jt`;
}

// Spoken form of a short Rupiah string: "Rp5,73 jt" -> "lima koma tujuh tiga juta".
export function spokenShort(text) {
  const m = /^Rp(\d+)(?:,(\d+))? jt$/.exec(text);
  if (!m) throw new Error(`spokenShort: not a short Rupiah string: ${text}`);
  return `${intWords(Number(m[1]))}${m[2] ? ` koma ${digitWords(m[2])}` : ""} juta`;
}

// Spoken form of a plain integer token ("7" -> "tujuh", "10" -> "sepuluh", "2026" -> "dua ribu dua puluh enam").
export function spokenInt(text) {
  return intWords(Number(text));
}
