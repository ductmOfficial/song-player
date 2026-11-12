"use client";

import { Artwork } from "@/shared/ui/artwork";
import { Equalizer } from "@/shared/ui/equalizer";
import { LockIcon, PauseIcon, PlayIcon } from "@/shared/ui/icons";
import type { Track } from "@song/music-sources";
import { variants } from "@song/ui";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { TrackLink } from "./track-link";
import { ArtistLink } from "./track-list";
import { useTrackPlayback } from "./use-track-playback";

/** Cover-led grid. Animates in once per mount (the screen's one orchestrated entrance). */
export function TrackGrid({ tracks, label }: { tracks: Track[]; label: string }) {
  return (
    <motion.ul
      aria-label={label}
      variants={variants.stagger}
      initial="hidden"
      animate="show"
      className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-5 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] sm:gap-x-6"
    >
      {tracks.map((track, i) => (
        <motion.li key={track.id} variants={variants.rise}>
          <TrackCard tracks={tracks} index={i} />
        </motion.li>
      ))}
    </motion.ul>
  );
}

function TrackCard({ tracks, index }: { tracks: Track[]; index: number }) {
  const t = useTranslations("tracks");
  const { isCurrent, isPlaying, play, playable } = useTrackPlayback(tracks, index);
  const track = tracks[index];
  if (!track) return null;

  return (
    <article className="group flex flex-col gap-3">
      <div className="relative">
        <Artwork
          artwork={track.artwork}
          size="medium"
          className={`aspect-square w-full transition-shadow duration-(--duration-slow) ${isCurrent ? "shadow-[0_18px_50px_-20px_var(--s-accent)]" : ""}`}
        />
        {playable ? (
          <button
            type="button"
            onClick={play}
            aria-label={
              isPlaying
                ? t("pauseTrack", { title: track.title })
                : t("playTrack", { title: track.title })
            }
            className={`absolute right-3 bottom-3 grid size-12 cursor-pointer place-items-center rounded-full bg-accent text-on-accent shadow-lg transition-[opacity,transform] duration-(--duration-base) ease-(--ease-emphasized) focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text group-hover:translate-y-0 group-hover:opacity-100 ${isCurrent ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"}`}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
        ) : (
          <span
            title={t("unavailable")}
            className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-surface/90 text-text-muted"
          >
            <LockIcon size={16} />
            <span className="sr-only">{t("unavailableFor", { title: track.title })}</span>
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          {isCurrent && <Equalizer playing={isPlaying} className="shrink-0" />}
          <TrackLink
            track={track}
            className={`truncate font-semibold hover:underline ${isCurrent ? "text-accent" : ""}`}
          >
            {track.title}
          </TrackLink>
        </div>
        <ArtistLink
          track={track}
          className="truncate text-sm text-text-muted hover:text-text hover:underline"
        />
      </div>
    </article>
  );
}
