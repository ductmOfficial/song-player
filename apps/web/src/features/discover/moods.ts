import type { TrendingTime } from "@song/music-sources";

/**
 * Moods are an editorial layer over Audius genres: Audius trending can be
 * filtered by genre, not by mood, so each mood picks the closest genre.
 */
export const moods = {
  all: undefined,
  focus: "Ambient",
  night: "Downtempo",
  rain: "Lo-Fi",
  energy: "House",
  chill: "Chill",
  road: "Acoustic",
} as const satisfies Record<string, string | undefined>;

export type Mood = keyof typeof moods;

export const isMood = (v: unknown): v is Mood => typeof v === "string" && Object.hasOwn(moods, v);

/** Trending windows Audius supports, in display order. `week` is the default. */
export const times = ["week", "month", "allTime"] as const satisfies readonly TrendingTime[];
export type Time = (typeof times)[number];

export const isTime = (v: unknown): v is Time => times.includes(v as Time);

export interface DiscoverFilter {
  mood: Mood;
  time: Time;
}

/** Query string for a filter, omitting defaults so `/` stays clean. */
export function filterQuery({ mood, time }: DiscoverFilter): Record<string, string> {
  const q: Record<string, string> = {};
  if (mood !== "all") q.mood = mood;
  if (time !== "week") q.time = time;
  return q;
}
