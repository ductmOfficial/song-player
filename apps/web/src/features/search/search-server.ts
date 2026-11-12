import "server-only";
import { audius } from "@/shared/sources";
import type { SearchResults } from "./search-api";

/** One search for both kinds; either half may fail on its own. */
export async function searchAll(q: string): Promise<SearchResults> {
  const [tracks, artists] = await Promise.allSettled([
    audius.search(q, { limit: 20 }),
    audius.searchArtists(q, { limit: 6 }),
  ]);
  if (tracks.status === "rejected" && artists.status === "rejected") throw tracks.reason;
  return {
    tracks: tracks.status === "fulfilled" ? tracks.value.items : [],
    artists: artists.status === "fulfilled" ? artists.value.items : [],
  };
}
