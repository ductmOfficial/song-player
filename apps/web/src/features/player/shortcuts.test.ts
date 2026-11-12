import { describe, expect, it } from "vitest";
import { matchShortcut } from "./shortcuts";

const key = (k: string, mods: Partial<KeyboardEvent> = {}) => ({
  key: k,
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...mods,
});

describe("matchShortcut", () => {
  it("separates seek from skip by Shift", () => {
    expect(matchShortcut(key("ArrowRight"))?.action).toBe("seekForward");
    expect(matchShortcut(key("ArrowRight", { shiftKey: true }))?.action).toBe("next");
  });

  it("is case-insensitive for letters", () => {
    expect(matchShortcut(key("M"))?.action).toBe("mute");
    expect(matchShortcut(key("N", { shiftKey: true }))?.action).toBe("next");
  });

  it("matches ? regardless of the Shift needed to type it", () => {
    expect(matchShortcut(key("?", { shiftKey: true }))?.action).toBe("help");
  });

  it("leaves browser and OS shortcuts alone", () => {
    expect(matchShortcut(key("k", { metaKey: true }))).toBeUndefined();
    expect(matchShortcut(key("ArrowLeft", { altKey: true }))).toBeUndefined();
  });
});
