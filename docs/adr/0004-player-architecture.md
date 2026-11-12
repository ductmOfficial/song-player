# ADR 0004: Player architecture

Status: accepted

## Context

Playback must survive client-side navigation, stay responsive while time updates fire several times a second, and be testable without a browser. The queue is edited from many places (track rows, the queue panel, keyboard shortcuts, the lock screen).

## Decision

- **One `<audio>`, owned by `PlayerProvider` in the locale layout.** The layout persists across App Router navigations, so the element (and playback) is never unmounted. The persistent `PlayerBar` lives next to it.
- **Two kinds of state, two stores.**
  - _Discrete_ state (transport + queue) is the XState machine in `player-core`. States describe the transport (`idle → loading → playing ⇄ paused`, `error`); the queue lives in context and can be edited in any state.
  - _Continuous_ state (current time, buffered, volume, waiting) is a small external store (`createMediaStore`) read with `useSyncExternalStore`. Only the components that show time re-render on `timeupdate`; the machine never sees it.
- **Queue operations are pure functions** (`queue.ts`: enqueue, play next, remove, move, clear upcoming, shuffle/unshuffle). The machine applies them in `assign`; tests call them directly.
- **Shuffle reorders the upcoming tracks** instead of picking randomly at each step. The queue panel therefore shows the real order, "previous" is predictable, and turning shuffle off restores the original order (tracks added meanwhile are kept).
- **Side effects are injected.** The machine names actions (`loadTrack`, `playAudio`…) with no-op defaults; `createPlayer` binds them to `<audio>` and the Media Session API. Stale async work is dropped with a load token, so a `play()` rejected because the user skipped doesn't pause the next track.
- **"Previous" restarts the track after 3 s**, like most players; Media Session gets seek handlers and position state.
- **Persistence:** queue, position in it, repeat/shuffle and volume are saved (debounced) to `localStorage` and restored _paused_ (browsers block autoplay anyway). Entries are validated on read.

## Consequences

- The engine has 24 unit tests (machine, queue, `createPlayer` against a fake `<audio>`), and the E2E suite covers navigation without interruption.
- Queue entries are cloned on insert so each has a unique identity; the queue panel keys and reorders by identity, which is what Motion's `Reorder` needs.
- Crossfade (phase 3) will need a second element or Web Audio; the injected-actions design leaves room for that without touching the machine's states.
