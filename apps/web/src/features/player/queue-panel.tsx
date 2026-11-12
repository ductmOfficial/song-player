"use client";

import { Artwork } from "@/shared/ui/artwork";
import { Dialog } from "@/shared/ui/dialog";
import { Equalizer } from "@/shared/ui/equalizer";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon, GripIcon } from "@/shared/ui/icons";
import type { Track } from "@song/music-sources";
import { Reorder, useDragControls } from "motion/react";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useId } from "react";
import { selectIsPlaying, usePlayer, usePlayerState } from "./player-context";
import { diffMove } from "./reorder";

// Queue entries are unique objects (see PlayerProvider), so identity is a stable key
// that survives reordering; ids alone repeat when a track is queued twice.
const keys = new WeakMap<Track, number>();
let nextKey = 0;
const keyOf = (t: Track) => {
  let k = keys.get(t);
  if (k === undefined) {
    k = nextKey++;
    keys.set(t, k);
  }
  return k;
};

export function QueuePanel() {
  const t = useTranslations("player");
  const { panel, openPanel, player } = usePlayer();
  const queue = usePlayerState((s) => s.context.queue);
  const index = usePlayerState((s) => s.context.index);
  const playing = usePlayerState(selectIsPlaying);
  const hintId = useId();
  const current = queue[index];
  const upcoming = queue.slice(index + 1);
  const send = player?.actor.send.bind(player.actor);

  const moveBy = (at: number, delta: number) => {
    const to = at + delta;
    if (to <= index || to >= queue.length) return;
    send?.({ type: "MOVE", from: at, to });
  };

  return (
    <Dialog
      open={panel === "queue"}
      onClose={() => {
        openPanel(null);
      }}
      labelledBy="queue-title"
      variant="side"
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
          <h2 id="queue-title" className="font-display text-2xl">
            {t("queue")}
          </h2>
          <div className="flex items-center gap-1">
            {upcoming.length > 0 && (
              <button
                type="button"
                onClick={() => send?.({ type: "CLEAR_UPCOMING" })}
                className="min-h-11 cursor-pointer rounded-full px-3 text-sm font-semibold text-text-muted hover:bg-surface-raised hover:text-text"
              >
                {t("clearUpcoming")}
              </button>
            )}
            <IconButton
              label={t("closeQueue")}
              onClick={() => {
                openPanel(null);
              }}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {current ? (
            <>
              <h3 className="px-2 pb-2 text-xs font-semibold tracking-wide text-text-muted uppercase">
                {t("nowPlayingTitle")}
              </h3>
              <QueueRow
                track={current}
                active
                playing={playing}
                onSelect={() => send?.({ type: "JUMP", index })}
              />
              <h3 className="mt-6 px-2 pb-1 text-xs font-semibold tracking-wide text-text-muted uppercase">
                {t("upNext")}
              </h3>
              {upcoming.length === 0 ? (
                <p className="px-2 py-3 text-sm text-text-muted">{t("queueEmpty")}</p>
              ) : (
                <>
                  <p id={hintId} className="px-2 pb-2 text-xs text-text-muted">
                    {t("reorderHint")}
                  </p>
                  <Reorder.Group
                    axis="y"
                    values={upcoming}
                    onReorder={(next: Track[]) => {
                      const m = diffMove(upcoming, next);
                      if (m)
                        send?.({ type: "MOVE", from: m.from + index + 1, to: m.to + index + 1 });
                    }}
                    className="flex flex-col gap-0.5"
                    aria-describedby={hintId}
                  >
                    {upcoming.map((track, i) => {
                      const at = index + 1 + i;
                      return (
                        <DraggableRow
                          key={keyOf(track)}
                          track={track}
                          onSelect={() => send?.({ type: "JUMP", index: at })}
                          onRemove={() => send?.({ type: "REMOVE", index: at })}
                          onMove={(delta) => {
                            moveBy(at, delta);
                          }}
                          dragLabel={t("dragToReorder", { title: track.title })}
                          removeLabel={t("removeFromQueue", { title: track.title })}
                        />
                      );
                    })}
                  </Reorder.Group>
                </>
              )}
            </>
          ) : (
            <p className="px-2 py-6 text-text-muted">{t("queueEmpty")}</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function DraggableRow({
  track,
  onSelect,
  onRemove,
  onMove,
  dragLabel,
  removeLabel,
}: {
  track: Track;
  onSelect: () => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
  dragLabel: string;
  removeLabel: string;
}) {
  const drag = useDragControls();
  // Alt+↑/↓ reorders from the keyboard; dragging is pointer-only.
  const onKeyDown = (e: KeyboardEvent) => {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    onMove(e.key === "ArrowUp" ? -1 : 1);
  };
  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={drag}
      as="li"
      className="group flex items-center gap-1 rounded-(--radius-control) bg-surface pr-1 hover:bg-surface-raised"
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 30px -10px rgb(0 0 0 / 0.5)" }}
    >
      <button
        type="button"
        aria-label={dragLabel}
        title={dragLabel}
        tabIndex={-1}
        onPointerDown={(e) => {
          drag.start(e);
        }}
        className="grid h-11 w-7 shrink-0 cursor-grab touch-none place-items-center text-text-muted active:cursor-grabbing"
      >
        <GripIcon size={16} />
      </button>
      <QueueRowButton track={track} onSelect={onSelect} onKeyDown={onKeyDown} />
      <IconButton
        label={removeLabel}
        onClick={onRemove}
        size="sm"
        className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <CloseIcon size={16} />
      </IconButton>
    </Reorder.Item>
  );
}

function QueueRow({
  track,
  active,
  playing,
  onSelect,
}: {
  track: Track;
  active?: boolean;
  playing?: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-(--radius-control) bg-surface-raised pr-2">
      <QueueRowButton track={track} onSelect={onSelect} active={active} />
      {active && <Equalizer playing={!!playing} className="mr-2" />}
    </div>
  );
}

function QueueRowButton({
  track,
  onSelect,
  onKeyDown,
  active,
}: {
  track: Track;
  onSelect: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-current={active ? "true" : undefined}
      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-(--radius-control) p-2 text-left"
    >
      <Artwork artwork={track.artwork} size="small" className="size-10 shrink-0" />
      <span className="flex min-w-0 flex-col">
        <span className={`truncate font-medium ${active ? "text-accent" : ""}`}>{track.title}</span>
        <span className="truncate text-sm text-text-muted">{track.artist.name}</span>
      </span>
    </button>
  );
}
