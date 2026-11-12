"use client";

import { Link } from "@/i18n/navigation";
import { Artwork } from "@/shared/ui/artwork";
import { IconButton } from "@/shared/ui/icon-button";
import { ExpandIcon, KeyboardIcon, NextIcon, QueueIcon } from "@/shared/ui/icons";
import { spring } from "@song/ui";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { PreviewBadge, TrackLink } from "../tracks/track-link";
import { NowPlayingSheet } from "./now-playing-sheet";
import { selectCurrent, useControls, usePlayer, usePlayerState } from "./player-context";
import { PlayerShortcuts, ShortcutsDialog } from "./player-shortcuts";
import { ProgressLine, ProgressSlider } from "./progress-slider";
import { QueuePanel } from "./queue-panel";
import { PlayPauseButton, TransportControls } from "./transport-controls";
import { VolumeControl } from "./volume-control";

/**
 * The persistent player. Lives in the locale layout next to the provider, so
 * it survives navigation; slides in once something is queued.
 */
export function PlayerBar() {
  const t = useTranslations("player");
  const { openPanel } = usePlayer();
  const controls = useControls();
  const track = usePlayerState(selectCurrent);
  const error = usePlayerState((s) => s.context.error);

  return (
    <>
      <PlayerShortcuts />
      <ShortcutsDialog />
      {/* Reserve space so the bar never covers the end of the page. */}
      {track && (
        <div aria-hidden="true" className="h-[calc(var(--player-h)+env(safe-area-inset-bottom))]" />
      )}
      <AnimatePresence>
        {track && (
          <motion.section
            key="player"
            aria-label={t("region")}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring.gentle}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[color-mix(in_oklab,var(--s-surface)_88%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
          >
            <Notice />
            <div className="relative mx-auto grid h-(--player-h) max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] md:gap-6">
              <div className="md:hidden">
                <ProgressLine />
              </div>

              {/* Now playing: tapping opens the full-screen view */}
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    openPanel("nowPlaying");
                  }}
                  aria-label={t("openNowPlaying")}
                  className="group relative shrink-0 cursor-pointer rounded-(--radius-art) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                >
                  <Artwork artwork={track.artwork} size="small" className="size-12 md:size-14" />
                  <span className="absolute inset-0 grid place-items-center rounded-(--radius-art) bg-black/45 text-white opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ExpandIcon size={18} />
                  </span>
                </button>
                <div className="flex min-w-0 flex-col">
                  <div className="flex min-w-0 items-center gap-2">
                    <TrackLink track={track} className="truncate font-semibold hover:underline" />

                    <PreviewBadge track={track} className="hidden sm:inline-flex" />
                  </div>
                  {error ? (
                    <span role="alert" className="truncate text-sm text-accent">
                      {t("error")}
                    </span>
                  ) : track.artist.handle ? (
                    <Link
                      href={`/artist/${track.artist.handle}`}
                      className="truncate text-sm text-text-muted hover:text-text hover:underline"
                    >
                      {track.artist.name}
                    </Link>
                  ) : (
                    <span className="truncate text-sm text-text-muted">{track.artist.name}</span>
                  )}
                </div>
              </div>

              {/* Desktop: full transport + scrubber */}
              <div className="hidden min-w-0 flex-col items-stretch gap-1 md:flex">
                <TransportControls />
                <ProgressSlider />
              </div>

              {/* Mobile: play/pause and next only */}
              <div className="flex items-center gap-1 md:hidden">
                <PlayPauseButton />
                <IconButton label={t("next")} onClick={controls.next}>
                  <NextIcon />
                </IconButton>
              </div>

              <div className="hidden items-center justify-end gap-1 md:flex">
                <VolumeControl className="hidden lg:flex" />
                <IconButton
                  label={t("shortcuts")}
                  onClick={() => {
                    openPanel("shortcuts");
                  }}
                  size="sm"
                >
                  <KeyboardIcon />
                </IconButton>
                <QueueButton />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <NowPlayingSheet />
      <QueuePanel />
    </>
  );
}

export function QueueButton() {
  const t = useTranslations("player");
  const { panel, openPanel } = usePlayer();
  const upcoming = usePlayerState((s) => s.context.queue.length - s.context.index - 1);
  return (
    <IconButton
      label={t("queueWithCount", { count: Math.max(upcoming, 0) })}
      aria-haspopup="dialog"
      active={panel === "queue"}
      onClick={() => {
        openPanel(panel === "queue" ? null : "queue");
      }}
      size="sm"
    >
      <QueueIcon />
    </IconButton>
  );
}

/** "Added to queue" toast. <output> has an implicit status role, so it's announced politely. */
function Notice() {
  const { notice, dismissNotice } = usePlayer();
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(dismissNotice, 2600);
    return () => {
      clearTimeout(id);
    };
  }, [notice, dismissNotice]);

  return (
    <output className="pointer-events-none absolute inset-x-0 -top-14 flex justify-center">
      <AnimatePresence>
        {notice && (
          <motion.p
            key={notice.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={spring.snappy}
            className="rounded-full bg-text px-4 py-2 text-sm font-medium text-bg shadow-lg"
          >
            {notice.message}
          </motion.p>
        )}
      </AnimatePresence>
    </output>
  );
}
