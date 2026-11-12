import type { Track } from "@song/music-sources";

/**
 * localStorage that never throws (private mode, quota, disabled storage).
 * Keys are namespaced: localhost ports are shared between projects.
 */
export const storage = {
  get<T>(key: string, parse: (raw: unknown) => T | null): T | null {
    try {
      const raw = window.localStorage.getItem(`song:${key}`);
      return raw ? parse(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(`song:${key}`, JSON.stringify(value));
    } catch {
      /* storage full or unavailable: persistence is best-effort */
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(`song:${key}`);
    } catch {
      /* storage unavailable: nothing to remove */
    }
  },
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Structural check for tracks read back from storage (they may predate a schema change). */
export function isTrack(v: unknown): v is Track {
  return (
    isObj(v) &&
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.durationSec === "number" &&
    typeof v.streamable === "boolean" &&
    isObj(v.artist) &&
    typeof v.artist.name === "string" &&
    isObj(v.artwork)
  );
}

export const asTracks = (v: unknown): Track[] | null =>
  Array.isArray(v) && v.every(isTrack) ? v : null;

export { isObj };
