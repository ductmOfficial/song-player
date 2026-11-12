import { describe, expect, it, vi } from "vitest";
import { SourceError } from "../types.js";
import { createAudiusSource } from "./client.js";

/** The URL a fetch mock was called with. */
const urlOf = (input: URL | RequestInfo | undefined): string =>
  input instanceof URL ? input.href : typeof input === "string" ? input : (input?.url ?? "");

const rawUser = {
  id: "u1",
  name: "Linh Hà",
  handle: "linhha",
  is_verified: true,
  bio: "  Ambient from Hội An.  ",
  location: "",
  follower_count: 1200,
  followee_count: 40,
  track_count: 12,
  profile_picture: { "150x150": "https://cdn.test/u150.jpg", "480x480": null },
  cover_photo: { "640x": "https://cdn.test/c640.jpg", "2000x": null },
  wallet: "0xignored",
};

const rawTrack = {
  id: "abc",
  title: "Thủy triều xanh",
  duration: 268,
  genre: "Ambient",
  mood: "",
  permalink: "/linhha/thuy-trieu-xanh",
  tags: "ambient, chill,,night",
  play_count: 5,
  favorite_count: 2,
  repost_count: 1,
  bpm: 92.4,
  is_streamable: true,
  access: { stream: true, download: false },
  artwork: { "150x150": "https://cdn.test/150.jpg", "480x480": null },
  user: rawUser,
  extra_field_we_ignore: true,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function sourceWith(handler: (url: URL) => Response) {
  const fetchMock = vi.fn((url: URL | RequestInfo) =>
    Promise.resolve(handler(new URL(urlOf(url)))),
  );
  const source = createAudiusSource({
    appName: "song-test",
    host: "https://host.test",
    fetch: fetchMock,
  });
  return { source, fetchMock, calledUrl: (i = 0) => new URL(urlOf(fetchMock.mock.calls[i]?.[0])) };
}

describe("createAudiusSource", () => {
  it("maps trending tracks to the domain model and sends app_name", async () => {
    const { source, calledUrl } = sourceWith(() => json({ data: [rawTrack] }));

    const [track] = await source.trending({ limit: 1 });

    expect(calledUrl().pathname).toBe("/v1/tracks/trending");
    expect(calledUrl().searchParams.get("app_name")).toBe("song-test");
    expect(track).toMatchObject({
      id: "abc",
      source: "audius",
      durationSec: 268,
      mood: undefined,
      streamable: true,
      tags: ["ambient", "chill", "night"],
      bpm: 92,
      stats: { plays: 5, likes: 2, reposts: 1 },
      artist: { name: "Linh Hà", url: "https://audius.co/linhha", verified: true },
      artwork: { small: "https://cdn.test/150.jpg", medium: undefined },
      permalink: "https://audius.co/linhha/thuy-trieu-xanh",
    });
    // Profile-only fields stay off the embedded artist.
    expect(track?.artist).not.toHaveProperty("bio");
  });

  it("passes the trending window", async () => {
    const { source, calledUrl } = sourceWith(() => json({ data: [] }));
    await source.trending({ time: "allTime", genre: "House" });
    expect(calledUrl().searchParams.get("time")).toBe("allTime");
    expect(calledUrl().searchParams.get("genre")).toBe("House");
  });

  it("marks gated tracks as not streamable", async () => {
    const { source } = sourceWith(() =>
      json({ data: [{ ...rawTrack, access: { stream: false } }] }),
    );
    const [track] = await source.trending();
    expect(track?.streamable).toBe(false);
  });

  it("drops malformed items instead of failing the whole list", async () => {
    const { source } = sourceWith(() => json({ data: [{ id: 1 }, rawTrack] }));
    const tracks = await source.trending();
    expect(tracks.map((t) => t.id)).toEqual(["abc"]);
  });

  it("rejects an envelope that does not match the schema", async () => {
    const { source } = sourceWith(() => json({ nope: true }));
    await expect(source.trending()).rejects.toBeInstanceOf(SourceError);
  });

  it("returns null for a missing or malformed track id", async () => {
    for (const status of [404, 400]) {
      const { source } = sourceWith(() => json({}, status));
      expect(await source.track("nope")).toBeNull();
    }
  });

  it("surfaces server errors with their status", async () => {
    const { source } = sourceWith(() => json({}, 503));
    await expect(source.track("x")).rejects.toMatchObject({ status: 503 });
  });

  it("maps an artist profile by handle", async () => {
    const { source, calledUrl } = sourceWith(() => json({ data: rawUser }));
    const artist = await source.artist("linhha");
    expect(calledUrl().pathname).toBe("/v1/users/handle/linhha");
    expect(artist).toMatchObject({
      id: "u1",
      bio: "Ambient from Hội An.",
      location: undefined,
      cover: "https://cdn.test/c640.jpg",
      followerCount: 1200,
      trackCount: 12,
      avatar: { small: "https://cdn.test/u150.jpg" },
    });
  });

  it("pages artist tracks sorted by plays", async () => {
    const { source, calledUrl } = sourceWith(() => json({ data: [rawTrack, rawTrack] }));
    const page = await source.artistTracks("u1", { limit: 2 });
    expect(calledUrl().pathname).toBe("/v1/users/u1/tracks");
    expect(calledUrl().searchParams.get("sort")).toBe("plays");
    expect(page.nextOffset).toBe(2);

    const recent = await source.artistTracks("u1", { limit: 5, sort: "recent" });
    expect(calledUrl(1).searchParams.has("sort")).toBe(false);
    expect(recent.nextOffset).toBeUndefined();
  });

  it("searches artists", async () => {
    const { source, calledUrl } = sourceWith(() => json({ data: [rawUser] }));
    const page = await source.searchArtists("linh", { limit: 5 });
    expect(calledUrl().pathname).toBe("/v1/users/search");
    expect(calledUrl().searchParams.get("query")).toBe("linh");
    expect(page.items[0]?.handle).toBe("linhha");
  });

  it("builds a stream URL on the resolved host", async () => {
    const { source } = sourceWith(() => json({}));
    expect(await source.streamUrl("a b")).toBe(
      "https://host.test/v1/tracks/a%20b/stream?app_name=song-test",
    );
  });
});
