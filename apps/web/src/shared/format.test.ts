import { describe, expect, it } from "vitest";
import { dayKey, formatCount, formatTime } from "./format";

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [75.9, "1:15"],
    [3725, "1:02:05"],
    [Number.NaN, "0:00"],
    [-4, "0:00"],
  ])("%s → %s", (input, out) => {
    expect(formatTime(input)).toBe(out);
  });
});

describe("formatCount", () => {
  it("uses the locale’s compact notation", () => {
    expect(formatCount(1234, "en")).toBe("1.2K");
    expect(formatCount(999, "vi")).toBe("999");
  });
});

describe("dayKey", () => {
  it("uses local calendar days", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
