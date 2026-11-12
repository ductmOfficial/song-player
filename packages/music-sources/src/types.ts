/**
 * Source-agnostic domain model. UI code depends on these types only,
 * never on a provider's raw response shape.
 */
export type SourceId = "audius" | "deezer" | "jamendo";

export interface Artwork {
  small?: string;
  medium?: string;
  large?: string;
}

export interface Artist {
  id: string;
  source: SourceId;
  name: string;
  handle?: string;
  /** Profile on the provider's site, for attribution */
  url?: string;
  avatar?: Artwork;
  verified?: boolean;
}

/** Everything an artist page needs. */
export type ArtistProfile = Artist & {
  bio?: string;
  location?: string;
  /** Wide banner image */
  cover?: string;
  followerCount: number;
  followingCount: number;
  trackCount: number;
};

export interface TrackStats {
  plays: number;
  likes: number;
  reposts: number;
}

export interface Track {
  id: string;
  source: SourceId;
  title: string;
  artist: Artist;
  durationSec: number;
  genre?: string;
  mood?: string;
  artwork: Artwork;
  /** Page on the provider's site, for attribution */
  permalink?: string;
  /** False for gated or removed tracks: show them, but don't offer playback. */
  streamable: boolean;
  /**
   * Set when only a short preview can be played (e.g. Deezer's 30 s clips).
   * `durationSec` stays the full length; this is what the player will actually play.
   */
  previewSec?: number;
  stats?: TrackStats;
  releaseDate?: string;
  description?: string;
  tags?: string[];
  bpm?: number;
  musicalKey?: string;
}

export interface Page<T> {
  items: T[];
  nextOffset?: number;
}

export type ArtistTrackSort = "recent" | "popular";

/** Trending window. Audius supports exactly these three. */
export type TrendingTime = "week" | "month" | "allTime";

export interface MusicSource {
  readonly id: SourceId;
  trending(opts?: { limit?: number; genre?: string; time?: TrendingTime }): Promise<Track[]>;
  search(query: string, opts?: { limit?: number; offset?: number }): Promise<Page<Track>>;
  searchArtists(
    query: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<Page<ArtistProfile>>;
  track(id: string): Promise<Track | null>;
  /** Look an artist up by handle (preferred in URLs) */
  artist(handle: string): Promise<ArtistProfile | null>;
  artistTracks(
    artistId: string,
    opts?: { limit?: number; offset?: number; sort?: ArtistTrackSort },
  ): Promise<Page<Track>>;
  /** A URL the <audio> element can play */
  streamUrl(trackId: string): Promise<string>;
}

/**
 * A catalogue we can only show charts from (no search, no artist pages).
 * Kept separate from `MusicSource` so a partial provider doesn't have to stub methods.
 */
export interface ChartSource {
  readonly id: SourceId;
  chart(opts?: { limit?: number }): Promise<Track[]>;
}

export class SourceError extends Error {
  constructor(
    message: string,
    readonly source: SourceId,
    override readonly cause?: unknown,
    /** HTTP status when the provider answered */
    readonly status?: number,
  ) {
    super(message);
    this.name = "SourceError";
  }
}
