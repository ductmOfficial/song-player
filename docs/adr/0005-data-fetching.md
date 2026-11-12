# ADR 0005: Data fetching and pages

Status: accepted

## Context

Track and artist pages should be shareable with real metadata; search should feel instant; Audius is a third-party API that can be slow, change shape, or return gated tracks.

## Decision

- **Server components fetch from Audius** through `shared/audius.ts`: Next's fetch cache (5 min) plus React `cache()` so `generateMetadata` and the page share one lookup per request. Optional sections use `orEmpty()` and degrade instead of failing the page; a failure of the main resource hits the localized `error.tsx`, a missing one `notFound()`.
- **Search** renders server-side for `?q=` (shareable, crawlable first result), then a client view takes over: input debounced 250 ms, `GET /api/search`, TanStack Query for caching, cancellation (`AbortSignal`) and keeping previous results visible while typing. The URL is updated with `history.replaceState`, which Next keeps in sync without a server round-trip.
- **Moods map to Audius genres** (`features/discover/moods.ts`). Audius filters trending by genre, not mood; the mapping is editorial and lives in one file. The URL (`?mood=`) is the source of truth; the pill moves optimistically (`useOptimistic`) while the grid dims until the server responds.
- **Adapter hardening:** list responses are validated item by item, so one malformed track is dropped rather than emptying the list. `400` and `404` both mean "not found". Gated tracks (`access.stream = false`) are shown with a lock and never enter the queue.
- **Accent color** comes from the playing track, else the page's hero art (`PageAccent`). It is adjusted until it reaches 4.5:1 against the theme background, which also guarantees contrast for on-accent text on buttons.

## Consequences

- With `loading.tsx` streaming, an unknown track renders the not-found UI with status 200 (Next sets `noindex`). Acceptable for this app; dropping the skeleton would restore a 404 status.
- `next/image` is not used for artwork: Audius serves from many content nodes, so a remote allow-list would keep breaking. Images are sized via `srcset`-free fixed variants (150/480/1000) chosen per slot.
