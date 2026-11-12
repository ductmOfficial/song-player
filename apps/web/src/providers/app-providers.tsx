"use client";

import { themeIds } from "@song/ui";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      // Namespaced key: localhost ports are shared across projects, and a foreign
      // "theme" entry (e.g. '"light"' JSON-encoded) would match no theme block.
      storageKey="song-theme"
      themes={themeIds}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* Respect the OS "reduce motion" setting for every Motion animation. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
