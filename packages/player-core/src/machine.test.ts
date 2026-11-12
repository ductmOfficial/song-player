import type { Track } from "@song/music-sources";
import { describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";
import { nextIndex, playerMachine } from "./machine.js";

const track = (id: string): Track => ({
  id,
  source: "audius",
  title: id,
  durationSec: 100,
  artist: { id: "a", source: "audius", name: "A" },
  artwork: {},
  streamable: true,
});
const tracks = [track("1"), track("2"), track("3")];
const ids = (ts: Track[]) => ts.map((t) => t.id);

function start() {
  const loadTrack = vi.fn();
  const unloadAudio = vi.fn();
  const actor = createActor(playerMachine.provide({ actions: { loadTrack, unloadAudio } })).start();
  return { actor, loadTrack, unloadAudio, ctx: () => actor.getSnapshot().context };
}

describe("playerMachine", () => {
  it("loads a queue, plays when ready, and toggles", () => {
    const { actor, loadTrack } = start();
    actor.send({ type: "LOAD_QUEUE", tracks, startIndex: 1 });
    expect(actor.getSnapshot().value).toBe("loading");
    expect(loadTrack).toHaveBeenCalledOnce();

    actor.send({ type: "READY" });
    expect(actor.getSnapshot().value).toBe("playing");
    actor.send({ type: "TOGGLE" });
    expect(actor.getSnapshot().value).toBe("paused");
  });

  it("ignores an empty queue", () => {
    const { actor } = start();
    actor.send({ type: "LOAD_QUEUE", tracks: [] });
    expect(actor.getSnapshot().value).toBe("idle");
  });

  it("advances on ENDED and stops at the end without repeat", () => {
    const { actor, ctx } = start();
    actor.send({ type: "LOAD_QUEUE", tracks, startIndex: 2 });
    actor.send({ type: "READY" });
    actor.send({ type: "ENDED" });
    expect(actor.getSnapshot().value).toBe("paused");
    expect(ctx().index).toBe(2);
  });

  it("wraps around with repeat all", () => {
    const { actor, ctx } = start();
    actor.send({ type: "SET_REPEAT", mode: "all" });
    actor.send({ type: "LOAD_QUEUE", tracks, startIndex: 2 });
    actor.send({ type: "READY" });
    actor.send({ type: "ENDED" });
    expect(actor.getSnapshot().value).toBe("loading");
    expect(ctx().index).toBe(0);
  });

  it("keeps the same track with repeat one", () => {
    const { actor, ctx } = start();
    actor.send({ type: "SET_REPEAT", mode: "one" });
    actor.send({ type: "LOAD_QUEUE", tracks });
    actor.send({ type: "READY" });
    actor.send({ type: "ENDED" });
    expect(actor.getSnapshot().value).toBe("playing");
    expect(ctx().index).toBe(0);
  });

  it("cycles repeat off → all → one → off", () => {
    const { actor, ctx } = start();
    const seen = [1, 2, 3].map(() => {
      actor.send({ type: "CYCLE_REPEAT" });
      return ctx().repeat;
    });
    expect(seen).toEqual(["all", "one", "off"]);
  });

  it("records errors and recovers on PLAY", () => {
    const { actor, loadTrack, ctx } = start();
    actor.send({ type: "LOAD_QUEUE", tracks });
    actor.send({ type: "ERROR", message: "stream 403" });
    expect(actor.getSnapshot().value).toBe("error");
    expect(ctx().error).toBe("stream 403");

    actor.send({ type: "PLAY" });
    expect(actor.getSnapshot().value).toBe("loading");
    expect(ctx().error).toBeUndefined();
    expect(loadTrack).toHaveBeenCalledTimes(2);
  });

  it("jumps to a queued track, and restarts when jumping to the current one", () => {
    const { actor, loadTrack, ctx } = start();
    actor.send({ type: "LOAD_QUEUE", tracks });
    actor.send({ type: "READY" });
    actor.send({ type: "JUMP", index: 2 });
    expect(ctx().index).toBe(2);
    expect(actor.getSnapshot().value).toBe("loading");
    expect(loadTrack).toHaveBeenCalledTimes(2);

    actor.send({ type: "READY" });
    actor.send({ type: "JUMP", index: 2 });
    expect(actor.getSnapshot().value).toBe("playing");
    expect(loadTrack).toHaveBeenCalledTimes(2);
  });

  it("enqueues into an empty player without starting playback", () => {
    const { actor, loadTrack, ctx } = start();
    actor.send({ type: "ENQUEUE", tracks });
    expect(actor.getSnapshot().value).toBe("idle");
    expect(loadTrack).not.toHaveBeenCalled();
    actor.send({ type: "PLAY" });
    expect(actor.getSnapshot().value).toBe("loading");
    expect(ctx().index).toBe(0);
  });

  it("edits the queue while playing", () => {
    const { actor, ctx } = start();
    actor.send({ type: "LOAD_QUEUE", tracks, startIndex: 1 });
    actor.send({ type: "READY" });
    actor.send({ type: "PLAY_NEXT", tracks: [track("n")] });
    actor.send({ type: "ENQUEUE", tracks: [track("e")] });
    expect(ids(ctx().queue)).toEqual(["1", "2", "n", "3", "e"]);

    actor.send({ type: "REMOVE", index: 0 });
    expect(ids(ctx().queue)).toEqual(["2", "n", "3", "e"]);
    expect(ctx().index).toBe(0);

    actor.send({ type: "MOVE", from: 3, to: 1 });
    expect(ids(ctx().queue)).toEqual(["2", "e", "n", "3"]);

    actor.send({ type: "CLEAR_UPCOMING" });
    expect(ids(ctx().queue)).toEqual(["2"]);
    expect(actor.getSnapshot().value).toBe("playing");
  });

  it("empties the player when the only track is removed", () => {
    const { actor, unloadAudio, ctx } = start();
    actor.send({ type: "LOAD_QUEUE", tracks: [track("x")] });
    actor.send({ type: "READY" });
    actor.send({ type: "REMOVE", index: 0 });
    expect(actor.getSnapshot().value).toBe("idle");
    expect(ctx().queue).toEqual([]);
    expect(unloadAudio).toHaveBeenCalledOnce();
  });

  it("shuffles only upcoming tracks and restores order", () => {
    const many = ["a", "b", "c", "d", "e", "f"].map(track);
    const { actor, ctx } = start();
    actor.send({ type: "LOAD_QUEUE", tracks: many, startIndex: 2 });
    actor.send({ type: "TOGGLE_SHUFFLE" });
    expect(ctx().shuffle).toBe(true);
    expect(ids(ctx().queue).slice(0, 3)).toEqual(["a", "b", "c"]);
    expect(ids(ctx().queue).slice(3).sort()).toEqual(["d", "e", "f"]);

    actor.send({ type: "NEXT" });
    const playing = ctx().queue[ctx().index]?.id;
    actor.send({ type: "TOGGLE_SHUFFLE" });
    expect(ids(ctx().queue)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(ctx().queue[ctx().index]?.id).toBe(playing);
  });

  it("restores a persisted queue paused, playing on first PLAY", () => {
    const { actor, loadTrack, ctx } = start();
    actor.send({
      type: "RESTORE",
      state: { queue: tracks, index: 7, repeat: "all", shuffle: false },
    });
    expect(actor.getSnapshot().value).toBe("idle");
    expect(ctx().index).toBe(2); // clamped
    expect(ctx().repeat).toBe("all");
    actor.send({ type: "TOGGLE" });
    expect(actor.getSnapshot().value).toBe("loading");
    expect(loadTrack).toHaveBeenCalledOnce();
  });
});

describe("nextIndex", () => {
  it("returns -1 at the end unless repeating", () => {
    expect(nextIndex({ queue: tracks, index: 2, repeat: "off" })).toBe(-1);
    expect(nextIndex({ queue: tracks, index: 2, repeat: "all" })).toBe(0);
    expect(nextIndex({ queue: [], index: 0, repeat: "all" })).toBe(-1);
  });
});
