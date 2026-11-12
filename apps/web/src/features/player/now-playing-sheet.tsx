"use client";

import { Link } from "@/i18n/navigation";
import { Artwork } from "@/shared/ui/artwork";
import { Dialog } from "@/shared/ui/dialog";
import { IconButton } from "@/shared/ui/icon-button";
import { ChevronDownIcon, ExternalIcon } from "@/shared/ui/icons";
import { spring } from "@song/ui";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { PreviewBadge, TrackLink, sourceName } from "../tracks/track-link";
import { QueueButton } from "./player-bar";
import { selectCurrent, usePlayer, usePlayerState } from "./player-context";
import { ProgressSlider } from "./progress-slider";
import { TransportControls } from "./transport-controls";
import { VolumeControl } from "./volume-control";
import Image from "next/image";

/** Full-screen "Now playing": the mobile player, and a lean-back view on desktop. */
export function NowPlayingSheet() {
  const t = useTranslations("player");
  const { panel, openPanel } = usePlayer();
  const track = usePlayerState(selectCurrent);
  const close = () => {
    openPanel(null);
  };

  return (
    <Dialog
      open={panel === "nowPlaying" && !!track}
      onClose={close}
      labelledBy="np-title"
      variant="full"
    >
      {track && (
        <div className="relative isolate flex h-full flex-col overflow-y-auto">
          {/* Artwork-tinted backdrop */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
            {track.artwork.small && (
              <Image
                src={track.artwork.small}
                alt=""
                fill
                className="size-full scale-125 object-cover opacity-40 blur-3xl saturate-150"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklab,var(--s-bg)_40%,transparent)] to-bg" />
          </div>

          <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
            <IconButton label={t("closeNowPlaying")} onClick={close}>
              <ChevronDownIcon />
            </IconButton>
            <p className="text-sm font-semibold text-text-muted">{t("nowPlayingTitle")}</p>
            <QueueButton />
          </header>

          <div className="mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-8 px-6 py-6 sm:px-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={track.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={spring.gentle}
                className="mx-auto w-full max-w-[min(520px,60dvh)]"
              >
                <Artwork
                  artwork={track.artwork}
                  size="large"
                  priority
                  className="aspect-square w-full shadow-[0_40px_120px_-30px_color-mix(in_oklab,var(--s-accent)_45%,transparent)]"
                />
              </motion.div>
            </AnimatePresence>

            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex min-w-0 flex-col gap-2">
                <h2
                  id="np-title"
                  className="font-display text-[clamp(1.75rem,4vw,3rem)] leading-tight tracking-tight text-balance"
                >
                  <TrackLink track={track} onClick={close} className="hover:underline">
                    {track.title}
                  </TrackLink>
                </h2>
                <PreviewBadge track={track} className="w-fit" />
                {track.artist.handle ? (
                  <Link
                    href={`/artist/${track.artist.handle}`}
                    onClick={close}
                    className="w-fit text-lg text-text-muted hover:text-text hover:underline"
                  >
                    {track.artist.name}
                  </Link>
                ) : (
                  <p className="text-lg text-text-muted">{track.artist.name}</p>
                )}
              </div>
              <ProgressSlider />
              <TransportControls size="lg" />
              <div className="flex items-center justify-between gap-4">
                <VolumeControl />
                {track.permalink && (
                  <a
                    href={track.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
                  >
                    {t("openOn", { source: sourceName[track.source] })}
                    <ExternalIcon size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
