"use client";

import { type ThemeId, spring, themes } from "@song/ui";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { type ReactNode, useId, useRef, useSyncExternalStore } from "react";
import { switchTheme } from "./switch-theme";

const subscribeNothing = () => () => undefined;

interface Option {
  id: "system" | ThemeId;
  labelKey: "system" | (typeof themes)[number]["labelKey"];
  icon: ReactNode;
}

const icons: Record<string, ReactNode> = {
  system: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  ),
  dark: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  ),
  light: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
};

/** Fallback icon for themes added later without a dedicated icon. */
const swatch = (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" />
  </svg>
);

export function ThemeSwitcher() {
  const t = useTranslations("theme");
  const { theme, setTheme, resolvedTheme } = useTheme();
  // False during SSR and hydration, true afterwards: the stored theme is only known on the client.
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const groupId = useId();
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  const options: Option[] = [
    { id: "system", labelKey: "system", icon: icons.system },
    ...themes.map((th) => ({ id: th.id, labelKey: th.labelKey, icon: icons[th.id] ?? swatch })),
  ];
  // Before mount the stored theme is unknown; render nothing as selected to avoid a mismatch.
  const current = mounted ? (theme ?? "system") : undefined;

  function choose(id: Option["id"], input: HTMLInputElement) {
    const resolved =
      id === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : id;
    const apply = () => {
      setTheme(id);
    };
    if (resolved === resolvedTheme) {
      apply();
      return;
    }

    // Reveal from the pointer, or from the control itself when using the keyboard.
    const rect = input.parentElement?.getBoundingClientRect();
    const origin =
      pointerRef.current ??
      (rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined);
    pointerRef.current = null;
    switchTheme(apply, resolved, origin);
  }

  return (
    <fieldset className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-1">
      <legend className="sr-only">{t("label")}</legend>
      {options.map((o) => {
        const checked = current === o.id;
        const label = t(o.labelKey);
        return (
          <label
            key={o.id}
            title={label}
            onPointerDown={(e) => {
              pointerRef.current = { x: e.clientX, y: e.clientY };
            }}
            className={`relative grid size-10 cursor-pointer place-items-center rounded-full transition-colors duration-(--duration-fast) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-text ${
              checked ? "text-on-accent" : "text-text-muted hover:text-text"
            }`}
          >
            <input
              type="radio"
              name={groupId}
              value={o.id}
              checked={checked}
              onChange={(e) => {
                choose(o.id, e.currentTarget);
              }}
              className="sr-only"
            />
            {checked && (
              <motion.span
                layoutId={`${groupId}-thumb`}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-accent"
                transition={spring.snappy}
              />
            )}
            <span className="relative">{o.icon}</span>
            <span className="sr-only">{label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
