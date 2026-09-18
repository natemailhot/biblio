// Normalizes free-text answer input so that casing, punctuation, apostrophe
// style, whitespace, diacritics, and simple trailing possessives don't
// affect matching. This must stay conservative: it should never merge two
// genuinely different words together.
export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[‘’‛′]/g, "'") // curly quotes -> straight
    .replace(/[^a-z0-9'\s-]/g, "") // drop remaining punctuation
    .replace(/'s\b/g, "") // simple possessive: "moses'" / "moses's" -> "moses"
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
