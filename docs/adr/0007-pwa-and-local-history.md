# ADR 0007: PWA and local-first listening history

Status: accepted

## PWA

Serwist (`@serwist/next`) generates the service worker from `src/app/sw.ts`:

- Precaches the app shell and a localized offline page (`/~offline`), served when a page isn't cached and the network is gone.
- Runtime caching uses Serwist's defaults (static assets, images, API responses), **except audio**: anything with `destination: audio` or a `/stream` URL is `NetworkOnly`. Audius' terms don't allow long-term caching of music files, and range requests don't mix well with caches.
- A web manifest with maskable icons makes the app installable. The Serwist plugin runs in webpack, so production builds use `next build --webpack`; the dev server (Turbopack) runs without the worker. Test it with `pnpm build && pnpm --filter web start`.

## Listening history

A listen is recorded after 30 s of actual playback (or half of a shorter track); seeks don't count, and a replay within 10 minutes counts once. History is stored behind a `HistoryRepository` interface. Today the implementation is `localStorage` (synced across tabs via the `storage` event); phase 2's Supabase implementation will sync it to the signed-in account without UI changes.

## Consequences

Users get history, "Listen again" and an offline fallback before accounts exist, and the account work becomes a storage swap rather than a feature build.
