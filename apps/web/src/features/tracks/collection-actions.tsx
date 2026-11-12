"use client";

import { PauseIcon, PlayIcon, PlusIcon } from "@/shared/ui/icons";
import type { Track } from "@song/music-sources";
import { Button } from "@song/ui";
import { useTranslations } from "next-intl";
import {
  selectCurrent,
  selectIsPlaying,
  usePlayer,
  usePlayerState,
} from "../player/player-context";

/**
 * "Play" + "Add to queue" for a whole collection (hero, artist, track page).
 * Toggles when the current track already belongs to this collection.
 */
export function CollectionActions({
  tracks,
  playLabel,
  size = "lg",
}: {
  tracks: Track[];
  playLabel?: string;
  size?: "md" | "lg";
}) {
  const t = useTranslations("tracks");
  const { playTracks, enqueue, player } = usePlayer();
  const ids = new Set(tracks.map((x) => x.id));
  const inThis = usePlayerState((s) => {
    const cur = selectCurrent(s);
    return !!cur && ids.has(cur.id);
  });
  const playing = usePlayerState((s) => inThis && selectIsPlaying(s));
  const firstPlayable = tracks.findIndex((x) => x.streamable);
  const disabled = firstPlayable === -1;

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        size={size}
        disabled={disabled}
        onClick={() => {
          if (inThis) player?.controls.toggle();
          else playTracks(tracks, firstPlayable);
        }}
      >
        {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
        {playing ? t("pause") : (playLabel ?? t("play"))}
      </Button>
      <Button
        size={size}
        variant="secondary"
        disabled={disabled}
        onClick={() => {
          enqueue(tracks);
        }}
      >
        <PlusIcon size={18} />
        {t("addAllToQueue")}
      </Button>
    </div>
  );
}
