import { describe, expect, it, vi } from "vitest";
import { SourceError } from "../types.js";
import { createDeezerSource, fromDeezerId, toDeezerId } from "./client.js";

/** The URL a fetch mock was called with. */
const urlOf = (input: URL | RequestInfo | undefined): string =>
  input instanceof URL ? input.href : typeof input === "string" ? input : (input?.url ?? "");

const raw = {
  id: 3818963601,
  title: "Dracula",
  duration: 209,
  link: "https://www.deezer.com/track/3818963601",
  preview: "https://cdnt-preview.dzcdn.net/a.mp3?hdnea=exp=1",
  rank: 982905,
  artist: {
    id: 134790,
    name: "Tame Impala",
    link: "https://www.deezer.com/artist/134790",
    picture_small: "https://cdn.test/a56.jpg",
  },
  album: {
    title: "Dracula",
    cover_small: "https://cdn.test/56.jpg",
    cover_medium: "https://cdn.test/250.jpg",
    cover_xl: "https://cdn.test/1000.jpg",
  },
  type: "track",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const source = (handler: (url: URL) => Response) => {
  const f = vi.fn((u: URL | RequestInfo) => Promise.resolve(handler(new URL(urlOf(u)))));
  return {
    deezer: createDeezerSource({ fetch: f as unknown as typeof fetch, host: "https://dz.test" }),
    f,
  };
};

describe("createDeezerSource", () => {
  it("maps the chart to preview-only tracks with namespaced ids", async () => {
    const { deezer, f } = source(() => json({ data: [raw, { id: "broken" }], total: 2 }));
    const tracks = await deezer.chart({ limit: 2 });
    expect(new URL(urlOf(f.mock.calls[0]?.[0])).pathname).toBe("/chart/0/tracks");
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      id: "dz-3818963601",
      source: "deezer",
      durationSec: 209,
      previewSec: 30,
      streamable: true,
      permalink: "https://www.deezer.com/track/3818963601",
      artist: { name: "Tame Impala" },
      artwork: { small: "https://cdn.test/56.jpg", large: "https://cdn.test/1000.jpg" },
    });
  });

  it("marks tracks without a preview as not playable", async () => {
    const { deezer } = source(() => json({ data: [{ ...raw, preview: "" }] }));
    expect((await deezer.chart())[0]?.streamable).toBe(false);
  });

  it("fetches a fresh preview URL, null for unknown ids", async () => {
    const { deezer } = source((u) =>
      u.pathname === "/track/1"
        ? json(raw)
        : json({ error: { type: "DataException", message: "no data", code: 800 } }),
    );
    expect(await deezer.previewUrl("dz-1")).toBe(raw.preview);
    expect(await deezer.previewUrl("dz-2")).toBeNull();
    expect(await deezer.previewUrl("not-deezer")).toBeNull();
  });

  it("treats Deezer’s 200-with-error responses as failures", async () => {
    const { deezer } = source(() =>
      json({ error: { type: "Exception", message: "Quota limit exceeded", code: 4 } }),
    );
    await expect(deezer.chart()).rejects.toBeInstanceOf(SourceError);
  });

  it("round-trips ids", () => {
    expect(fromDeezerId(toDeezerId(42))).toBe("42");
  });
});
