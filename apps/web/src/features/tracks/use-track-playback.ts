"use client";

import type { Track } from "@song/music-sources";
import { useCallback } from "react";
import {
  selectCurrent,
  selectIsPlaying,
  usePlayer,
  usePlayerState,
} from "../player/player-context";

/**
 * Play state for one track inside a list, and the action for its play button:
 * start the list from this track, or toggle if it's already the current one.
 */
export function useTrackPlayback(tracks: Track[], index: number) {
  const { playTracks, player } = usePlayer();
  const track = tracks[index];
  const isCurrent = usePlayerState((s) => !!track && selectCurrent(s)?.id === track.id);
  const isPlaying = usePlayerState((s) => isCurrent && selectIsPlaying(s));

  const play = useCallback(() => {
    if (!track) return;
    if (isCurrent) player?.controls.toggle();
    else playTracks(tracks, index);
  }, [track, isCurrent, player, playTracks, tracks, index]);

  return { isCurrent, isPlaying, play, playable: !!track?.streamable };
}
