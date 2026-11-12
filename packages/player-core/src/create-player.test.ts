import type { Track } from "@song/music-sources";
import { describe, expect, it, vi } from "vitest";
import { createPlayer } from "./create-player.js";

/** Just enough of HTMLAudioElement for the bindings. */
class FakeAudio extends EventTarget {
  src = "";
  preload = "";
  currentTime = 0;
  duration = Number.NaN;
  volume = 1;
  muted = false;
  error = null;
  buffered = { length: 0, start: () => 0, end: () => 0 };
  playImpl: () => Promise<void> = () => Promise.resolve();
  play = vi.fn(() => this.playImpl());
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();
  emit(type: string) {
    this.dispatchEvent(new Event(type));
  }
}

const track = (id: string): Track => ({
  id,
  source: "audius",
  title: id,
  durationSec: 200,
  artist: { id: "a", source: "audius", name: "A" },
  artwork: {},
  streamable: true,
});

function setup() {
  const audio = new FakeAudio();
  const player = createPlayer({
    audio: audio as unknown as HTMLAudioElement,
    resolveStreamUrl: (t) => Promise.resolve(`https://stream.test/${t.id}`),
  });
  const state = () => player.actor.getSnapshot().value;
  return { audio, player, state };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("createPlayer", () => {
  it("sets the stream URL and plays once the audio can play", async () => {
    const { audio, player, state } = setup();
    player.actor.send({ type: "LOAD_QUEUE", tracks: [track("a")] });
    await flush();
    expect(audio.src).toBe("https://stream.test/a");
    expect(player.media.get().duration).toBe(200); // from metadata until the audio knows
    audio.emit("canplay");
    expect(state()).toBe("playing");
    expect(audio.play).toHaveBeenCalled();
  });

  it("prev restarts the track after a few seconds, otherwise goes back", () => {
    const { audio, player } = setup();
    player.actor.send({ type: "LOAD_QUEUE", tracks: [track("a"), track("b")], startIndex: 1 });
    audio.currentTime = 42;
    player.controls.prev();
    expect(player.actor.getSnapshot().context.index).toBe(1);
    expect(audio.currentTime).toBe(0);

    player.controls.prev();
    expect(player.actor.getSnapshot().context.index).toBe(0);
  });

  it("ignores a play() rejection from a load that was superseded", async () => {
    const { audio, player, state } = setup();
    let reject: (e: unknown) => void = () => undefined;
    audio.playImpl = () =>
      new Promise((_, r) => {
        reject = r;
      });
    player.actor.send({ type: "LOAD_QUEUE", tracks: [track("a"), track("b")] });
    audio.emit("canplay");
    player.controls.next(); // new load while play() is pending
    reject(new DOMException("interrupted", "AbortError"));
    await flush();
    expect(state()).toBe("loading");
  });

  it("stays paused when autoplay is blocked", async () => {
    const { audio, player, state } = setup();
    audio.playImpl = () => Promise.reject(new DOMException("blocked", "NotAllowedError"));
    player.actor.send({ type: "LOAD_QUEUE", tracks: [track("a")] });
    audio.emit("canplay");
    await flush();
    expect(state()).toBe("paused");
  });

  it("reports time and volume through the media store", () => {
    const { audio, player } = setup();
    const listener = vi.fn();
    player.media.subscribe(listener);
    audio.currentTime = 12;
    audio.emit("timeupdate");
    player.controls.setVolume(1.7);
    audio.emit("volumechange");
    expect(player.media.get()).toMatchObject({ currentTime: 12, volume: 1 });
    player.controls.setVolume(0.25);
    audio.emit("volumechange");
    expect(player.media.get().volume).toBe(0.25);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
