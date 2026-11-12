"use client";

import { IconButton } from "@/shared/ui/icon-button";
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  ShuffleIcon,
} from "@/shared/ui/icons";
import { useTranslations } from "next-intl";
import { useControls, useMedia, usePlayer, usePlayerState } from "./player-context";

type Size = "md" | "lg";

/** Big round play/pause. Shows a ring while the stream is loading or buffering. */
export function PlayPauseButton({ size = "md" }: { size?: Size }) {
  const t = useTranslations("player");
  const controls = useControls();
  const state = usePlayerState((s) => s.value);
  const waiting = useMedia((m) => m.waiting);
  const hasQueue = usePlayerState((s) => s.context.queue.length > 0);
  const playing = state === "playing" || state === "loading";
  const busy = state === "loading" || (state === "playing" && waiting);
  const dim = size === "lg" ? "size-18" : "size-12";

  return (
    <button
      type="button"
      onClick={controls.toggle}
      disabled={!hasQueue}
      aria-label={playing ? t("pause") : t("play")}
      title={playing ? t("pause") : t("play")}
      className={`relative grid ${dim} shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-on-accent transition-[transform,filter] duration-(--duration-fast) ease-(--ease-standard) hover:brightness-110 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text`}
    >
      {busy && <span aria-hidden="true" className="s-spinner absolute inset-0 rounded-full" />}
      {playing ? (
        <PauseIcon size={size === "lg" ? 28 : 20} />
      ) : (
        <PlayIcon size={size === "lg" ? 28 : 20} />
      )}
    </button>
  );
}

export function TransportControls({
  size = "md",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const t = useTranslations("player");
  const { player } = usePlayer();
  const controls = useControls();
  const shuffle = usePlayerState((s) => s.context.shuffle);
  const repeat = usePlayerState((s) => s.context.repeat);
  const hasQueue = usePlayerState((s) => s.context.queue.length > 0);
  const iconSize = size === "lg" ? 26 : 20;

  const repeatLabel = { off: t("repeatOff"), all: t("repeatAll"), one: t("repeatOne") }[repeat];

  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}>
      <IconButton
        label={t("shuffle")}
        pressed={shuffle}
        onClick={() => player?.actor.send({ type: "TOGGLE_SHUFFLE" })}
        disabled={!hasQueue}
      >
        <ShuffleIcon size={iconSize - 2} />
      </IconButton>
      <IconButton label={t("previous")} onClick={controls.prev} disabled={!hasQueue}>
        <PrevIcon size={iconSize} />
      </IconButton>
      <PlayPauseButton size={size} />
      <IconButton label={t("next")} onClick={controls.next} disabled={!hasQueue}>
        <NextIcon size={iconSize} />
      </IconButton>
      <IconButton
        label={repeatLabel}
        active={repeat !== "off"}
        onClick={() => player?.actor.send({ type: "CYCLE_REPEAT" })}
        disabled={!hasQueue}
      >
        <RepeatIcon one={repeat === "one"} size={iconSize - 2} />
      </IconButton>
    </div>
  );
}
