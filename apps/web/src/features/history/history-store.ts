import { isObj, isTrack, storage } from "@/shared/storage";
import type { Track } from "@song/music-sources";

export interface Listen {
  track: Track;
  playedAt: number;
}

/**
 * Where listening history lives. Today: this browser. In phase 2 a Supabase
 * implementation of the same interface syncs it to the signed-in account,
 * without the UI changing.
 */
export interface HistoryRepository {
  list: () => Listen[];
  add(track: Track, at?: number): void;
  clear(): void;
  subscribe: (listener: () => void) => () => void;
}

const KEY = "history:v1";
export const MAX_LISTENS = 500;
/** A replay of the same track within this window counts once. */
export const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

const parse = (raw: unknown): Listen[] | null =>
  Array.isArray(raw)
    ? raw.filter((l): l is Listen => isObj(l) && isTrack(l.track) && typeof l.playedAt === "number")
    : null;

/** Pure: prepend a listen, collapsing quick replays and capping the size. */
export function addListen(list: Listen[], track: Track, at: number): Listen[] {
  const last = list[0];
  if (last?.track.id === track.id && at - last.playedAt < DEDUPE_WINDOW_MS) {
    return [{ track, playedAt: at }, ...list.slice(1)];
  }
  return [{ track, playedAt: at }, ...list].slice(0, MAX_LISTENS);
}

/** Most recent listen per track, newest first. */
export function uniqueRecent(list: Listen[], limit: number): Track[] {
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const l of list) {
    if (seen.has(l.track.id)) continue;
    seen.add(l.track.id);
    out.push(l.track);
    if (out.length === limit) break;
  }
  return out;
}

export function createLocalHistory(): HistoryRepository {
  const listeners = new Set<() => void>();
  let cache: Listen[] | undefined;
  const read = () => {
    cache ??= storage.get(KEY, parse) ?? [];
    return cache;
  };
  const write = (next: Listen[]) => {
    cache = next;
    storage.set(KEY, next);
    for (const l of listeners) l();
  };

  // Keep tabs in sync.
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== `song:${KEY}`) return;
      cache = undefined;
      for (const l of listeners) l();
    });
  }

  return {
    list: read,
    add: (track, at = Date.now()) => {
      write(addListen(read(), track, at));
    },
    clear: () => {
      write([]);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
