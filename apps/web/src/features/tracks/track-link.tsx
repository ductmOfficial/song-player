import { Link } from "@/i18n/navigation";
import type { Track } from "@song/music-sources";
import { useTranslations } from "next-intl";
import type { MouseEventHandler, ReactNode } from "react";

interface Props {
  track: Track;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children?: ReactNode;
}

/**
 * Title link for any source: our own track page for Audius, the provider's
 * page otherwise (we only have chart data for Deezer, not full track pages).
 */
export function TrackLink({ track, className, onClick, children }: Props) {
  const t = useTranslations("tracks");
  if (track.source === "audius") {
    return (
      <Link href={`/track/${track.id}`} className={className} onClick={onClick}>
        {children ?? track.title}
      </Link>
    );
  }
  if (!track.permalink) return <span className={className}>{children ?? track.title}</span>;
  return (
    <a
      href={track.permalink}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={onClick}
    >
      {children ?? track.title}
      <span className="sr-only"> ({t("opensOn", { source: sourceName[track.source] })})</span>
    </a>
  );
}

export const sourceName: Record<Track["source"], string> = {
  audius: "Audius",
  deezer: "Deezer",
  jamendo: "Jamendo",
};

/** "30s preview" pill for tracks we can only play a clip of. */
export function PreviewBadge({ track, className = "" }: { track: Track; className?: string }) {
  const t = useTranslations("tracks");
  if (!track.previewSec) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold tracking-wide text-text-muted uppercase ${className}`}
    >
      {t("preview", { seconds: track.previewSec })}
    </span>
  );
}
