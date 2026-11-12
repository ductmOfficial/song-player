import { asTracks, isObj, storage } from "@/shared/storage";
import type { PersistedPlayer, RepeatMode } from "@song/player-core";

const KEY = "player:v1";
/** Keep storage small; a queue longer than this is trimmed around the current track. */
const MAX_QUEUE = 200;

export type PersistedSession = PersistedPlayer & { volume: number; muted: boolean };

const repeatModes: RepeatMode[] = ["off", "all", "one"];

function parse(raw: unknown): PersistedSession | null {
  if (!isObj(raw)) return null;
  const queue = asTracks(raw.queue);
  const original = raw.original === undefined ? undefined : asTracks(raw.original);
  if (!queue || original === null) return null;
  return {
    queue,
    original: original ?? undefined,
    index: typeof raw.index === "number" ? raw.index : 0,
    repeat: repeatModes.includes(raw.repeat as RepeatMode) ? (raw.repeat as RepeatMode) : "off",
    shuffle: raw.shuffle === true,
    volume: typeof raw.volume === "number" ? raw.volume : 1,
    muted: raw.muted === true,
  };
}

export const loadSession = () => storage.get(KEY, parse);

export function saveSession(s: PersistedSession) {
  let { queue, index, original } = s;
  if (queue.length > MAX_QUEUE) {
    const start = Math.max(0, Math.min(index - 20, queue.length - MAX_QUEUE));
    queue = queue.slice(start, start + MAX_QUEUE);
    index -= start;
    original = undefined; // can't trim both consistently; shuffle order survives, restore order doesn't
  }
  storage.set(KEY, { ...s, queue, index, original });
}
