# Progress

> Last updated: 2026-11-13
>
> Legend: ✅ done · 🔄 in progress · ⬜ not started

Sóng is an independent-music player on the Audius and Deezer APIs. This repo was created from [`ductran-starter`](https://github.com/ductmOfficial/ductran-starter). This log records each step, the decisions behind it and the issues met along the way.

## Phases

| Phase | Scope                                                                                   | Status |
| ----- | --------------------------------------------------------------------------------------- | ------ |
| 0     | Foundation: monorepo, CI, tokens, themes, i18n, Audius adapter, player machine          | ✅     |
| 1     | Persistent player UI, queue, keyboard shortcuts, search, track and artist pages         | ✅     |
| 1.5   | Trending time window, all-time hero, Deezer chart previews                              | ✅     |
| 2     | PWA, local history, E2E and accessibility ✅; Audius sign-in, likes, playlists, sync ⬜ | 🔄     |
| 3     | Listening rooms, waveform, crossfade                                                    | ⬜     |
| 4     | Stats dashboard, Web Vitals dashboard                                                   | ⬜     |

## Steps

| #   | Step                                                                      | Branch               | Status |
| --- | ------------------------------------------------------------------------- | -------------------- | ------ |
| 1   | Repository from the `ductran-starter` template                            | `main`               | ✅     |
| 2   | Rename to `song-player`, drop the sample package and the database         | `chore/setup`        | ✅     |
| 3   | `@song/ui`: tokens, themes, motion tokens, `Button`                       | `feat/ui`            | ✅     |
| 4   | `@song/music-sources`: Audius and Deezer adapters with Zod                | `feat/music-sources` | ✅     |
| 5   | `@song/player-core`: playback machine, queue, media store, `createPlayer` | `feat/player-core`   | ✅     |
| 6   | App shell: locale routing, themes, fonts, header                          | `feat/web`           | ✅     |
| 7   | Player bar, Now playing, queue, shortcuts, accent; track and artist pages | `feat/player`        | ✅     |
| 8   | Discover hero and filters, Deezer chart, search                           | `feat/discover`      | ✅     |
| 9   | History page, "Listen again" and PWA                                      | `feat/pwa-history`   | ✅     |
| 10  | MSW fixtures, Playwright and axe, `Browser` job in CI                     | `test/e2e`           | ✅     |
| 11  | README, architecture decision records and this progress log               | `docs/readme`        | ✅     |
| 12  | Localized 404 for paths that match no page                                | `fix/not-found`      | ✅     |
| 13  | Deployment on Vercel, Node 24 declared in the app package                 | `docs/deploy`        | ✅     |

Step 1 is the template's initial commit; every later step is a pull request with green checks, merged with rebase. From step 10 the ruleset also requires `Browser`.

## Decisions

| Decision                                                                           | Reason                                                                                                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Internal packages built with `tsc` to `dist/`                                      | Same as the template: apps consume plain JavaScript and declarations, and Turbo caches each package                         |
| `@song/ui` keeps its own components                                                | The "Tidal Editorial" look (artwork accent, editorial type) is the point of the app; the tokens are small enough to own     |
| Player created as an external store                                                | The `<audio>` exists only in the browser; `useSyncExternalStore` creates it after hydration and destroys it on unmount      |
| Locale from `next/root-params`                                                     | `[locale]` holds the root layout, so pages no longer pass the locale around; unknown locales are a 404 in `i18n/request.ts` |
| Self-hosted fonts (Fontsource)                                                     | Builds and CI do not depend on Google Fonts; the Vietnamese subsets load by `unicode-range` as before                       |
| `next build --webpack`                                                             | The Serwist plugin runs in webpack; the dev server keeps Turbopack and runs without a service worker                        |
| Images served as they are (`images.unoptimized`)                                   | Artwork comes from many Audius content nodes and Deezer's CDN in fixed sizes; a host allow-list would be a moving target    |
| E2E on port 3400 with `AUDIUS_MOCK=1`                                              | Deterministic data, no network; the port stays clear of other local projects                                                |
| Browser checks with the runner's Chrome                                            | No browser download and no apt packages in CI; Playwright's Chromium stays the fallback                                     |
| Vercel with the root directory `apps/web`, built by Turbo from the repository root | Vercel's Next.js support finds the app; Turbo builds `@song/*` first, the same task graph as CI                             |
| A catch-all route under `[locale]` for unknown paths                               | The 404 stays inside the locale layout: translated, with the header, status 404                                             |
| Duplicate tracks keyed by occurrence, not by index                                 | History can list the same track twice in a day; keys stay stable when the list changes                                      |

## Issues

| Issue                                                                  | Fix                                                                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `typecheck` failed now and then while `build` ran                      | `next build` clears `.next/types`; in `apps/web/turbo.json` `typecheck` waits for `build`           |
| `next/root-params` typed as `any` on a clean checkout                  | Its types come from `next typegen`; `lint` waits for `typecheck`, which generates them              |
| MSW 3 renamed `onUnhandledRequest`                                     | `server.listen({ onUnhandledFrame: "bypass" })`                                                     |
| pnpm refused to run build scripts of `@swc/core` and `@parcel/watcher` | Both come with next-intl's extractor and ship prebuilt binaries; listed as `false` in `allowBuilds` |
| The first Vercel build ran on Node 26 and pnpm stopped on `engines`    | Vercel reads `engines` from the root directory's package only; `apps/web` declares Node 24 too      |
| Unknown paths showed Next.js' default 404, in English and unstyled     | `app/[locale]/[...rest]/page.tsx` calls `notFound()`, so the localized page renders                 |
