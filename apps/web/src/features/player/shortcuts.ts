/**
 * Keyboard shortcuts as data: the listener and the help dialog read the same
 * table, so they can't drift apart.
 */
export type ShortcutAction =
  | "toggle"
  | "seekBack"
  | "seekForward"
  | "prev"
  | "next"
  | "volumeUp"
  | "volumeDown"
  | "mute"
  | "shuffle"
  | "repeat"
  | "queue"
  | "nowPlaying"
  | "search"
  | "help";

export interface Shortcut {
  action: ShortcutAction;
  /** KeyboardEvent.key values (case-insensitive for letters) */
  keys: string[];
  shift?: boolean;
  /** How the help dialog prints it */
  display: string[];
  /** Needs something in the queue */
  needsQueue?: boolean;
}

export const shortcuts: Shortcut[] = [
  { action: "toggle", keys: [" ", "k"], display: ["Space", "K"], needsQueue: true },
  { action: "seekBack", keys: ["ArrowLeft"], display: ["←"], needsQueue: true },
  { action: "seekForward", keys: ["ArrowRight"], display: ["→"], needsQueue: true },
  {
    action: "prev",
    keys: ["ArrowLeft", "p"],
    shift: true,
    display: ["Shift", "←"],
    needsQueue: true,
  },
  {
    action: "next",
    keys: ["ArrowRight", "n"],
    shift: true,
    display: ["Shift", "→"],
    needsQueue: true,
  },
  { action: "volumeUp", keys: ["ArrowUp"], shift: true, display: ["Shift", "↑"] },
  { action: "volumeDown", keys: ["ArrowDown"], shift: true, display: ["Shift", "↓"] },
  { action: "mute", keys: ["m"], display: ["M"] },
  { action: "shuffle", keys: ["s"], display: ["S"], needsQueue: true },
  { action: "repeat", keys: ["r"], display: ["R"], needsQueue: true },
  { action: "queue", keys: ["q"], display: ["Q"] },
  { action: "nowPlaying", keys: ["f"], display: ["F"], needsQueue: true },
  { action: "search", keys: ["/"], display: ["/"] },
  { action: "help", keys: ["?"], display: ["?"] },
];

type KeyLike = Pick<KeyboardEvent, "key" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey">;

/** `?` and `/` are produced with Shift on many layouts, so Shift is only checked when declared. */
const shiftAgnostic = new Set(["?", "/"]);

export function matchShortcut(e: KeyLike): Shortcut | undefined {
  if (e.altKey || e.ctrlKey || e.metaKey) return undefined;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  return shortcuts.find(
    (s) => s.keys.includes(key) && (shiftAgnostic.has(key) || !!s.shift === e.shiftKey),
  );
}

/** Don't steal keys from text fields, sliders, selects or editable content. */
export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    return !["checkbox", "radio", "button", "submit", "reset"].includes(type);
  }
  return false;
}
