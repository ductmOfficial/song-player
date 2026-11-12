import { PageAccent } from "@/features/accent/accent";
import { CollectionActions } from "@/features/tracks/collection-actions";
import { TrackGrid } from "@/features/tracks/track-grid";
import { audius, orEmpty } from "@/shared/sources";
import { EmptyState } from "@/shared/ui/empty-state";
import { getTranslations } from "next-intl/server";

export default async function DiscoverPage() {
  const [t, trending] = await Promise.all([
    getTranslations("discover"),
    orEmpty(audius.trending({ limit: 12 }), [], "trending"),
  ]);

  return (
    <main id="main" className="page-shell flex flex-col gap-8">
      <PageAccent src={trending[0]?.artwork.small} />
      <section aria-labelledby="trending" className="flex flex-col gap-6">
        <h1
          id="trending"
          className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] font-normal tracking-[-0.03em]"
        >
          {t("trendingTitle")}
        </h1>
        {trending.length > 0 ? (
          <>
            <CollectionActions tracks={trending} playLabel={t("playCollection")} />
            <TrackGrid tracks={trending} label={t("trendingTitle")} />
          </>
        ) : (
          <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
        )}
        <p className="text-sm text-text-muted">{t("attribution")}</p>
      </section>
    </main>
  );
}
