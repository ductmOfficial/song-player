"use client";

import { fitAccent, sampleImageColor } from "@/shared/color";
import { useTheme } from "next-themes";
import { useEffect, useSyncExternalStore } from "react";
import { selectCurrent, usePlayerState } from "../player/player-context";

/**
 * Which artwork tints the UI: the playing track wins; otherwise the page's
 * own hero art. Pages declare theirs with <PageAccent src>.
 */
let pageSrc: string | undefined;
const listeners = new Set<() => void>();
const pageStore = {
  get: () => pageSrc,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  set: (src: string | undefined) => {
    pageSrc = src;
    for (const l of listeners) l();
  },
};

export function PageAccent({ src }: { src?: string }) {
  useEffect(() => {
    pageStore.set(src);
    return () => {
      pageStore.set(undefined);
    };
  }, [src]);
  return null;
}

const colorCache = new Map<string, { r: number; g: number; b: number } | null>();

function loadColor(src: string): Promise<{ r: number; g: number; b: number } | null> {
  const cached = colorCache.get(src);
  if (cached !== undefined) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      const rgb = sampleImageColor(img);
      colorCache.set(src, rgb);
      resolve(rgb);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Tints the whole UI with the artwork's color. The CSS variables are registered
 * with @property, so the change animates instead of snapping.
 */
export function AccentController() {
  const { resolvedTheme } = useTheme();
  const track = usePlayerState(selectCurrent);
  const page = useSyncExternalStore(pageStore.subscribe, pageStore.get, () => undefined);
  // Small art is plenty for a 24×24 color sample.
  const src = track ? (track.artwork.small ?? track.artwork.medium) : page;

  useEffect(() => {
    const root = document.documentElement;
    if (!src || !resolvedTheme) {
      root.style.setProperty("--accent-mix", "0%");
      return;
    }
    // Read the theme's background after next-themes applied it, so new themes need no code here.
    let cancelled = false;
    void loadColor(src).then((rgb) => {
      if (cancelled) return;
      if (!rgb) {
        root.style.setProperty("--accent-mix", "0%");
        return;
      }
      const bg = getComputedStyle(root).getPropertyValue("--s-bg");
      root.style.setProperty("--accent-dynamic", fitAccent(rgb, bg));
      root.style.setProperty("--accent-mix", "100%");
    });
    return () => {
      cancelled = true;
    };
  }, [src, resolvedTheme]);

  return null;
}
