# Sóng

[![CI](https://github.com/ductmOfficial/song-player/actions/workflows/ci.yml/badge.svg)](https://github.com/ductmOfficial/song-player/actions/workflows/ci.yml)

_Ride the same wave._ An independent-music player built on the Audius API (full tracks) with the Deezer chart (30-second previews), and an artwork-driven "Tidal Editorial" interface in Vietnamese and English.

## What's inside

| Area        | Tools                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| App         | Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion                       |
| State       | XState 5 (playback engine), TanStack Query (search as you type)                 |
| Data        | Audius and Deezer adapters, every response validated with Zod                   |
| i18n/themes | next-intl (Vietnamese and English), next-themes (dark, light, system)           |
| PWA         | Serwist service worker, web manifest, offline page                              |
| Testing     | Vitest, Playwright with axe, MSW fixtures                                       |
| Tooling     | pnpm workspaces, Turborepo, TypeScript 6 (strict), ESLint 10, Prettier 3        |
| CI          | GitHub Actions (`Verify` and `Browser`), protected `main` (ruleset), Dependabot |
| Conventions | Conventional Commits (commitlint + husky), PR template, issue forms             |

## Structure

```
apps/web                    Next.js app (feature-based: features/, shared/, i18n/)
packages/ui                 @song/ui: design tokens, themes, motion tokens, primitives
packages/player-core        @song/player-core: playback engine (XState + <audio> + Media Session)
packages/music-sources      @song/music-sources: provider adapters (Audius, Deezer), one domain model
packages/eslint-config      @repo/eslint-config: shared flat configs
packages/prettier-config    @repo/prettier-config
packages/typescript-config  @repo/typescript-config: shared tsconfig presets
docs/adr                    architecture decision records
```

## Requirements

- Node.js 24 (`.nvmrc`; run `nvm use` or `fnm use`)
- pnpm 12 (`npm install -g pnpm`; the exact version is pinned in `packageManager`)

## Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev          # http://localhost:3000 (Vietnamese), /en for English
```

The app uses the public Audius and Deezer APIs; no key is needed. `AUDIUS_APP_NAME` identifies the app to Audius, as their API terms ask.

Offline development with fixtures instead of the real APIs, after a build:

```bash
pnpm build
AUDIUS_MOCK=1 pnpm --filter web start
```

## Scripts

Run from the repository root.

| Script                  | What it does                                                               |
| ----------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`              | Start the app in development mode (no service worker)                      |
| `pnpm build`            | Build the packages and the app (also generates the service worker)         |
| `pnpm lint`             | ESLint in every package; warnings fail the run                             |
| `pnpm typecheck`        | TypeScript across the workspace                                            |
| `pnpm test`             | Vitest: player engine, queue, Audius and Deezer adapters, web helpers      |
| `pnpm test:coverage`    | Tests with coverage                                                        |
| `pnpm format`           | Format the whole repo with Prettier                                        |
| `pnpm format:check`     | Check formatting without writing (used by CI)                              |
| `pnpm --filter web e2e` | Playwright and axe against the build, APIs mocked (run `pnpm build` first) |

The end-to-end tests start the app on port 3400. The first run needs a browser: `pnpm --filter web exec playwright install chromium`, or point `CHROME_PATH` at an installed Chrome.

## Highlights

- **Persistent player**: one `<audio>` owned by the layout, so music never stops on navigation; a queue with drag and keyboard reordering, shuffle that shows the real order, repeat, Media Session (lock screen, media keys) and restore after reload ([ADR 0004](docs/adr/0004-player-architecture.md)).
- **Keyboard first**: global shortcuts (Space/K, ←/→, Shift+←/→, M, S, R, Q, F, /, ?) driven by one table that also renders the help dialog.
- **Search as you type**: server-rendered for shareable `?q=` URLs, then TanStack Query with debouncing and cancellation ([ADR 0005](docs/adr/0005-data-fetching.md)).
- **Two sources, one model**: Audius for full-length independent music (with week, month and all-time trending), Deezer's global chart as 30-second previews, side by side in the same queue ([ADR 0008](docs/adr/0008-multiple-sources-and-previews.md)).
- **Tested where it matters**: 65 unit tests and 19 end-to-end tests with axe accessibility checks in both themes ([ADR 0006](docs/adr/0006-testing-and-mocks.md)).
- **PWA and local-first history**: installable, offline fallback, no audio caching; history behind a repository interface ready for account sync ([ADR 0007](docs/adr/0007-pwa-and-local-history.md)).
- **Themes**: dark and light today; a new theme is one CSS block and one registry entry ([ADR 0002](docs/adr/0002-theming.md)).
- **Artwork accent**: the UI re-tints from the playing track's cover, adjusted to 4.5:1 contrast against the theme, animated with `@property`.
- **i18n**: Vietnamese and English with type-checked message keys ([ADR 0003](docs/adr/0003-i18n-and-motion.md)).
- **Player engine**: a tested state machine with side effects injected, so it runs without a DOM in tests.

## Roadmap

- [x] Phase 0: foundation (monorepo, CI, tokens, themes, i18n, Audius adapter, player machine)
- [x] Phase 1: persistent player UI, queue, keyboard shortcuts, search, track and artist pages
- [x] Phase 1.5: trending time window, all-time hero, Deezer chart previews
- [ ] Phase 2: ~~PWA~~ ✓, ~~local history~~ ✓, ~~E2E and accessibility audit~~ ✓; Audius sign-in, likes and playlists (optimistic UI), library, history sync
- [ ] Phase 3: listening rooms, waveform, crossfade
- [ ] Phase 4: stats dashboard, Web Vitals dashboard

Steps, decisions and issues are logged in [PROGRESS.md](PROGRESS.md).

## Contributing workflow

1. Branch from `main`: `git switch -c feat/short-description`
2. Commit using [Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`. The `commit-msg` hook rejects anything else.
3. Push and open a PR: `gh pr create`
4. Wait for the `Verify` and `Browser` checks: `gh pr checks --watch`
5. Merge: `gh pr merge --rebase --delete-branch`

## Attribution

Music and artwork are provided by [Audius](https://audius.co); chart data and previews by [Deezer](https://www.deezer.com). All rights belong to the artists and labels. Sóng is a non-commercial portfolio project and is not affiliated with Audius or Deezer.

## License

[MIT](LICENSE)
