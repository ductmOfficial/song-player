"use client";

import { Link } from "@/i18n/navigation";
import { dayKey } from "@/shared/format";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@song/ui";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useMemo, useSyncExternalStore } from "react";
import { usePlayer } from "../player/player-context";
import { TrackList } from "../tracks/track-list";
import type { Listen } from "./history-store";
import { useHistory } from "./use-history";

const subscribeNothing = () => () => undefined;

/** Listens grouped by calendar day: "Today", "Yesterday", then dates. */
export function HistoryView() {
  const t = useTranslations("history");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const listens = useHistory();
  const { history } = usePlayer();
  // History lives in this browser; render the list only after hydration.
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const groups = useMemo(() => {
    const map = new Map<string, Listen[]>();
    for (const l of listens) {
      const k = dayKey(new Date(l.playedAt));
      map.set(k, [...(map.get(k) ?? []), l]);
    }
    return [...map.entries()];
  }, [listens]);

  if (!hydrated) return null;
  if (listens.length === 0) {
    return (
      <EmptyState title={t("emptyTitle")} body={t("emptyBody")}>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-on-accent hover:brightness-110"
        >
          {t("discover")}
        </Link>
      </EmptyState>
    );
  }

  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const label = (k: string, sample: number) =>
    k === today
      ? t("today")
      : k === yesterday
        ? t("yesterday")
        : format.dateTime(new Date(sample), { dateStyle: "full" });

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-text-muted">{t("localNote")}</p>
        <Button
          variant="secondary"
          onClick={() => {
            history.clear();
          }}
        >
          {t("clear")}
        </Button>
      </div>
      {groups.map(([k, items]) => {
        const heading = label(k, items[0]?.playedAt ?? 0);
        return (
          <section key={k} aria-label={heading} className="flex flex-col gap-3">
            <h2 className="font-display text-2xl first-letter:uppercase">{heading}</h2>
            <TrackList tracks={items.map((l) => l.track)} label={heading} />
          </section>
        );
      })}
    </div>
  );
}
