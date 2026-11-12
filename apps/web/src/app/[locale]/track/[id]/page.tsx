import { PageAccent } from "@/features/accent/accent";
import { CollectionActions } from "@/features/tracks/collection-actions";
import { TrackList } from "@/features/tracks/track-list";
import { Link } from "@/i18n/navigation";
import { formatCount, formatTime } from "@/shared/format";
import { getArtistTracks, getTrack, orEmpty } from "@/shared/sources";
import { Artwork } from "@/shared/ui/artwork";
import { ExternalIcon, VerifiedIcon } from "@/shared/ui/icons";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = await orEmpty(getTrack(id), null, "track metadata");
  if (!track) return {};
  const image = track.artwork.large ?? track.artwork.medium;
  return {
    title: `${track.title} · ${track.artist.name}`,
    description: track.description?.slice(0, 160),
    openGraph: { type: "music.song", images: image ? [image] : [] },
  };
}

export default async function TrackPage({ params }: Props) {
  const { locale, id } = await params;
  const track = await getTrack(id);
  if (!track) notFound();

  const [t, format, more] = await Promise.all([
    getTranslations("track"),
    getFormatter(),
    orEmpty(getArtistTracks(track.artist.id, "popular", 8), { items: [] }, "more by artist"),
  ]);
  const moreByArtist = more.items.filter((x) => x.id !== track.id).slice(0, 6);

  const facts: [string, string][] = [
    [t("duration"), formatTime(track.durationSec)],
    ...(track.genre ? [[t("genre"), track.genre] as [string, string]] : []),
    ...(track.mood ? [[t("mood"), track.mood] as [string, string]] : []),
    ...(track.bpm ? [[t("bpm"), String(track.bpm)] as [string, string]] : []),
    ...(track.musicalKey ? [[t("key"), track.musicalKey] as [string, string]] : []),
    ...(track.releaseDate
      ? [
          [
            t("released"),
            format.dateTime(new Date(track.releaseDate), { dateStyle: "medium" }),
          ] as [string, string],
        ]
      : []),
  ];

  return (
    <main id="main" className="page-shell flex flex-col gap-16">
      <PageAccent src={track.artwork.small ?? track.artwork.medium} />

      <section className="grid items-end gap-8 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:gap-12">
        <Artwork
          artwork={track.artwork}
          size="large"
          priority
          className="aspect-square w-full max-w-[380px] shadow-[0_40px_120px_-30px_color-mix(in_oklab,var(--s-accent)_var(--glow),transparent)]"
        />
        <div className="flex min-w-0 flex-col gap-5">
          <p className="text-sm font-semibold text-accent">{t("eyebrow")}</p>
          <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.04] tracking-[-0.02em] text-balance break-words">
            {track.title}
          </h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg">
            {track.artist.handle ? (
              <Link
                href={`/artist/${track.artist.handle}`}
                className="inline-flex items-center gap-1.5 font-semibold hover:underline"
              >
                {track.artist.name}
                {track.artist.verified && (
                  <>
                    <VerifiedIcon size={18} className="text-accent" />
                    <span className="sr-only">{t("verified")}</span>
                  </>
                )}
              </Link>
            ) : (
              <span className="font-semibold">{track.artist.name}</span>
            )}
            {track.stats && (
              <span className="text-text-muted">
                ·{" "}
                {t("stats", {
                  plays: formatCount(track.stats.plays, locale),
                  likes: formatCount(track.stats.likes, locale),
                })}
              </span>
            )}
          </p>
          {track.streamable ? (
            <CollectionActions tracks={[track]} />
          ) : (
            <p className="rounded-(--radius-control) border border-border bg-surface p-4 text-text-muted">
              {t("gated")}
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="about"
        className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
      >
        <div className="flex flex-col gap-4">
          <h2 id="about" className="font-display text-3xl">
            {t("details")}
          </h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {track.tags && track.tags.length > 0 && (
            <ul aria-label={t("tags")} className="flex flex-wrap gap-2 pt-2">
              {track.tags.slice(0, 10).map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 text-sm text-text-muted"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
          {track.permalink && (
            <a
              href={track.permalink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1.5 pt-2 text-sm font-semibold hover:underline"
            >
              {t("openOnAudius")}
              <ExternalIcon size={14} />
            </a>
          )}
        </div>
        {track.description && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-3xl">{t("description")}</h2>
            <p className="max-w-[65ch] whitespace-pre-line leading-relaxed text-text-muted">
              {track.description}
            </p>
          </div>
        )}
      </section>

      {moreByArtist.length > 0 && (
        <section aria-labelledby="more" className="flex flex-col gap-4">
          <h2 id="more" className="font-display text-3xl">
            {t("moreBy", { artist: track.artist.name })}
          </h2>
          <TrackList
            tracks={moreByArtist}
            hideArtist
            showPlays
            label={t("moreBy", { artist: track.artist.name })}
          />
        </section>
      )}
      <p className="text-sm text-text-muted">{t("attribution", { artist: track.artist.name })}</p>
    </main>
  );
}
