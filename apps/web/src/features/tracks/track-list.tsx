"use client";

import { Link } from "@/i18n/navigation";
import { formatCount, formatTime } from "@/shared/format";
import { Artwork } from "@/shared/ui/artwork";
import { Equalizer } from "@/shared/ui/equalizer";
import { IconButton } from "@/shared/ui/icon-button";
import { LockIcon, PauseIcon, PlayIcon, PlayNextIcon, PlusIcon } from "@/shared/ui/icons";
import type { Track } from "@song/music-sources";
import { useLocale, useTranslations } from "next-intl";
import { usePlayer } from "../player/player-context";
import { PreviewBadge, TrackLink } from "./track-link";
import { useTrackPlayback } from "./use-track-playback";

interface Props {
  tracks: Track[];
  /** Show plays column (artist pages, search) */
  showPlays?: boolean;
  /** Hide the artist line when every track is by the same artist */
  hideArtist?: boolean;
  /** Accessible name for the list */
  label: string;
}

/** Stable keys from track ids; a track listed twice (e.g. replayed in history) gets a suffix. */
function withKeys(tracks: Track[]) {
  const seen = new Map<string, number>();
  return tracks.map((track) => {
    const n = seen.get(track.id) ?? 0;
    seen.set(track.id, n + 1);
    return { track, key: n === 0 ? track.id : `${track.id}#${String(n)}` };
  });
}

export function TrackList({ tracks, showPlays, hideArtist, label }: Props) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {withKeys(tracks).map(({ key }, i) => (
        <TrackRow
          key={key}
          tracks={tracks}
          index={i}
          showPlays={showPlays}
          hideArtist={hideArtist}
        />
      ))}
    </ol>
  );
}

function TrackRow({
  tracks,
  index,
  showPlays,
  hideArtist,
}: {
  tracks: Track[];
  index: number;
  showPlays?: boolean;
  hideArtist?: boolean;
}) {
  const t = useTranslations("tracks");
  const locale = useLocale();
  const { enqueue, playNext } = usePlayer();
  const { isCurrent, isPlaying, play, playable } = useTrackPlayback(tracks, index);
  const track = tracks[index];
  if (!track) return null;

  return (
    <li
      className={`group grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-(--radius-control) py-1.5 pr-2 pl-1 transition-colors duration-(--duration-fast) hover:bg-surface-raised sm:grid-cols-[2.75rem_minmax(0,1fr)_auto_auto] ${isCurrent ? "bg-surface" : ""}`}
    >
      {/* Index number, swapped for a play button on hover/focus */}
      <div className="relative grid size-11 place-items-center">
        {playable ? (
          <button
            type="button"
            onClick={play}
            aria-label={
              isPlaying
                ? t("pauseTrack", { title: track.title })
                : t("playTrack", { title: track.title })
            }
            className="peer grid size-11 cursor-pointer place-items-center rounded-full text-text opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 focus-visible:outline-2 focus-visible:outline-text"
          >
            {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>
        ) : (
          <span
            title={t("unavailable")}
            className="grid size-11 place-items-center text-text-muted"
          >
            <LockIcon size={16} />
            <span className="sr-only">{t("unavailableFor", { title: track.title })}</span>
          </span>
        )}
        {playable && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-text-muted tabular-nums transition-opacity group-hover:opacity-0 peer-focus-visible:opacity-0 [@media(hover:none)]:hidden"
          >
            {isCurrent ? <Equalizer playing={isPlaying} /> : index + 1}
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Artwork artwork={track.artwork} size="small" className="size-11 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <TrackLink
              track={track}
              className={`truncate font-medium hover:underline ${isCurrent ? "text-accent" : ""}`}
            />

            <PreviewBadge track={track} />
          </div>
          {!hideArtist && (
            <ArtistLink
              track={track}
              className="truncate text-sm text-text-muted hover:text-text hover:underline"
            />
          )}
        </div>
      </div>

      <div className="hidden items-center gap-6 text-sm text-text-muted tabular-nums sm:flex">
        {showPlays && track.stats && (
          <span title={t("plays", { count: track.stats.plays })}>
            {formatCount(track.stats.plays, locale)}
            <span className="sr-only"> {t("playsUnit")}</span>
          </span>
        )}
        <span className="w-12 text-right">{formatTime(track.durationSec)}</span>
      </div>

      <div className="flex items-center opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        {playable && (
          <>
            <IconButton
              label={t("playNext", { title: track.title })}
              size="sm"
              onClick={() => {
                playNext([track]);
              }}
            >
              <PlayNextIcon size={18} />
            </IconButton>
            <IconButton
              label={t("addToQueue", { title: track.title })}
              size="sm"
              onClick={() => {
                enqueue([track]);
              }}
            >
              <PlusIcon size={18} />
            </IconButton>
          </>
        )}
      </div>
    </li>
  );
}

export function ArtistLink({ track, className }: { track: Track; className?: string }) {
  return track.artist.handle ? (
    <Link href={`/artist/${track.artist.handle}`} className={className}>
      {track.artist.name}
    </Link>
  ) : (
    <span className={className}>{track.artist.name}</span>
  );
}
