import type { Track } from "@song/music-sources";
import { type ActorRefFrom, createActor } from "xstate";
import { currentTrack, playerMachine } from "./machine.js";
import { type MediaState, type MediaStore, createMediaStore } from "./media-store.js";

export type PlayerActor = ActorRefFrom<typeof playerMachine>;

export interface CreatePlayerOptions {
  resolveStreamUrl: (track: Track) => Promise<string>;
  audio?: HTMLAudioElement;
  /** Restore volume/mute from a previous session */
  initialMedia?: Partial<Pick<MediaState, "volume" | "muted">>;
}

/** "Previous" restarts the track instead when we're past this point. */
export const PREV_RESTART_THRESHOLD_SEC = 3;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Binds the pure machine to a real <audio> element and the Media Session API.
 * Framework-agnostic: React (or anything else) subscribes to `actor` for
 * discrete state and to `media` for time/volume.
 */
export function createPlayer({
  resolveStreamUrl,
  audio = new Audio(),
  initialMedia = {},
}: CreatePlayerOptions) {
  audio.preload = "auto";
  audio.volume = clamp01(initialMedia.volume ?? 1);
  audio.muted = initialMedia.muted ?? false;
  const media = createMediaStore({ volume: audio.volume, muted: audio.muted });
  let loadToken = 0;

  const machine = playerMachine.provide({
    actions: {
      loadTrack: ({ context }) => {
        const track = currentTrack(context);
        if (!track) return;
        const token = ++loadToken;
        media.set({ currentTime: 0, duration: track.previewSec ?? track.durationSec, buffered: 0 });
        resolveStreamUrl(track)
          .then((url) => {
            if (token !== loadToken) return; // user skipped again before this resolved
            audio.src = url;
            audio.load();
          })
          .catch((e: unknown) => {
            if (token === loadToken) actor.send({ type: "ERROR", message: String(e) });
          });
      },
      playAudio: () => {
        const token = loadToken;
        audio.play().catch((e: unknown) => {
          // Interrupted by a newer load or a pause(): the newer action wins.
          if (token !== loadToken || (e instanceof DOMException && e.name === "AbortError")) return;
          // Autoplay policy: stay paused instead of erroring.
          if (e instanceof DOMException && e.name === "NotAllowedError")
            actor.send({ type: "PAUSE" });
          else actor.send({ type: "ERROR", message: String(e) });
        });
      },
      pauseAudio: () => {
        audio.pause();
      },
      restartAudio: () => {
        audio.currentTime = 0;
      },
      unloadAudio: () => {
        loadToken++;
        audio.removeAttribute("src");
        audio.load();
        media.set({ currentTime: 0, duration: 0, buffered: 0, waiting: false });
      },
    },
  });

  // Referenced lazily by the actions above, which only run after start().
  const actor: PlayerActor = createActor(machine);

  const readBuffered = () => {
    const { buffered, currentTime } = audio;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i))
        return buffered.end(i);
    }
    return 0;
  };

  const listeners: [keyof HTMLMediaElementEventMap, () => void][] = [
    [
      "canplay",
      () => {
        actor.send({ type: "READY" });
      },
    ],
    [
      "ended",
      () => {
        actor.send({ type: "ENDED" });
      },
    ],
    [
      "error",
      () => {
        actor.send({
          type: "ERROR",
          message: audio.error?.message.length ? audio.error.message : "Playback failed",
        });
      },
    ],
    [
      "timeupdate",
      () => {
        media.set({ currentTime: audio.currentTime });
      },
    ],
    [
      "seeked",
      () => {
        media.set({ currentTime: audio.currentTime });
      },
    ],
    [
      "durationchange",
      () => {
        if (Number.isFinite(audio.duration)) media.set({ duration: audio.duration });
      },
    ],
    [
      "progress",
      () => {
        media.set({ buffered: readBuffered() });
      },
    ],
    [
      "waiting",
      () => {
        media.set({ waiting: true });
      },
    ],
    [
      "playing",
      () => {
        media.set({ waiting: false });
      },
    ],
    [
      "pause",
      () => {
        media.set({ waiting: false });
      },
    ],
    [
      "volumechange",
      () => {
        media.set({ volume: audio.volume, muted: audio.muted });
      },
    ],
  ];
  for (const [type, fn] of listeners) audio.addEventListener(type, fn);

  const controls = {
    play: () => {
      actor.send({ type: "PLAY" });
    },
    pause: () => {
      actor.send({ type: "PAUSE" });
    },
    toggle: () => {
      actor.send({ type: "TOGGLE" });
    },
    next: () => {
      actor.send({ type: "NEXT" });
    },
    /** Restart the track if we're a few seconds in, otherwise go back. */
    prev: () => {
      if (audio.currentTime > PREV_RESTART_THRESHOLD_SEC) controls.seek(0);
      else actor.send({ type: "PREV" });
    },
    seek: (sec: number) => {
      const max = Number.isFinite(audio.duration) ? audio.duration : media.get().duration;
      const t = Math.min(Math.max(sec, 0), max || 0);
      audio.currentTime = t;
      media.set({ currentTime: t });
    },
    seekBy: (delta: number) => {
      controls.seek(audio.currentTime + delta);
    },
    setVolume: (v: number) => {
      audio.volume = clamp01(v);
      if (audio.volume > 0 && audio.muted) audio.muted = false;
    },
    toggleMute: () => {
      audio.muted = !audio.muted;
    },
  };

  const stopMediaSession = bindMediaSession(actor, controls, media);
  actor.start();

  return {
    actor,
    audio,
    media,
    controls,
    destroy() {
      stopMediaSession();
      for (const [type, fn] of listeners) audio.removeEventListener(type, fn);
      audio.pause();
      audio.removeAttribute("src");
      actor.stop();
    },
  };
}

export type Player = ReturnType<typeof createPlayer>;
export type PlayerControls = Player["controls"];

function bindMediaSession(
  actor: PlayerActor,
  controls: PlayerControls,
  media: MediaStore,
): () => void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return () => undefined;
  const ms = navigator.mediaSession;
  const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
    ["play", controls.play],
    ["pause", controls.pause],
    ["nexttrack", controls.next],
    ["previoustrack", controls.prev],
    [
      "seekto",
      (d) => {
        if (d.seekTime !== undefined) controls.seek(d.seekTime);
      },
    ],
    [
      "seekbackward",
      (d) => {
        controls.seekBy(-(d.seekOffset ?? 10));
      },
    ],
    [
      "seekforward",
      (d) => {
        controls.seekBy(d.seekOffset ?? 10);
      },
    ],
  ];
  for (const [action, handler] of handlers) {
    try {
      ms.setActionHandler(action, handler);
    } catch {
      /* action unsupported in this browser */
    }
  }

  let lastId: string | undefined;
  const sub = actor.subscribe((snap) => {
    ms.playbackState = snap.matches("playing")
      ? "playing"
      : snap.matches("paused")
        ? "paused"
        : "none";
    const track = currentTrack(snap.context);
    if (!track) {
      lastId = undefined;
      ms.metadata = null;
      return;
    }
    if (track.id === lastId) return;
    lastId = track.id;
    ms.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist.name,
      artwork: (
        [
          [track.artwork.small, "150x150"],
          [track.artwork.medium, "480x480"],
          [track.artwork.large, "1000x1000"],
        ] as const
      ).flatMap(([src, sizes]): MediaImage[] => (src ? [{ src, sizes }] : [])),
    });
  });

  // Lock-screen scrubbers need the position; once a second is plenty.
  let lastPositionUpdate = 0;
  const unsubMedia = media.subscribe(() => {
    const { currentTime, duration } = media.get();
    const now = Date.now();
    if (now - lastPositionUpdate < 1000 || !duration || !("setPositionState" in ms)) return;
    lastPositionUpdate = now;
    try {
      ms.setPositionState({ duration, position: Math.min(currentTime, duration), playbackRate: 1 });
    } catch {
      /* invalid state during track changes */
    }
  });

  return () => {
    sub.unsubscribe();
    unsubMedia();
    for (const [action] of handlers) {
      try {
        ms.setActionHandler(action, null);
      } catch {
        // Some browsers reject actions they don't support.
      }
    }
  };
}
