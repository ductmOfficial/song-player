"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { TrackGrid } from "../tracks/track-grid";
import { uniqueRecent } from "./history-store";
import { useHistory } from "./use-history";

/** "Listen again" row on Discover. Renders nothing for first-time visitors. */
export function RecentlyPlayed() {
  const t = useTranslations("history");
  const listens = useHistory();
  const tracks = useMemo(() => uniqueRecent(listens, 6), [listens]);
  if (tracks.length === 0) return null;

  return (
    <section aria-labelledby="recent" className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <h2 id="recent" className="font-display text-[2.125rem] font-normal tracking-tight">
          {t("listenAgain")}
        </h2>
        <Link
          href="/history"
          className="text-sm font-semibold text-text-muted hover:text-text hover:underline"
        >
          {t("seeAll")}
        </Link>
      </div>
      <TrackGrid tracks={tracks} label={t("listenAgain")} />
    </section>
  );
}
