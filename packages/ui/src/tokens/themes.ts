/**
 * Theme registry.
 *
 * To add a theme:
 *   1. Add a `[data-theme="<id>"]` block in `styles/tokens.css` defining every semantic variable.
 *   2. Register it below with its id, label key and color scheme.
 *   3. Add its label under `theme.<labelKey>` in each messages file.
 * Components only use semantic tokens, so nothing else needs to change.
 */
export interface ThemeDefinition {
  id: string;
  /** Key under `theme.*` in the i18n messages */
  labelKey: string;
  colorScheme: "dark" | "light";
}

export const themes = [
  { id: "dark", labelKey: "dark", colorScheme: "dark" },
  { id: "light", labelKey: "light", colorScheme: "light" },
] as const satisfies readonly ThemeDefinition[];

export type ThemeId = (typeof themes)[number]["id"];
export const themeIds: ThemeId[] = themes.map((t) => t.id);
export const defaultTheme: ThemeId = "dark";

/** CSS custom properties every theme block must define. Kept in sync with tokens.css. */
export const semanticColorTokens = [
  "--s-bg",
  "--s-surface",
  "--s-surface-raised",
  "--s-border",
  "--s-text",
  "--s-text-muted",
  "--s-accent-base",
  "--s-on-accent",
] as const;
