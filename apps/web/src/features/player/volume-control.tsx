"use client";

import { IconButton } from "@/shared/ui/icon-button";
import { VolumeIcon } from "@/shared/ui/icons";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { useControls, useMedia } from "./player-context";

export function VolumeControl({ className = "" }: { className?: string }) {
  const t = useTranslations("player");
  const volume = useMedia((m) => m.volume);
  const muted = useMedia((m) => m.muted);
  const controls = useControls();
  const effective = muted ? 0 : volume;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <IconButton label={muted ? t("unmute") : t("mute")} onClick={controls.toggleMute} size="sm">
        <VolumeIcon level={effective} />
      </IconButton>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={effective}
        aria-label={t("volume")}
        aria-valuetext={`${String(Math.round(effective * 100))}%`}
        onChange={(e) => {
          controls.setVolume(Number(e.currentTarget.value));
        }}
        style={{ "--fill": `${String(effective * 100)}%`, "--buffer": "0%" } as CSSProperties}
        className="s-range w-24"
      />
    </div>
  );
}
