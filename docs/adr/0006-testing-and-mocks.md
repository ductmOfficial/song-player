# ADR 0006: Testing strategy and API mocks

Status: accepted

## Decision

- **Unit (Vitest):** pure logic where bugs hide: the player machine and queue operations, `createPlayer` against a fake `<audio>`, the Audius adapter against canned responses, shortcut matching, accent contrast, history and search helpers.
- **E2E (Playwright)** against a production build with **`AUDIUS_MOCK=1`**: `instrumentation.ts` starts an MSW server with fixtures (`src/mocks`), so server components get deterministic data with no network. Streams are requested by the browser directly from Audius; the test fixture answers them with a generated WAV via `page.route`.
- **Accessibility:** every main page runs axe (WCAG 2.2 A/AA tags) in E2E and fails on serious or critical issues, in both themes. The audit already caught real problems: low-contrast artwork accents in light mode and locale buttons whose accessible name didn't contain their visible label.
- Service workers are blocked in E2E except in the PWA spec, because a worker would fetch streams itself and bypass the route mocks.

## Consequences

- The same fixtures power offline development: `AUDIUS_MOCK=1 pnpm build && pnpm start`. (Turbopack dev doesn't load MSW's Node interceptors reliably, so mocks target production mode.)
- Real Audius is exercised manually and by the type-safe adapter; contract drift shows up as dropped items or `SourceError`s in server logs.
