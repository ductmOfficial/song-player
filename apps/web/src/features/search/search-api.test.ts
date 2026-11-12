import { describe, expect, it } from "vitest";
import { normalizeQuery } from "./search-api";

describe("normalizeQuery", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeQuery("  lo   fi \n")).toBe("lo fi");
  });
  it("ignores queries that are too short", () => {
    expect(normalizeQuery("a")).toBe("");
    expect(normalizeQuery(null)).toBe("");
  });
  it("caps the length", () => {
    expect(normalizeQuery("x".repeat(500))).toHaveLength(100);
  });
});
