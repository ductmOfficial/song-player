import { type ZodType, z } from "zod";
import {
  type ArtistProfile,
  type Artwork,
  type MusicSource,
  type Page,
  SourceError,
  type Track,
} from "../types.js";
import {
  type AudiusTrack,
  type AudiusUser,
  audiusHostsSchema,
  audiusSingleSchema,
  audiusTrackSchema,
  audiusUserSchema,
  audiusUserSingleSchema,
} from "./schema.js";

export const DISCOVERY_URL = "https://api.audius.co";
const AUDIUS_WEB = "https://audius.co";

export interface AudiusOptions {
  /** Identifies your app to Audius (required by their API terms). */
  appName: string;
  fetch?: typeof fetch;
  /** Skip host discovery, e.g. in tests or in the browser. */
  host?: string;
}

const square = (a: AudiusTrack["artwork"]): Artwork => ({
  small: a?.["150x150"] ?? undefined,
  medium: a?.["480x480"] ?? undefined,
  large: a?.["1000x1000"] ?? undefined,
});

const opt = <T>(v: T | null | undefined): T | undefined => v ?? undefined;
/** Trimmed text, or undefined when missing or blank. */
const text = (v: string | null | undefined): string | undefined =>
  v?.trim() ? v.trim() : undefined;

export function toArtist(u: AudiusUser): ArtistProfile {
  return {
    id: u.id,
    source: "audius",
    name: u.name,
    handle: u.handle,
    url: `${AUDIUS_WEB}/${u.handle}`,
    avatar: square(u.profile_picture),
    verified: u.is_verified ?? false,
    bio: text(u.bio),
    location: text(u.location),
    cover: opt(u.cover_photo?.["2000x"] ?? u.cover_photo?.["640x"]),
    followerCount: u.follower_count ?? 0,
    followingCount: u.followee_count ?? 0,
    trackCount: u.track_count ?? 0,
  };
}

export function toTrack(t: AudiusTrack): Track {
  const { id, source, name, handle, url, avatar, verified } = toArtist(t.user);
  const artist = { id, source, name, handle, url, avatar, verified };
  return {
    id: t.id,
    source: "audius",
    title: t.title,
    durationSec: t.duration,
    genre: text(t.genre),
    mood: text(t.mood),
    permalink: t.permalink ? `${AUDIUS_WEB}${t.permalink}` : undefined,
    artist,
    artwork: square(t.artwork),
    streamable: t.is_streamable !== false && t.access?.stream !== false,
    stats: {
      plays: t.play_count ?? 0,
      likes: t.favorite_count ?? 0,
      reposts: t.repost_count ?? 0,
    },
    releaseDate: opt(t.release_date),
    description: text(t.description),
    tags: t.tags
      ? t.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    bpm: t.bpm ? Math.round(t.bpm) : undefined,
    musicalKey: text(t.musical_key),
  };
}

/** Parse each item on its own, so one malformed record doesn't empty the whole list. */
function parseEach<T>(items: unknown[], schema: ZodType<T>): T[] {
  return items.flatMap((item) => {
    const r = schema.safeParse(item);
    return r.success ? [r.data] : [];
  });
}

const listEnvelope = z.object({ data: z.array(z.unknown()) });

export function createAudiusSource({
  appName,
  fetch: f = (...args) => fetch(...args),
  host,
}: AudiusOptions): MusicSource {
  let hostPromise: Promise<string> | undefined = host ? Promise.resolve(host) : undefined;

  async function resolveHost(): Promise<string> {
    hostPromise ??= (async () => {
      try {
        const res = await f(DISCOVERY_URL);
        const { data } = audiusHostsSchema.parse(await res.json());
        return data[Math.floor(Math.random() * data.length)] ?? DISCOVERY_URL;
      } catch {
        return DISCOVERY_URL;
      }
    })();
    return hostPromise;
  }

  async function get<T>(path: string, schema: ZodType<T>, params: Record<string, string> = {}) {
    const url = new URL(`/v1${path}`, await resolveHost());
    url.search = new URLSearchParams({ ...params, app_name: appName }).toString();
    let res: Response;
    try {
      res = await f(url);
    } catch (cause) {
      throw new SourceError(`Network error calling ${path}`, "audius", cause);
    }
    if (!res.ok) {
      throw new SourceError(
        `Audius responded ${String(res.status)} for ${path}`,
        "audius",
        undefined,
        res.status,
      );
    }
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) {
      throw new SourceError(`Unexpected response shape for ${path}`, "audius", parsed.error);
    }
    return parsed.data;
  }

  /** Audius answers 400 for malformed ids and 404 for unknown ones. */
  async function orNull<T>(p: Promise<T>): Promise<T | null> {
    try {
      return await p;
    } catch (e) {
      if (e instanceof SourceError && (e.status === 404 || e.status === 400)) return null;
      throw e;
    }
  }

  async function trackPage(
    path: string,
    params: Record<string, string>,
    limit: number,
    offset: number,
  ) {
    const { data } = await get(path, listEnvelope, params);
    const items = parseEach(data, audiusTrackSchema).map(toTrack);
    return { items, nextOffset: data.length === limit ? offset + limit : undefined };
  }

  return {
    id: "audius",
    async trending({ limit = 20, genre, time } = {}) {
      const params: Record<string, string> = { limit: String(limit) };
      if (genre) params.genre = genre;
      if (time) params.time = time;
      const { data } = await get("/tracks/trending", listEnvelope, params);
      return parseEach(data, audiusTrackSchema).slice(0, limit).map(toTrack);
    },
    search(query, { limit = 20, offset = 0 } = {}): Promise<Page<Track>> {
      return trackPage(
        "/tracks/search",
        { query, limit: String(limit), offset: String(offset) },
        limit,
        offset,
      );
    },
    async searchArtists(query, { limit = 10, offset = 0 } = {}) {
      const { data } = await get("/users/search", listEnvelope, {
        query,
        limit: String(limit),
        offset: String(offset),
      });
      return {
        items: parseEach(data, audiusUserSchema).map(toArtist),
        nextOffset: data.length === limit ? offset + limit : undefined,
      };
    },
    async track(id) {
      const res = await orNull(get(`/tracks/${encodeURIComponent(id)}`, audiusSingleSchema));
      return res ? toTrack(res.data) : null;
    },
    async artist(handle) {
      const res = await orNull(
        get(`/users/handle/${encodeURIComponent(handle)}`, audiusUserSingleSchema),
      );
      return res ? toArtist(res.data) : null;
    },
    artistTracks(artistId, { limit = 20, offset = 0, sort = "popular" } = {}) {
      const params: Record<string, string> = { limit: String(limit), offset: String(offset) };
      if (sort === "popular") params.sort = "plays";
      return trackPage(`/users/${encodeURIComponent(artistId)}/tracks`, params, limit, offset);
    },
    async streamUrl(trackId) {
      const url = new URL(`/v1/tracks/${encodeURIComponent(trackId)}/stream`, await resolveHost());
      url.searchParams.set("app_name", appName);
      return url.toString();
    },
  };
}
