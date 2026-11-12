import { PageAccent } from "@/features/accent/accent";
import { type DiscoverFilter, isMood, isTime, moods } from "@/features/discover/moods";
import { TrendingFilters } from "@/features/discover/trending-filters";
import { CollectionActions } from "@/features/tracks/collection-actions";
import { TrackGrid } from "@/features/tracks/track-grid";
import { TrackList } from "@/features/tracks/track-list";
import { audius, getDeezerChart, orEmpty } from "@/shared/sources";
import { EmptyState } from "@/shared/ui/empty-state";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

interface Props {
  searchParams: Promise<{ mood?: string; time?: string }>;
}

export default async function DiscoverPage({ searchParams }: Props) {
  const query = await searchParams;
  const filter: DiscoverFilter = {
    mood: isMood(query.mood) ? query.mood : "all",
    time: isTime(query.time) ? query.time : "week",
  };

  const [t, classics, trending, chart] = await Promise.all([
    getTranslations("discover"),
    // The hero features Audius' all-time favourites: the names people recognise.
    orEmpty(audius.trending({ limit: 12, time: "allTime" }), [], "all-time trending"),
    orEmpty(
      audius.trending({ limit: 12, genre: moods[filter.mood], time: filter.time }),
      [],
      "trending",
    ),
    orEmpty(getDeezerChart(10), [], "deezer chart"),
  ]);
  const cover = classics.find((tr) => tr.artwork.large ?? tr.artwork.medium);
  const coverSrc = cover?.artwork.large ?? cover?.artwork.medium;

  return (
    <main id="main" className="page-shell flex flex-col gap-20">
      <PageAccent src={cover?.artwork.small ?? coverSrc} />

      <section className="flex flex-wrap items-center gap-x-14 gap-y-10">
        <div className="flex flex-[1_1_380px] flex-col gap-6">
          <p className="text-sm font-semibold text-accent">{t("issue")}</p>
          <h1 className="font-display text-[clamp(3rem,6vw,5.25rem)] leading-[1.02] font-normal tracking-[-0.03em] text-balance [&_em]:text-accent">
            {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
          </h1>
          <p className="max-w-[52ch] text-lg leading-relaxed text-text-muted">{t("lede")}</p>
          <CollectionActions tracks={classics} playLabel={t("playCollection")} />
        </div>

        {cover && coverSrc && (
          <figure className="flex flex-[0_1_440px] flex-col gap-3">
            <Image
              src={coverSrc}
              alt=""
              width={1000}
              height={1000}
              loading="eager"
              fetchPriority="high"
              className="aspect-square w-full rounded-(--radius-art) object-cover shadow-[0_40px_120px_-30px_color-mix(in_oklab,var(--s-accent)_var(--glow),transparent)] transition-shadow duration-(--duration-slower)"
            />
            <figcaption className="text-sm text-text-muted">
              {t("artworkCaption", { title: cover.title, artist: cover.artist.name })}
            </figcaption>
          </figure>
        )}
      </section>

      <section aria-labelledby="trending" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="trending" className="font-display text-[2.125rem] font-normal tracking-tight">
            {t("trendingTitle")}
          </h2>
          <p className="text-text-muted">{t("filtersHint")}</p>
        </div>
        <TrendingFilters selected={filter}>
          {trending.length > 0 ? (
            <TrackGrid
              key={`${filter.mood}-${filter.time}`}
              tracks={trending}
              label={t("trendingTitle")}
            />
          ) : (
            <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
          )}
        </TrendingFilters>
        <p className="text-sm text-text-muted">{t("attribution")}</p>
      </section>

      {chart.length > 0 && (
        <section aria-labelledby="chart" className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 id="chart" className="font-display text-[2.125rem] font-normal tracking-tight">
              {t("chartTitle")}
            </h2>
            <p className="max-w-[65ch] text-text-muted">{t("chartNote")}</p>
          </div>
          <TrackList tracks={chart} label={t("chartTitle")} />
          <p className="text-sm text-text-muted">{t("chartAttribution")}</p>
        </section>
      )}
    </main>
  );
}
