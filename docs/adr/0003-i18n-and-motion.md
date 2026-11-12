# ADR 0003: Internationalisation and motion

Status: accepted

## i18n

`next-intl` with locale routing (`vi` default without prefix, `en` under `/en`). Messages are typed from `messages/vi.json` (`global.d.ts`), so a missing key is a type error. Fonts are self-hosted (Fontsource) with their Vietnamese subsets. The root layout lives under `[locale]`, so `i18n/request.ts` reads the locale from `next/root-params` and answers unknown locales with a 404. Adding a locale: add it to `routing.locales` and add a messages file.

Locale detection stays on (next-intl default): a first visit to `/` from a browser whose preferred language is English redirects to `/en`, then the choice is remembered in a cookie. Many readers of this project are recruiters abroad, so the right language on first paint matters more than `/` always being Vietnamese. Vietnamese remains the default for everyone else and for crawlers (`hreflang` alternates are declared).

## Motion

Durations and easings live in `packages/ui/src/tokens/motion.ts`, mirrored as CSS variables, so CSS transitions and Motion animations share one vocabulary. Principles:

- One orchestrated entrance per screen (the trending grid), not on every section.
- Motion answers actions: shared-layout pills for mood and theme selection, theme reveal, accent re-tint.
- `MotionConfig reducedMotion="user"` plus a CSS reduced-motion guard.
