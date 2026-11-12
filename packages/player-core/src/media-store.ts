/**
 * Continuous media state (time, buffering, volume) changes many times per
 * second, so it stays out of the state machine. A tiny external store keeps
 * React re-renders limited to the components that read it
 * (`useSyncExternalStore`).
 */
export interface MediaState {
  currentTime: number;
  duration: number;
  /** Seconds buffered ahead of the start, for the progress bar */
  buffered: number;
  /** Waiting for data while the transport says "playing" */
  waiting: boolean;
  volume: number;
  muted: boolean;
}

export interface MediaStore {
  get: () => MediaState;
  subscribe: (listener: () => void) => () => void;
  set: (patch: Partial<MediaState>) => void;
}

export const initialMediaState: MediaState = {
  currentTime: 0,
  duration: 0,
  buffered: 0,
  waiting: false,
  volume: 1,
  muted: false,
};

export function createMediaStore(initial: Partial<MediaState> = {}): MediaStore {
  let state: MediaState = { ...initialMediaState, ...initial };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(patch) {
      let changed = false;
      for (const key in patch) {
        const k = key as keyof MediaState;
        if (patch[k] !== undefined && patch[k] !== state[k]) changed = true;
      }
      if (!changed) return;
      state = { ...state, ...patch };
      for (const l of listeners) l();
    },
  };
}
