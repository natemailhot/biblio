// Deterministic display name for an anonymous player's leaderboard row —
// same anon_id always produces the same name (so a guest can recognize
// themselves on repeat visits), without ever storing anything: no profile
// row exists for them (profiles.id is FK'd to auth.users, so it can't),
// this is derived purely from a hash of the cookie value at query time.
const ADJECTIVES = [
  "Steadfast", "Faithful", "Watchful", "Humble", "Bold", "Wandering", "Ancient", "Radiant",
  "Weary", "Earnest", "Devoted", "Quiet", "Resolute", "Hopeful", "Patient", "Fervent",
];

const NOUNS = [
  "Pilgrim", "Wanderer", "Seeker", "Shepherd", "Climber", "Disciple", "Scribe", "Traveler",
  "Watchman", "Sojourner", "Herald", "Stranger", "Servant", "Witness", "Voyager", "Keeper",
];

// FNV-1a — fast, stable across runs/platforms, good-enough distribution for
// this (not a security context).
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function deriveAnonUsername(anonId: string): string {
  const h = hashString(anonId);
  const adjective = ADJECTIVES[h % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(h / ADJECTIVES.length) % NOUNS.length];
  const suffix = h % 100;
  return `${adjective}${noun}${suffix}`;
}
