# ADR 0002: Theming, dynamic accent and adding themes

Status: accepted

## Decision

- Components use only semantic tokens (`--s-bg`, `--s-text`, `--s-accent`…), exposed to Tailwind via `@theme inline` (`bg-surface`, `text-text-muted`…). No raw hex in components.
- A theme is a `[data-theme="<id>"]` block in `packages/ui/src/styles/tokens.css` plus an entry in `themes.ts`. `next-themes` stores the choice and applies it before hydration (no flash). "System" resolves to `dark` or `light`.
- The accent follows the playing track's artwork. `--accent-dynamic` and `--accent-mix` are registered with `@property`, so the whole UI re-tints with a CSS transition. `fitAccent` clamps lightness per color scheme to keep contrast on both dark and light themes.
- Theme switching uses the View Transitions API (circular reveal from the control), skipped under `prefers-reduced-motion` or when unsupported.

## Adding a theme (checklist)

1. Add the CSS block defining every variable in `semanticColorTokens`.
2. Add `{ id, labelKey, colorScheme }` to `themes`.
3. Add `theme.<labelKey>` to every file in `apps/web/messages/`.
4. Optional: an icon in `ThemeSwitcher` (a generic swatch is used otherwise).
