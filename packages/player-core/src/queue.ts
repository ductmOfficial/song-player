import type { Track } from "@song/music-sources";

/**
 * Pure queue operations. The machine calls these from `assign`, tests call
 * them directly. Every function returns new arrays; nothing mutates.
 */
export interface QueueState {
  queue: Track[];
  index: number;
  /** The order before shuffle was turned on, restored when it's turned off. */
  original?: Track[];
}

export type Random = () => number;

/** Fisher–Yates with an injectable random source. */
export function shuffled<T>(items: readonly T[], random: Random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Shuffle only what's still to come, so the current track keeps playing and
 * the queue panel shows the real upcoming order (no hidden "play order").
 */
export function shuffleUpcoming(s: QueueState, random?: Random): QueueState {
  const head = s.queue.slice(0, s.index + 1);
  const rest = s.queue.slice(s.index + 1);
  return { queue: [...head, ...shuffled(rest, random)], index: s.index, original: s.queue };
}

export function unshuffle(s: QueueState): QueueState {
  if (!s.original) return s;
  const current = s.queue[s.index];
  // Keep tracks added while shuffled (they're appended to `original` too).
  const index = current ? s.original.findIndex((t) => t.id === current.id) : -1;
  return { queue: s.original, index: index === -1 ? 0 : index, original: undefined };
}

export function enqueue(s: QueueState, tracks: Track[]): QueueState {
  return {
    queue: [...s.queue, ...tracks],
    index: s.index,
    original: s.original ? [...s.original, ...tracks] : undefined,
  };
}

/** Insert right after the current track. */
export function playNext(s: QueueState, tracks: Track[]): QueueState {
  const at = s.queue.length === 0 ? 0 : s.index + 1;
  const queue = [...s.queue.slice(0, at), ...tracks, ...s.queue.slice(at)];
  let original = s.original;
  if (original) {
    const current = s.queue[s.index];
    const oi = current ? original.findIndex((t) => t.id === current.id) + 1 : 0;
    original = [...original.slice(0, oi), ...tracks, ...original.slice(oi)];
  }
  return { queue, index: s.index, original };
}

/** Remove an upcoming or past track. The current track can't be removed. */
export function removeAt(s: QueueState, at: number): QueueState {
  if (at === s.index || at < 0 || at >= s.queue.length) return s;
  const removed = s.queue[at];
  if (removed === undefined) return s;
  const queue = s.queue.filter((_, i) => i !== at);
  let original = s.original;
  if (original) {
    const oi = original.indexOf(removed);
    original = oi === -1 ? original : original.filter((_, i) => i !== oi);
  }
  return { queue, index: at < s.index ? s.index - 1 : s.index, original };
}

/** Move a track, keeping the current track's identity. */
export function move(s: QueueState, from: number, to: number): QueueState {
  const n = s.queue.length;
  if (from === to || from < 0 || from >= n || to < 0 || to >= n) return s;
  const queue = [...s.queue];
  const [item] = queue.splice(from, 1);
  if (item === undefined) return s;
  queue.splice(to, 0, item);
  let index = s.index;
  if (from === s.index) index = to;
  else if (from < s.index && to >= s.index) index -= 1;
  else if (from > s.index && to <= s.index) index += 1;
  return { queue, index, original: s.original };
}

/** Drop everything after the current track. */
export function clearUpcoming(s: QueueState): QueueState {
  const queue = s.queue.slice(0, s.index + 1);
  return { queue, index: s.index, original: undefined };
}
