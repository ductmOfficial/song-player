import { z } from "zod";
import { type ChartSource, SourceError, type Track } from "../types.js";
import { type DeezerTrack, deezerErrorSchema, deezerTrackSchema } from "./schema.js";

export const DEEZER_API_URL = "https://api.deezer.com";
/** Deezer's public API only exposes 30-second previews. */
export const DEEZER_PREVIEW_SEC = 30;

export interface DeezerOptions {
  fetch?: typeof fetch;
  host?: string;
}

/** Track ids are namespaced so they can never collide with another source's. */
export const toDeezerId = (id: number | string) => `dz-${String(id)}`;
export const fromDeezerId = (id: string): string | null => {
  const m = /^dz-(\d+)$/.exec(id);
  return m ? (m[1] ?? null) : null;
};

export function toDeezerTrack(t: DeezerTrack): Track {
  return {
    id: toDeezerId(t.id),
    source: "deezer",
    title: t.title,
    durationSec: t.duration,
    previewSec: DEEZER_PREVIEW_SEC,
    // Without a preview there's nothing we're allowed to play.
    streamable: t.preview !== "",
    permalink: t.link,
    artist: {
      id: String(t.artist.id),
      source: "deezer",
      name: t.artist.name,
      url: t.artist.link ?? undefined,
      avatar: {
        small: t.artist.picture_small ?? undefined,
        medium: t.artist.picture_medium ?? undefined,
        large: t.artist.picture_xl ?? undefined,
      },
    },
    artwork: {
      small: t.album.cover_small ?? undefined,
      medium: t.album.cover_medium ?? undefined,
      large: t.album.cover_xl ?? undefined,
    },
  };
}

const listEnvelope = z.object({ data: z.array(z.unknown()) });

export type DeezerSource = ChartSource & {
  /** A fresh preview URL. Deezer signs them with a short expiry, so never store one. */
  previewUrl(trackId: string): Promise<string | null>;
};

/**
 * Deezer as a chart-only source: global chart with 30 s previews. Read-only,
 * no key needed. Used to show familiar music next to Audius' independent catalogue.
 */
export function createDeezerSource({
  fetch: f = (...args) => fetch(...args),
  host = DEEZER_API_URL,
}: DeezerOptions = {}): DeezerSource {
  async function get(path: string): Promise<unknown> {
    let res: Response;
    try {
      res = await f(new URL(path, host));
    } catch (cause) {
      throw new SourceError(`Network error calling ${path}`, "deezer", cause);
    }
    if (!res.ok)
      throw new SourceError(
        `Deezer responded ${String(res.status)} for ${path}`,
        "deezer",
        undefined,
        res.status,
      );
    const body: unknown = await res.json();
    const err = deezerErrorSchema.safeParse(body);
    if (err.success) {
      // Code 800 is "no data" (unknown id).
      const status = err.data.error.code === 800 ? 404 : 502;
      throw new SourceError(
        `Deezer error: ${err.data.error.message ?? "unknown"}`,
        "deezer",
        undefined,
        status,
      );
    }
    return body;
  }

  return {
    id: "deezer",
    async chart({ limit = 10 } = {}) {
      const parsed = listEnvelope.safeParse(await get(`/chart/0/tracks?limit=${String(limit)}`));
      if (!parsed.success) throw new SourceError("Unexpected chart shape", "deezer", parsed.error);
      return parsed.data.data.flatMap((item) => {
        const r = deezerTrackSchema.safeParse(item);
        return r.success ? [toDeezerTrack(r.data)] : [];
      });
    },
    async previewUrl(trackId) {
      const raw = fromDeezerId(trackId);
      if (!raw) return null;
      try {
        const r = deezerTrackSchema.safeParse(await get(`/track/${raw}`));
        return r.success && r.data.preview ? r.data.preview : null;
      } catch (e) {
        if (e instanceof SourceError && e.status === 404) return null;
        throw e;
      }
    },
  };
}
