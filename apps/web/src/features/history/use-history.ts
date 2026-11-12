"use client";

import { useSyncExternalStore } from "react";
import { usePlayer } from "../player/player-context";
import type { Listen } from "./history-store";

const empty: Listen[] = [];

/** Listening history for this browser. Empty during SSR, filled after hydration. */
export function useHistory(): Listen[] {
  const { history } = usePlayer();
  return useSyncExternalStore(history.subscribe, history.list, () => empty);
}
