import type { Track } from "@song/music-sources";
import { describe, expect, it } from "vitest";
import {
  enqueue,
  move,
  playNext,
  removeAt,
  shuffleUpcoming,
  shuffled,
  unshuffle,
} from "./queue.js";

const t = (id: string): Track => ({
  id,
  source: "audius",
  title: id,
  durationSec: 1,
  artist: { id: "a", source: "audius", name: "A" },
  artwork: {},
  streamable: true,
});
const q = (...xs: string[]) => xs.map(t);
const ids = (ts: Track[]) => ts.map((x) => x.id);

describe("queue operations", () => {
  it("shuffles deterministically with an injected random", () => {
    expect(shuffled([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });

  it("move keeps the current track in focus", () => {
    const s = { queue: q("a", "b", "c", "d"), index: 1 };
    expect(move(s, 1, 3)).toMatchObject({ index: 3 }); // moved the current one
    expect(move(s, 0, 2).index).toBe(0); // something before → after current
    expect(move(s, 3, 0).index).toBe(2); // something after → before current
    expect(move(s, 9, 0)).toBe(s); // out of range is a no-op
  });

  it("removeAt never removes the current track", () => {
    const s = { queue: q("a", "b", "c"), index: 1 };
    expect(removeAt(s, 1)).toBe(s);
    expect(removeAt(s, 0)).toMatchObject({ index: 0 });
    expect(ids(removeAt(s, 2).queue)).toEqual(["a", "b"]);
  });

  it("keeps the pre-shuffle order in sync while shuffled", () => {
    const base = { queue: q("a", "b", "c", "d"), index: 0 };
    let s = shuffleUpcoming(base, () => 0);
    s = enqueue(s, q("e"));
    s = playNext(s, q("n"));
    const restored = unshuffle(s);
    expect(ids(restored.queue)).toEqual(["a", "n", "b", "c", "d", "e"]);
    expect(restored.index).toBe(0);
    expect(restored.original).toBeUndefined();
  });

  it("removing while shuffled drops the track from the original order too", () => {
    const s = shuffleUpcoming({ queue: q("a", "b", "c"), index: 0 }, () => 0);
    const at = s.queue.findIndex((x) => x.id === "b");
    expect(ids(unshuffle(removeAt(s, at)).queue)).toEqual(["a", "c"]);
  });
});
