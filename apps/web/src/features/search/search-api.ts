import type { ArtistProfile, Track } from "@song/music-sources";

export interface SearchResults {
  tracks: Track[];
  artists: ArtistProfile[];
}

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 100;

/** Trim, collapse spaces and cap length; "" means "no search". */
export function normalizeQuery(raw: string | null | undefined): string {
  const q = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX);
  return q.length >= SEARCH_MIN ? q : "";
}

export const emptyResults: SearchResults = { tracks: [], artists: [] };
