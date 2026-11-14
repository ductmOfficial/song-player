# Sóng

[![CI](https://github.com/ductmOfficial/song-player/actions/workflows/ci.yml/badge.svg)](https://github.com/ductmOfficial/song-player/actions/workflows/ci.yml)

_Ride the same wave._ An independent-music player built on the Audius API (full tracks) with the Deezer chart (30-second previews), and an artwork-driven "Tidal Editorial" interface in Vietnamese and English. Live at **https://song-tmd.vercel.app**.

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

## Setup

### 1. Prerequisites

| Tool                      | Version                    | Needed for                 | Install                                                                                |
| ------------------------- | -------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| Node.js                   | 24 (`.nvmrc`)              | everything                 | `nvm install && nvm use` (or `fnm use`)                                                |
| pnpm                      | 12.14.0 (`packageManager`) | everything                 | `corepack enable` (or `npm install -g pnpm@12.14.0`)                                   |
| Git                       | any recent                 | everything                 |                                                                                        |
| Chromium or Google Chrome | any recent                 | browser tests (`e2e`) only | `pnpm --filter web exec playwright install chromium`, or point `CHROME_PATH` at Chrome |

`pnpm install` refuses other Node.js majors (`engineStrict`). Corepack ships with Node.js 24: after `corepack enable`, the first `pnpm` command downloads the exact version from `packageManager` (answer `Y` if it asks). No database and no API key are needed: the app uses the public Audius and Deezer APIs.

### 2. Clone and install

```bash
git clone https://github.com/ductmOfficial/song-player.git
cd song-player
nvm use
corepack enable
pnpm install          # also installs the commit-msg hook
```

### 3. Configure

```bash
cp apps/web/.env.example apps/web/.env.local
```

Next.js reads `apps/web/.env.local`; it is ignored by git.

| Variable          | Required | Default               | What it does                                                                                            |
| ----------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| `AUDIUS_APP_NAME` | no       | `song-portfolio`      | Identifies the app to Audius, as their API terms ask, e.g. `my-player`                                  |
| `AUDIUS_MOCK`     | no       | unset                 | `1` answers Audius and Deezer calls from fixtures in `apps/web/src/mocks` (offline runs, browser tests) |
| `CHROME_PATH`     | no       | Playwright's Chromium | A local Chrome for the browser tests, e.g. `/usr/bin/google-chrome`                                     |

## Running

### Development server

```bash
pnpm build        # once after cloning: the app imports the packages from their build output
pnpm dev          # http://localhost:3000 (Vietnamese), /en for English
```

Run `pnpm build` again after changing a package under `packages/`. The development server has no service worker; it is generated by the production build.

### Production build

```bash
pnpm build
pnpm --filter web start                  # http://localhost:3000, real APIs
AUDIUS_MOCK=1 pnpm --filter web start    # the same with the APIs answered from fixtures
```

`AUDIUS_MOCK=1` is the way to work offline: server-side requests to Audius and to the Deezer chart are answered from the fixtures in `apps/web/src/mocks`. Audio streams and artwork still come from the network. Never set it on Vercel.

## Testing

| Command                             | What it runs                                                          |
| ----------------------------------- | --------------------------------------------------------------------- |
| `pnpm test`                         | Vitest: player engine, queue, Audius and Deezer adapters, web helpers |
| `pnpm test:coverage`                | Tests with coverage                                                   |
| `pnpm lint` / `pnpm typecheck`      | ESLint (warnings fail) and TypeScript across the workspace            |
| `pnpm format:check` / `pnpm format` | Prettier check / write                                                |
| `pnpm build`                        | Build the packages and the app (also generates the service worker)    |
| `pnpm --filter web e2e`             | Playwright and axe against the build, APIs mocked, on port 3400       |

The end-to-end tests start the production build themselves with `AUDIUS_MOCK=1` on port 3400, so run `pnpm build` first, and run them before serving that build against the real APIs (see Troubleshooting). The first run needs a browser:

```bash
pnpm --filter web exec playwright install chromium
pnpm build
pnpm --filter web e2e
```

To run what CI runs before opening a pull request (`Verify`, then `Browser`):

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm turbo run lint typecheck test build
pnpm --filter web e2e
```

### All scripts

Run from the repository root.

| Script                    | What it does                                                               |
| ------------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`                | Start the app in development mode (no service worker)                      |
| `pnpm build`              | Build the packages and the app (also generates the service worker)         |
| `pnpm lint`               | ESLint in every package; warnings fail the run                             |
| `pnpm typecheck`          | TypeScript across the workspace                                            |
| `pnpm test`               | Vitest: player engine, queue, Audius and Deezer adapters, web helpers      |
| `pnpm test:coverage`      | Tests with coverage                                                        |
| `pnpm format`             | Format the whole repo with Prettier                                        |
| `pnpm format:check`       | Check formatting without writing (used by CI)                              |
| `pnpm --filter web start` | Serve the last production build                                            |
| `pnpm --filter web e2e`   | Playwright and axe against the build, APIs mocked (run `pnpm build` first) |

## Deployment (Vercel)

Vercel builds the app from `main`. Project settings:

- **Root directory** `apps/web`, framework Next.js, **Node.js 24.x** (`apps/web/package.json` sets `engines`; with a newer Node, `pnpm install` stops with `ERR_PNPM_UNSUPPORTED_ENGINE`).
- **Build command** `cd ../.. && pnpm turbo run build --filter=web`, so the workspace packages are built first.
- **Environment variables**: `AUDIUS_APP_NAME` in Production and Preview. Nothing else: no database, nothing to migrate, and `AUDIUS_MOCK` stays unset.

Pull requests get preview deployments.

## Troubleshooting

| Symptom                                                             | Fix                                                                                                                                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install` fails with `ERR_PNPM_UNSUPPORTED_ENGINE`             | Wrong Node.js major: `nvm use` (Node.js 24), then install again. On Vercel, set Node.js 24.x in the project settings                                                                                       |
| `pnpm: command not found`, or a different pnpm version runs         | `corepack enable`, then open a new terminal; `pnpm -v` should print `12.14.0`                                                                                                                              |
| Port 3000 is taken                                                  | `pnpm --filter web dev --port 3001`                                                                                                                                                                        |
| `e2e` cannot start the server                                       | Port 3400 must be free and `pnpm build` must have run                                                                                                                                                      |
| `pnpm dev` answers 500: "Module not found: Can't resolve '@song/…'" | The packages are not built yet: `pnpm build`, then `pnpm dev` again                                                                                                                                        |
| `e2e` sees real tracks (more cards than the fixtures) and fails     | A `start` against the real APIs left their answers in Next's fetch cache for five minutes, and the mocked test server reuses them: `rm -rf apps/web/.next/cache/fetch-cache`, then `pnpm --filter web e2e` |
| The browser tests cannot find a browser                             | `pnpm --filter web exec playwright install chromium`, or set `CHROME_PATH`                                                                                                                                 |
| Pages show no tracks without a network                              | Use a production build with `AUDIUS_MOCK=1 pnpm --filter web start`; playback and artwork still need the network                                                                                           |
| A machine with little memory kills the run (exit code 137)          | Run fewer tasks at once: `pnpm turbo run lint typecheck test build --concurrency=2`                                                                                                                        |
| A Vercel preview opens a Vercel sign-in page                        | The preview has Deployment Protection: sign in with an account on the team, or check the change locally with `pnpm build && pnpm --filter web start`                                                       |
| The commit is rejected                                              | The hook enforces [Conventional Commits](https://www.conventionalcommits.org): `feat(web): …`, `fix(player-core): …`, `docs: …`                                                                            |

## Highlights

- **Persistent player**: one `<audio>` owned by the layout, so music never stops on navigation; a queue with drag and keyboard reordering, shuffle that shows the real order, repeat, Media Session (lock screen, media keys) and restore after reload ([ADR 0004](docs/adr/0004-player-architecture.md)).
- **Keyboard first**: global shortcuts (Space/K, ←/→, Shift+←/→, M, S, R, Q, F, /, ?) driven by one table that also renders the help dialog.
- **Search as you type**: server-rendered for shareable `?q=` URLs, then TanStack Query with debouncing and cancellation ([ADR 0005](docs/adr/0005-data-fetching.md)).
- **Two sources, one model**: Audius for full-length independent music (with week, month and all-time trending), Deezer's global chart as 30-second previews, side by side in the same queue ([ADR 0008](docs/adr/0008-multiple-sources-and-previews.md)).
- **Tested where it matters**: 65 unit tests and 20 end-to-end tests with axe accessibility checks in both themes ([ADR 0006](docs/adr/0006-testing-and-mocks.md)).
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
