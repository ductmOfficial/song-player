import type { Track } from "@song/music-sources";
import { describe, expect, it } from "vitest";
import {
  DEDUPE_WINDOW_MS,
  type Listen,
  MAX_LISTENS,
  addListen,
  uniqueRecent,
} from "./history-store";

const t = (id: string): Track => ({
  id,
  source: "audius",
  title: id,
  durationSec: 1,
  artist: { id: "a", source: "audius", name: "A" },
  artwork: {},
  streamable: true,
});

describe("addListen", () => {
  it("prepends, newest first", () => {
    const list = addListen(addListen([], t("a"), 1), t("b"), 2);
    expect(list.map((l) => l.track.id)).toEqual(["b", "a"]);
  });

  it("collapses a quick replay of the same track", () => {
    const once = addListen([], t("a"), 0);
    expect(addListen(once, t("a"), DEDUPE_WINDOW_MS - 1)).toHaveLength(1);
    expect(addListen(once, t("a"), DEDUPE_WINDOW_MS + 1)).toHaveLength(2);
  });

  it("caps the size", () => {
    let list: Listen[] = [];
    for (let i = 0; i < MAX_LISTENS + 5; i++) list = addListen(list, t(String(i)), i);
    expect(list).toHaveLength(MAX_LISTENS);
    expect(list[0]?.track.id).toBe(String(MAX_LISTENS + 4));
  });
});

describe("uniqueRecent", () => {
  it("keeps the latest listen per track", () => {
    const list: Listen[] = ["a", "b", "a", "c"].map((id, i) => ({
      track: t(id),
      playedAt: 10 - i,
    }));
    expect(uniqueRecent(list, 2).map((x) => x.id)).toEqual(["a", "b"]);
  });
});
