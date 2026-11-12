"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the dialog */
  labelledBy: string;
  /** Visual style: centered card, side sheet (bottom sheet on mobile), or full screen */
  variant?: "center" | "side" | "full";
  className?: string;
  children: ReactNode;
}

const variants = {
  center:
    "m-auto w-[min(560px,calc(100vw-2rem))] max-h-[min(720px,calc(100dvh-2rem))] rounded-2xl s-dialog-pop",
  side: "mt-auto mb-0 w-full max-h-[85dvh] rounded-t-2xl sm:m-0 sm:ml-auto sm:h-dvh sm:max-h-dvh sm:w-[420px] sm:rounded-none sm:rounded-l-2xl s-dialog-side",
  full: "m-0 h-dvh max-h-dvh w-full max-w-full s-dialog-rise",
};

/**
 * Native <dialog> with showModal(): focus trapping, Escape, inert background
 * and top-layer stacking come from the browser. Enter/exit transitions are CSS
 * (@starting-style), see globals.css.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  variant = "center",
  className = "",
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click mirrors Escape, handled by onCancel
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Clicking the backdrop (the dialog element itself, outside its content) closes it.
      // Keyboard users have Escape (onCancel), so no key handler is needed here.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`s-dialog overflow-hidden border border-border bg-surface p-0 text-text shadow-2xl ${variants[variant]} ${className}`}
    >
      {children}
    </dialog>
  );
}
