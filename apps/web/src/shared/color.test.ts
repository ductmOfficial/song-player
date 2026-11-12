import { describe, expect, it } from "vitest";
import { MIN_CONTRAST, contrastRatio, fitAccent } from "./color";

const hex = (h: string) => ({
  r: Number.parseInt(h.slice(1, 3), 16),
  g: Number.parseInt(h.slice(3, 5), 16),
  b: Number.parseInt(h.slice(5, 7), 16),
});

// Artwork colors that are hard to keep legible: neon yellow, pure blue, near-black, grey.
const samples = [
  { r: 255, g: 230, b: 0 },
  { r: 0, g: 0, b: 255 },
  { r: 10, g: 10, b: 12 },
  { r: 128, g: 128, b: 128 },
  { r: 0, g: 200, b: 120 },
];

describe("fitAccent", () => {
  for (const bg of ["#121110", "#f6f3ee"]) {
    it(`keeps ${String(MIN_CONTRAST)}:1 against ${bg}`, () => {
      for (const s of samples) {
        const accent = fitAccent(s, bg);
        expect(contrastRatio(hex(accent), hex(bg))).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    });
  }

  it("keeps the hue family", () => {
    const accent = hex(fitAccent({ r: 0, g: 0, b: 255 }, "#121110"));
    expect(accent.b).toBeGreaterThan(accent.r);
  });
});
