# ADR 0008: A second source for familiar music (Deezer previews)

Status: accepted

## Context

Audius has no major-label catalogue, so Sóng looked "niche" to first-time visitors. No source is at once free, full-length and licensed for a public app: Spotify and Apple Music require the listener's paid subscription and SDK sign-in; YouTube's terms forbid audio-only playback. Deezer's public API offers charts with 30-second previews, no key required.

## Decision

- **Audius stays the primary source** (full tracks). Discover leads with Audius' _all-time_ trending (Skrillex, Zedd, Steve Aoki…), and trending gets a time window filter (`week | month | allTime`, the only values Audius accepts; `year` returns 400).
- **Deezer is a chart-only source.** It implements a narrower `ChartSource` interface instead of stubbing `MusicSource` (search, artist pages) it can't support. Tracks map onto the same `Track` model with:
  - `source: 'deezer'` and ids namespaced as `dz-<id>`, so they never collide with Audius ids;
  - `previewSec: 30` (while `durationSec` keeps the real length). The player uses it for the initial duration, the UI shows a "30s preview" badge, and previews don't count as listens in history;
  - title links that go to Deezer, since we have no track page for them.
- **Preview URLs are never stored.** Deezer signs them with a short expiry, and the queue is persisted. The player resolves a fresh URL at play time via `GET /api/preview/deezer/:id` (JSON, `no-store`); `<audio>` then loads the CDN URL directly. A redirect was tried first but behaves inconsistently for media requests.
- Deezer's errors arrive as HTTP 200 with an `error` object; the adapter turns them into `SourceError`s (code 800 → not found).

## Consequences

- The same queue can hold full Audius tracks and Deezer previews; nothing in `player-core` knows the difference.
- Adding Jamendo or another catalogue follows the same path: an adapter, an id namespace, and (if needed) a stream resolver branch.
- Deezer's chart is the global one. Country charts would need Deezer's editorial playlists, which are not a stable API.
