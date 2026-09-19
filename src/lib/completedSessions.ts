// Anonymous local persistence: remembers which daily_set a player has
// already completed, keyed by dailySetId, so returning to the site the same
// day shows their result instead of letting them replay. No account
// required — same mechanic Wordle-style daily games use. Not meant as
// anti-cheat (clearing localStorage or a new browser trivially resets it);
// it's purely a courtesy to avoid re-prompting a returning player.
const STORAGE_KEY = "ascend:completed-sessions";

type CompletedMap = Record<string, string>; // dailySetId -> sessionId

function readMap(): CompletedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompletedMap) : {};
  } catch {
    return {};
  }
}

export function getCompletedSessionId(dailySetId: string): string | null {
  return readMap()[dailySetId] ?? null;
}

export function markSessionCompleted(dailySetId: string, sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = readMap();
    map[dailySetId] = sessionId;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — the
    // player can just replay; not worth surfacing an error for this.
  }
}

export function clearCompletedSession(dailySetId: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = readMap();
    delete map[dailySetId];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
