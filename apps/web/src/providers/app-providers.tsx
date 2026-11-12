"use client";

import { AccentController } from "@/features/accent/accent";
import { PlayerBar } from "@/features/player/player-bar";
import { PlayerProvider } from "@/features/player/player-provider";
import { themeIds } from "@song/ui";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function AppProviders({
  children,
  audiusAppName,
}: {
  children: ReactNode;
  audiusAppName: string;
}) {
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
      <MotionConfig reducedMotion="user">
        <PlayerProvider appName={audiusAppName}>
          <AccentController />
          {children}
          <PlayerBar />
        </PlayerProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
