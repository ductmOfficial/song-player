import { PageAccent } from "@/features/accent/accent";
import { CollectionActions } from "@/features/tracks/collection-actions";
import { TrackList } from "@/features/tracks/track-list";
import { formatCount } from "@/shared/format";
import { getArtist, getArtistTracks, orEmpty } from "@/shared/sources";
import { Artwork } from "@/shared/ui/artwork";
import { EmptyState } from "@/shared/ui/empty-state";
import { ExternalIcon, VerifiedIcon } from "@/shared/ui/icons";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";

interface Props {
  params: Promise<{ locale: string; handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const artist = await orEmpty(getArtist(decodeURIComponent(handle)), null, "artist metadata");
  if (!artist) return {};
  const image = artist.avatar?.large ?? artist.avatar?.medium;
  return {
    title: artist.name,
    description: artist.bio?.slice(0, 160),
    openGraph: { type: "profile", images: image ? [image] : [] },
  };
}

export default async function ArtistPage({ params }: Props) {
  const { locale, handle } = await params;
  const artist = await getArtist(decodeURIComponent(handle));
  if (!artist) notFound();

  const [t, popular, recent] = await Promise.all([
    getTranslations("artist"),
    orEmpty(getArtistTracks(artist.id, "popular", 10), { items: [] }, "popular tracks"),
    orEmpty(getArtistTracks(artist.id, "recent", 10), { items: [] }, "recent tracks"),
  ]);
  const stats = [
    t("followers", {
      count: artist.followerCount,
      formatted: formatCount(artist.followerCount, locale),
    }),
    t("tracks", { count: artist.trackCount, formatted: formatCount(artist.trackCount, locale) }),
  ];

  return (
    <main id="main" className="page-shell flex flex-col gap-14 pt-0!">
      <PageAccent src={artist.avatar?.small ?? artist.avatar?.medium} />

      <section className="relative isolate -mx-5 overflow-hidden sm:-mx-10 sm:rounded-b-2xl">
        {artist.cover ? (
          <Image
            src={artist.cover}
            alt=""
            fill
            className="absolute inset-0 -z-10 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_20%_0%,color-mix(in_oklab,var(--s-accent)_45%,transparent),transparent_60%)]" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-[color-mix(in_oklab,var(--s-bg)_70%,transparent)] to-transparent" />
        <div className="flex flex-col items-start gap-6 px-5 pt-32 pb-8 sm:flex-row sm:items-end sm:px-10 sm:pt-48">
          <Artwork
            artwork={artist.avatar}
            size="medium"
            rounded="full"
            priority
            className="size-36 shrink-0 shadow-2xl ring-4 ring-bg sm:size-44"
          />
          <div className="flex min-w-0 flex-col gap-3">
            <p className="text-sm font-semibold text-accent">{t("eyebrow")}</p>
            <h1 className="flex items-center gap-3 font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-[-0.02em] break-words">
              {artist.name}
              {artist.verified && (
                <>
                  <VerifiedIcon size={32} className="shrink-0 text-accent" />
                  <span className="sr-only">{t("verified")}</span>
                </>
              )}
            </h1>
            <p className="text-text-muted">
              {[`@${String(artist.handle)}`, artist.location, ...stats].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <CollectionActions tracks={popular.items} playLabel={t("playPopular")} />
        {artist.url && (
          <a
            href={artist.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            {t("openOnAudius")}
            <ExternalIcon size={14} />
          </a>
        )}
      </div>

      <div className="grid gap-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="popular" className="flex flex-col gap-4">
          <h2 id="popular" className="font-display text-3xl">
            {t("popular")}
          </h2>
          {popular.items.length > 0 ? (
            <TrackList tracks={popular.items} hideArtist showPlays label={t("popular")} />
          ) : (
            <EmptyState title={t("noTracks")} />
          )}
        </section>
        {artist.bio && (
          <section aria-labelledby="bio" className="flex flex-col gap-4">
            <h2 id="bio" className="font-display text-3xl">
              {t("about")}
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-text-muted">{artist.bio}</p>
          </section>
        )}
      </div>

      {recent.items.length > 0 && (
        <section aria-labelledby="recent-releases" className="flex flex-col gap-4">
          <h2 id="recent-releases" className="font-display text-3xl">
            {t("recent")}
          </h2>
          <TrackList tracks={recent.items} hideArtist label={t("recent")} />
        </section>
      )}
      <p className="text-sm text-text-muted">{t("attribution")}</p>
    </main>
  );
}
