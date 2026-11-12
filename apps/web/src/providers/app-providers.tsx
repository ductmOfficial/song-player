"use client";

import { AccentController } from "@/features/accent/accent";
import { PlayerBar } from "@/features/player/player-bar";
import { PlayerProvider } from "@/features/player/player-provider";
import { themeIds } from "@song/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useState } from "react";

export function AppProviders({
  children,
  audiusAppName,
}: {
  children: ReactNode;
  audiusAppName: string;
}) {
  // One client per browser session (not per render, not shared between requests).
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

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
      <QueryClientProvider client={queryClient}>
        {/* Respect the OS "reduce motion" setting for every Motion animation. */}
        <MotionConfig reducedMotion="user">
          <PlayerProvider appName={audiusAppName}>
            <AccentController />
            {children}
            <PlayerBar />
          </PlayerProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
