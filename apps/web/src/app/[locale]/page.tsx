import { audius, orEmpty } from "@/shared/sources";
import { getTranslations } from "next-intl/server";

export default async function DiscoverPage() {
  const [t, trending] = await Promise.all([
    getTranslations("discover"),
    orEmpty(audius.trending({ limit: 12 }), [], "trending"),
  ]);

  return (
    <main id="main" className="page-shell flex flex-col gap-8">
      <section aria-labelledby="trending" className="flex flex-col gap-6">
        <h1
          id="trending"
          className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] font-normal tracking-[-0.03em]"
        >
          {t("trendingTitle")}
        </h1>
        {trending.length > 0 ? (
          <ol className="flex flex-col gap-3">
            {trending.map((track) => (
              <li key={track.id} className="flex flex-col">
                <span className="font-semibold">{track.title}</span>
                <span className="text-sm text-text-muted">{track.artist.name}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-text-muted">{t("emptyBody")}</p>
        )}
        <p className="text-sm text-text-muted">{t("attribution")}</p>
      </section>
    </main>
  );
}
