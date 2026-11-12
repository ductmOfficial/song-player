import type { Track } from "@song/music-sources";
import { type SnapshotFrom, assign, createActor, setup } from "xstate";
import {
  type QueueState,
  clearUpcoming,
  enqueue,
  move,
  playNext,
  removeAt,
  shuffleUpcoming,
  unshuffle,
} from "./queue.js";

export type RepeatMode = "off" | "all" | "one";

export type PlayerContext = QueueState & {
  repeat: RepeatMode;
  shuffle: boolean;
  error?: string;
};

/** What survives a reload. Restored paused: browsers block autoplay anyway. */
export type PersistedPlayer = Pick<
  PlayerContext,
  "queue" | "index" | "repeat" | "shuffle" | "original"
>;

export type PlayerEvent =
  | { type: "LOAD_QUEUE"; tracks: Track[]; startIndex?: number }
  | { type: "RESTORE"; state: PersistedPlayer }
  | { type: "ENQUEUE"; tracks: Track[] }
  | { type: "PLAY_NEXT"; tracks: Track[] }
  | { type: "REMOVE"; index: number }
  | { type: "MOVE"; from: number; to: number }
  | { type: "JUMP"; index: number }
  | { type: "CLEAR_UPCOMING" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "READY" }
  | { type: "ENDED" }
  | { type: "ERROR"; message: string }
  | { type: "SET_REPEAT"; mode: RepeatMode }
  | { type: "CYCLE_REPEAT" }
  | { type: "TOGGLE_SHUFFLE" };

export const currentTrack = (ctx: PlayerContext): Track | undefined => ctx.queue[ctx.index];

/** Index of the track that should play next, or -1 when the queue is finished. */
export function nextIndex(ctx: Pick<PlayerContext, "queue" | "index" | "repeat">): number {
  const { queue, index, repeat } = ctx;
  if (queue.length === 0) return -1;
  if (index + 1 < queue.length) return index + 1;
  return repeat === "all" ? 0 : -1;
}

export function prevIndex(ctx: Pick<PlayerContext, "queue" | "index" | "repeat">): number {
  if (ctx.queue.length === 0) return -1;
  if (ctx.index > 0) return ctx.index - 1;
  return ctx.repeat === "all" ? ctx.queue.length - 1 : 0;
}

const repeatCycle: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" };

/** Only the queue fields, so `assign` never touches transport flags. */
const q = ({ queue, index, original }: QueueState) => ({ queue, index, original });

/**
 * Pure playback logic. Side effects (touching <audio>) are named actions with
 * no-op defaults; `createPlayer` provides the real implementations, tests don't.
 *
 * States describe the *transport*; the queue lives in context and can be edited
 * in any state.
 */
export const playerMachine = setup({
  types: { context: {} as PlayerContext, events: {} as PlayerEvent },
  actions: {
    loadTrack: () => {
      // Provided by createPlayer, which owns the <audio> element.
    },
    playAudio: () => {
      // Provided by createPlayer, which owns the <audio> element.
    },
    pauseAudio: () => {
      // Provided by createPlayer, which owns the <audio> element.
    },
    restartAudio: () => {
      // Provided by createPlayer, which owns the <audio> element.
    },
    /** Called when the queue ran out; the host can e.g. reset the <audio>. */
    unloadAudio: () => {
      // Provided by createPlayer, which owns the <audio> element.
    },
    advance: assign({ index: ({ context }) => nextIndex(context) }),
    goBack: assign({ index: ({ context }) => prevIndex(context) }),
    clearError: assign({ error: undefined }),
    enqueueTracks: assign(({ context, event }) =>
      event.type === "ENQUEUE" ? q(enqueue(context, event.tracks)) : {},
    ),
    playNextTracks: assign(({ context, event }) =>
      event.type === "PLAY_NEXT" ? q(playNext(context, event.tracks)) : {},
    ),
    removeTrack: assign(({ context, event }) =>
      event.type === "REMOVE" ? q(removeAt(context, event.index)) : {},
    ),
    moveTrack: assign(({ context, event }) =>
      event.type === "MOVE" ? q(move(context, event.from, event.to)) : {},
    ),
    clearUpcomingTracks: assign(({ context }) => q(clearUpcoming(context))),
  },
  guards: {
    hasNext: ({ context }) => nextIndex(context) !== -1,
    hasQueue: ({ context }) => context.queue.length > 0,
    repeatOne: ({ context }) => context.repeat === "one",
    tracksGiven: ({ event }) =>
      (event.type === "LOAD_QUEUE" || event.type === "ENQUEUE" || event.type === "PLAY_NEXT") &&
      event.tracks.length > 0,
    isOtherIndex: ({ context, event }) =>
      event.type === "JUMP" &&
      event.index >= 0 &&
      event.index < context.queue.length &&
      event.index !== context.index,
    isCurrentIndex: ({ context, event }) => event.type === "JUMP" && event.index === context.index,
    /** Removing the last remaining track empties the player. */
    removesOnlyTrack: ({ context, event }) =>
      event.type === "REMOVE" && context.queue.length === 1 && event.index === 0,
  },
}).createMachine({
  id: "player",
  context: { queue: [], index: 0, repeat: "off", shuffle: false },
  initial: "idle",
  on: {
    LOAD_QUEUE: {
      guard: "tracksGiven",
      target: ".loading",
      actions: [
        assign(({ context, event }) => {
          const start = Math.min(Math.max(event.startIndex ?? 0, 0), event.tracks.length - 1);
          const base: QueueState = { queue: event.tracks, index: start };
          // A new queue respects the shuffle toggle: start where asked, shuffle the rest.
          const next = context.shuffle ? shuffleUpcoming(base) : base;
          return { ...next, error: undefined };
        }),
        "loadTrack",
      ],
    },
    ENQUEUE: [
      // Adding to an empty player sets up the queue without starting playback.
      {
        guard: ({ context, event }) => event.tracks.length > 0 && context.queue.length === 0,
        target: ".idle",
        actions: "enqueueTracks",
      },
      {
        guard: "tracksGiven",
        actions: "enqueueTracks",
      },
    ],
    PLAY_NEXT: [
      {
        guard: ({ context, event }) => event.tracks.length > 0 && context.queue.length === 0,
        target: ".idle",
        actions: "playNextTracks",
      },
      {
        guard: "tracksGiven",
        actions: "playNextTracks",
      },
    ],
    REMOVE: [
      {
        guard: "removesOnlyTrack",
        target: ".idle",
        actions: [
          assign({ queue: [], index: 0, original: undefined }),
          "pauseAudio",
          "unloadAudio",
        ],
      },
      { actions: "removeTrack" },
    ],
    MOVE: { actions: "moveTrack" },
    CLEAR_UPCOMING: { actions: "clearUpcomingTracks" },
    JUMP: [
      {
        guard: "isOtherIndex",
        target: ".loading",
        actions: [assign({ index: ({ event }) => event.index }), "clearError", "loadTrack"],
      },
      { guard: "isCurrentIndex", actions: "restartAudio" },
    ],
    NEXT: { guard: "hasNext", target: ".loading", actions: ["advance", "clearError", "loadTrack"] },
    PREV: { guard: "hasQueue", target: ".loading", actions: ["goBack", "clearError", "loadTrack"] },
    SET_REPEAT: {
      actions: assign({
        repeat: ({ event }) => event.mode,
      }),
    },
    CYCLE_REPEAT: { actions: assign({ repeat: ({ context }) => repeatCycle[context.repeat] }) },
    TOGGLE_SHUFFLE: {
      actions: assign(({ context }) => {
        if (context.shuffle) return { ...unshuffle(context), shuffle: false };
        return { ...shuffleUpcoming(context), shuffle: true };
      }),
    },
  },
  states: {
    idle: {
      on: {
        RESTORE: {
          actions: assign(({ event }) => {
            const { queue, index, repeat, shuffle, original } = event.state;
            const safeIndex = Math.min(Math.max(index, 0), Math.max(queue.length - 1, 0));
            return { queue, index: safeIndex, repeat, shuffle, original, error: undefined };
          }),
        },
        // A restored (or enqueued-into-empty) queue starts on the first PLAY.
        PLAY: { guard: "hasQueue", target: "loading", actions: "loadTrack" },
        TOGGLE: { guard: "hasQueue", target: "loading", actions: "loadTrack" },
      },
    },
    loading: {
      on: {
        READY: "playing",
        ERROR: "error",
        PAUSE: "paused",
        TOGGLE: "paused",
      },
    },
    playing: {
      entry: "playAudio",
      on: {
        PAUSE: "paused",
        TOGGLE: "paused",
        ERROR: "error",
        ENDED: [
          { guard: "repeatOne", target: "playing", reenter: true, actions: "restartAudio" },
          { guard: "hasNext", target: "loading", actions: ["advance", "loadTrack"] },
          { target: "paused", actions: "restartAudio" },
        ],
      },
    },
    paused: {
      entry: "pauseAudio",
      on: { PLAY: "playing", TOGGLE: "playing" },
    },
    error: {
      entry: [
        "pauseAudio",
        assign({
          error: ({ event }) => (event.type === "ERROR" ? event.message : "Unknown error"),
        }),
      ],
      on: {
        PLAY: { target: "loading", actions: ["clearError", "loadTrack"] },
        TOGGLE: { target: "loading", actions: ["clearError", "loadTrack"] },
      },
    },
  },
});

/** Narrow snapshot value for UI: one of the transport states. */
export type TransportState = "idle" | "loading" | "playing" | "paused" | "error";

export type PlayerSnapshot = SnapshotFrom<typeof playerMachine>;

/** The machine's initial snapshot, for server rendering and first paint. */
export const idleSnapshot = (): PlayerSnapshot => createActor(playerMachine).getSnapshot();
