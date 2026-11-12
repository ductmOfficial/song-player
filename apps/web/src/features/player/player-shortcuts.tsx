"use client";

import { useRouter } from "@/i18n/navigation";
import { Dialog } from "@/shared/ui/dialog";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon } from "@/shared/ui/icons";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { usePlayer } from "./player-context";
import { type ShortcutAction, isTypingTarget, matchShortcut, shortcuts } from "./shortcuts";

const SEEK_STEP_SEC = 5;
const VOLUME_STEP = 0.1;

/** Global keyboard shortcuts. Renders nothing. */
export function PlayerShortcuts() {
  const api = usePlayer();
  const router = useRouter();
  // Read the latest API inside a listener that's attached once.
  const ref = useRef(api);
  ref.current = api;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isTypingTarget(document.activeElement)) return;
      const shortcut = matchShortcut(e);
      if (!shortcut) return;
      const { player, panel, openPanel } = ref.current;
      // While the help is open, only "?" (to close it) applies; Escape is handled by <dialog>.
      if (panel === "shortcuts" && shortcut.action !== "help") return;
      if (panel && shortcut.action === "search") return;
      // Space and Enter on a focused button/link should keep their native meaning.
      const focusIsControl = document.activeElement?.closest(
        'button, a, [role="button"], input[type="range"]',
      );
      if (shortcut.action === "toggle" && e.key === " " && focusIsControl) return;
      if (
        (shortcut.action === "seekBack" || shortcut.action === "seekForward") &&
        document.activeElement?.matches('input[type="range"]')
      )
        return;
      if (!player) return;
      const snap = player.actor.getSnapshot();
      if (shortcut.needsQueue && snap.context.queue.length === 0) return;

      e.preventDefault();
      const c = player.controls;
      const run: Record<ShortcutAction, () => void> = {
        toggle: c.toggle,
        seekBack: () => {
          c.seekBy(-SEEK_STEP_SEC);
        },
        seekForward: () => {
          c.seekBy(SEEK_STEP_SEC);
        },
        prev: c.prev,
        next: c.next,
        volumeUp: () => {
          c.setVolume(player.media.get().volume + VOLUME_STEP);
        },
        volumeDown: () => {
          c.setVolume(player.media.get().volume - VOLUME_STEP);
        },
        mute: c.toggleMute,
        shuffle: () => {
          player.actor.send({ type: "TOGGLE_SHUFFLE" });
        },
        repeat: () => {
          player.actor.send({ type: "CYCLE_REPEAT" });
        },
        queue: () => {
          openPanel(panel === "queue" ? null : "queue");
        },
        nowPlaying: () => {
          openPanel(panel === "nowPlaying" ? null : "nowPlaying");
        },
        search: () => {
          router.push("/search");
        },
        help: () => {
          openPanel(panel === "shortcuts" ? null : "shortcuts");
        },
      };
      run[shortcut.action]();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  return null;
}

export function ShortcutsDialog() {
  const t = useTranslations("shortcuts");
  const { panel, openPanel } = usePlayer();
  return (
    <Dialog
      open={panel === "shortcuts"}
      onClose={() => {
        openPanel(null);
      }}
      labelledBy="shortcuts-title"
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="shortcuts-title" className="font-display text-2xl">
            {t("title")}
          </h2>
          <IconButton
            label={t("close")}
            onClick={() => {
              openPanel(null);
            }}
          >
            <CloseIcon />
          </IconButton>
        </header>
        <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 overflow-y-auto px-6 py-5">
          {shortcuts.map((s) => (
            <div key={s.action} className="contents">
              <dt className="text-text-muted">{t(s.action)}</dt>
              <dd className="flex items-center justify-end gap-1">
                {s.display.map((k) => (
                  <kbd
                    key={k}
                    className="min-w-8 rounded-md border border-border bg-surface-raised px-2 py-0.5 text-center font-sans text-sm font-semibold"
                  >
                    {k === "Space" ? t("space") : k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Dialog>
  );
}
