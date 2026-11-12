"use client";

import { formatTime } from "@/shared/format";
import { useTranslations } from "next-intl";
import { type CSSProperties, useState } from "react";
import { useControls, useMedia } from "./player-context";

/**
 * Native range input: keyboard, touch and screen-reader support for free.
 * While scrubbing we only move the thumb; the seek is committed on release,
 * so dragging doesn't fire dozens of network range requests.
 */
export function ProgressSlider({ className = "" }: { className?: string }) {
  const t = useTranslations("player");
  const currentTime = useMedia((m) => m.currentTime);
  const duration = useMedia((m) => m.duration);
  const buffered = useMedia((m) => m.buffered);
  const controls = useControls();
  const [scrub, setScrub] = useState<number | null>(null);

  const max = duration > 0 ? duration : 0;
  const value = Math.min(scrub ?? currentTime, max);
  const pct = (v: number) => (max ? `${String((v / max) * 100)}%` : "0%");

  const commit = () => {
    if (scrub === null) return;
    controls.seek(scrub);
    setScrub(null);
  };

  return (
    <div className={`flex items-center gap-3 text-xs text-text-muted tabular-nums ${className}`}>
      <span className="w-10 text-right">{formatTime(value)}</span>
      <input
        type="range"
        min={0}
        max={max || 1}
        step={1}
        value={value}
        disabled={!max}
        aria-label={t("seek")}
        aria-valuetext={t("timeOf", { current: formatTime(value), total: formatTime(max) })}
        onChange={(e) => {
          setScrub(Number(e.currentTarget.value));
        }}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        style={{ "--fill": pct(value), "--buffer": pct(buffered) } as CSSProperties}
        className="s-range min-w-0 flex-1"
      />
      <span className="w-10">{formatTime(max)}</span>
    </div>
  );
}

/** Decorative hairline progress for the compact mobile bar. */
export function ProgressLine() {
  const currentTime = useMedia((m) => m.currentTime);
  const duration = useMedia((m) => m.duration);
  const pct = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  return (
    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-border">
      <div
        className="h-full origin-left bg-accent"
        style={{ transform: `scaleX(${String(pct)})` }}
      />
    </div>
  );
}
