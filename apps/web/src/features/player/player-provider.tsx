"use client";

import { AUDIUS_API_URL, type Track, createAudiusSource } from "@song/music-sources";
import { type Player, createPlayer } from "@song/player-core";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createLocalHistory } from "../history/history-store";
import { loadSession, saveSession } from "./persistence";
import { type PlayerApi, PlayerContext, type PlayerPanel } from "./player-context";

/** A play counts toward history after this much listening (or half of a short track). */
const LISTEN_THRESHOLD_SEC = 30;

interface Props {
  appName: string;
  children: ReactNode;
}

function createAppPlayer(appName: string): Player {
  // The browser talks to the API host directly; no discovery round-trip needed for streams.
  const source = createAudiusSource({ appName, host: AUDIUS_API_URL });
  const session = loadSession();
  const p = createPlayer({
    resolveStreamUrl: async (track) => {
      if (track.source === "audius") return source.streamUrl(track.id);
      // Previews are signed with a short expiry: ask our route for a fresh one.
      const res = await fetch(`/api/preview/${track.source}/${encodeURIComponent(track.id)}`);
      if (!res.ok) throw new Error(`Preview unavailable (${String(res.status)})`);
      const { url } = (await res.json()) as { url: string };
      return url;
    },
    initialMedia: session ? { volume: session.volume, muted: session.muted } : {},
  });
  if (session && session.queue.length > 0) p.actor.send({ type: "RESTORE", state: session });
  return p;
}

/**
 * The player as an external store: created when the provider subscribes (client only, after
 * hydration) and destroyed when it unsubscribes. Null during SSR and hydration.
 */
function createPlayerStore(appName: string) {
  let player: Player | null = null;
  return {
    subscribe: (onChange: () => void) => {
      player = createAppPlayer(appName);
      onChange();
      return () => {
        player?.destroy();
        player = null;
      };
    },
    get: () => player,
  };
}

const noPlayer = () => null;

function usePlayerInstance(appName: string): Player | null {
  const store = useMemo(() => createPlayerStore(appName), [appName]);
  return useSyncExternalStore(store.subscribe, store.get, noPlayer);
}

/**
 * Owns the single <audio> element for the whole app. It sits in the locale
 * layout, which persists across client navigations, so playback never stops
 * when the page changes.
 */
export function PlayerProvider({ appName, children }: Props) {
  const t = useTranslations("player");
  const player = usePlayerInstance(appName);
  const [panel, setPanel] = useState<PlayerPanel>(null);
  const [announcement, setAnnouncement] = useState("");
  const [notice, setNotice] = useState<PlayerApi["notice"]>(null);
  const history = useMemo(() => createLocalHistory(), []);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!player) return;
    const p = player;

    // Persist the queue and volume, debounced.
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const { queue, index, repeat, shuffle, original } = p.actor.getSnapshot().context;
        const { volume, muted } = p.media.get();
        saveSession({ queue, index, repeat, shuffle, original, volume, muted });
      }, 400);
    };
    const actorSub = p.actor.subscribe(save);

    // Track listening time per track, for history and announcements.
    let currentId: string | undefined;
    let listened = 0;
    let lastTime = 0;
    let recorded = false;
    let lastVolume = `${String(p.media.get().volume)}:${String(p.media.get().muted)}`;
    const trackSub = p.actor.subscribe((snap) => {
      const track = snap.context.queue[snap.context.index];
      if (track?.id === currentId) return;
      currentId = track?.id;
      listened = 0;
      lastTime = 0;
      recorded = false;
      if (track && !snap.matches("idle")) {
        setAnnouncement(
          tRef.current("nowPlaying", { title: track.title, artist: track.artist.name }),
        );
      }
    });
    const mediaSub = p.media.subscribe(() => {
      const m = p.media.get();
      const vol = `${String(m.volume)}:${String(m.muted)}`;
      if (vol !== lastVolume) {
        lastVolume = vol;
        save();
      }
      const delta = m.currentTime - lastTime;
      lastTime = m.currentTime;
      const snap = p.actor.getSnapshot();
      if (!snap.matches("playing") || delta <= 0 || delta > 2) return; // seeks don't count
      listened += delta;
      const track = snap.context.queue[snap.context.index];
      const needed = Math.min(LISTEN_THRESHOLD_SEC, (m.duration || LISTEN_THRESHOLD_SEC * 2) / 2);
      // History is for real listens; 30 s previews don't count.
      if (track && !track.previewSec && !recorded && listened >= needed) {
        recorded = true;
        history.add(track);
      }
    });

    return () => {
      clearTimeout(saveTimer);
      actorSub.unsubscribe();
      trackSub.unsubscribe();
      mediaSub();
    };
  }, [player, history]);

  // Visible toast; screen readers get it from the toast's own role="status".
  const notify = useCallback((message: string) => {
    setNotice({ id: Date.now(), message });
  }, []);
  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const api = useMemo<PlayerApi>(() => {
    // Fresh object identities: the queue UI keys and reorders by reference.
    const playable = (tracks: Track[]) => tracks.filter((x) => x.streamable).map((x) => ({ ...x }));
    return {
      player,
      history,
      panel,
      openPanel: setPanel,
      notice,
      dismissNotice,
      playTracks(tracks, startIndex = 0) {
        const start = tracks[startIndex];
        if (!player || !start?.streamable) return;
        const queue = playable(tracks);
        const at = queue.findIndex((x) => x.id === start.id);
        player.actor.send({ type: "LOAD_QUEUE", tracks: queue, startIndex: Math.max(at, 0) });
      },
      enqueue(tracks) {
        const queue = playable(tracks);
        if (!player || queue.length === 0) return;
        player.actor.send({ type: "ENQUEUE", tracks: queue });
        notify(t("addedToQueue", { count: queue.length }));
      },
      playNext(tracks) {
        const queue = playable(tracks);
        if (!player || queue.length === 0) return;
        player.actor.send({ type: "PLAY_NEXT", tracks: queue });
        notify(t("playingNext", { count: queue.length }));
      },
    };
  }, [player, history, panel, notice, dismissNotice, notify, t]);

  return (
    <PlayerContext value={api}>
      {children}
      <output aria-live="polite" className="sr-only">
        {announcement}
      </output>
    </PlayerContext>
  );
}
