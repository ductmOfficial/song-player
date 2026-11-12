# ADR 0001: Monorepo and core stack

Status: accepted

## Context

Sóng is a portfolio-grade music app. The playback engine and the data adapters should be testable and reusable without the UI framework.

## Decision

- pnpm workspaces + Turborepo, from the `ductran-starter` template: strict TypeScript, shared ESLint and Prettier configs (`@repo/*`), Conventional Commits, CI on every pull request.
- `apps/web`: Next.js App Router. Server components fetch from Audius, so API identity and caching stay on the server and track pages can be shared with proper metadata.
- `packages/player-core`: playback as an XState machine with side effects injected (`createPlayer`). The machine is unit-tested with no DOM.
- `packages/music-sources`: one domain model (`Track`, `Artist`) and an adapter per provider. Every response is validated with Zod, so a provider changing its API fails loudly at the boundary rather than deep in the UI.
- `packages/ui`: design tokens, themes, motion tokens, primitives.

## Consequences

Adding Jamendo is a new adapter implementing `MusicSource`; the UI does not change. Packages are built with `tsc` to `dist/` before the app; the cost is a build step per package and a Tailwind `@source` pointing at `packages/ui/src`.
