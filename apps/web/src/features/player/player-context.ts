"use client";

import type { Track } from "@song/music-sources";
import {
  type MediaState,
  type Player,
  type PlayerControls,
  type PlayerSnapshot,
  idleSnapshot as createIdleSnapshot,
  initialMediaState,
} from "@song/player-core";
import { createContext, use, useCallback, useSyncExternalStore } from "react";
import type { HistoryRepository } from "../history/history-store";

export type { PlayerSnapshot };

export type PlayerPanel = "queue" | "nowPlaying" | "shortcuts" | null;

export interface PlayerApi {
  /** Null until mounted in the browser (there's no <audio> on the server). */
  player: Player | null;
  history: HistoryRepository;
  /** Replace the queue with `tracks` and start at `startIndex` (unplayable ones are skipped). */
  playTracks: (tracks: Track[], startIndex?: number) => void;
  enqueue: (tracks: Track[]) => void;
  playNext: (tracks: Track[]) => void;
  panel: PlayerPanel;
  openPanel: (panel: PlayerPanel) => void;
  /** Short confirmation shown above the player bar ("Added to queue") */
  notice: { id: number; message: string } | null;
  dismissNotice: () => void;
}

export const PlayerContext = createContext<PlayerApi | null>(null);

export function usePlayer(): PlayerApi {
  const api = use(PlayerContext);
  if (!api) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return api;
}

// An unstarted actor gives us the machine's initial snapshot for SSR and first paint.
const idleSnapshot: PlayerSnapshot = createIdleSnapshot();
const noop = () => () => undefined;

/**
 * Subscribe to a slice of the player's discrete state. Selectors must return
 * primitives or existing references (not new objects) to avoid re-render loops.
 */
export function usePlayerState<T>(selector: (s: PlayerSnapshot) => T): T {
  const { player } = usePlayer();
  const actor = player?.actor;
  const subscribe = useCallback(
    (cb: () => void) => {
      if (!actor) return () => undefined;
      const sub = actor.subscribe(cb);
      return () => {
        sub.unsubscribe();
      };
    },
    [actor],
  );
  const get = () => selector(actor ? actor.getSnapshot() : idleSnapshot);
  return useSyncExternalStore(actor ? subscribe : noop, get, () => selector(idleSnapshot));
}

/** Subscribe to a slice of time/volume state. */
export function useMedia<T>(selector: (m: MediaState) => T): T {
  const { player } = usePlayer();
  const media = player?.media;
  const get = () => selector(media ? media.get() : initialMediaState);
  return useSyncExternalStore(media ? media.subscribe : noop, get, () =>
    selector(initialMediaState),
  );
}

const ignore = () => undefined;
const noControls: PlayerControls = {
  play: ignore,
  pause: ignore,
  toggle: ignore,
  next: ignore,
  prev: ignore,
  seek: ignore,
  seekBy: ignore,
  setVolume: ignore,
  toggleMute: ignore,
};

export function useControls(): PlayerControls {
  return usePlayer().player?.controls ?? noControls;
}

export const selectCurrent = (s: PlayerSnapshot): Track | undefined =>
  s.context.queue[s.context.index];
export const selectIsPlaying = (s: PlayerSnapshot) => s.matches("playing") || s.matches("loading");
