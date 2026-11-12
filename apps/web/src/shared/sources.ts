import "server-only";
import {
  type ArtistTrackSort,
  SourceError,
  createAudiusSource,
  createDeezerSource,
} from "@song/music-sources";
import { cache } from "react";

/** Server-side Audius client. Responses are cached by Next for 5 minutes. */
export const audius = createAudiusSource({
  appName: process.env.AUDIUS_APP_NAME ?? "song-portfolio",
  fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 300 } }),
});

// Deduplicated per request: generateMetadata and the page share one lookup.
export const getTrack = cache((id: string) => audius.track(id));
export const getArtist = cache((handle: string) => audius.artist(handle));
export const getArtistTracks = cache((id: string, sort: ArtistTrackSort, limit: number) =>
  audius.artistTracks(id, { sort, limit }),
);

/** For sections that may fail without failing the page. */
export async function orEmpty<T>(p: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.error(`[audius] ${label} failed`, e instanceof SourceError ? e.message : e);
    return fallback;
  }
}

/** Deezer's public chart (30 s previews), for familiar music next to Audius. */
export const deezer = createDeezerSource({
  fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 600 } }),
});
export const getDeezerChart = cache((limit: number) => deezer.chart({ limit }));
