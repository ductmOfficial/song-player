import { describe, expect, it } from "vitest";
import { diffMove } from "./reorder";

describe("diffMove", () => {
  it("detects a move down and up", () => {
    expect(diffMove(["a", "b", "c", "d"], ["b", "c", "a", "d"])).toEqual({ from: 0, to: 2 });
    expect(diffMove(["a", "b", "c", "d"], ["a", "d", "b", "c"])).toEqual({ from: 3, to: 1 });
  });
  it("returns null when nothing moved", () => {
    expect(diffMove(["a", "b"], ["a", "b"])).toBeNull();
  });
});
