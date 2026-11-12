import { describe, expect, it } from "vitest";
import { filterQuery, isMood, isTime } from "./moods";

describe("discover filters", () => {
  it("omits defaults from the URL", () => {
    expect(filterQuery({ mood: "all", time: "week" })).toEqual({});
    expect(filterQuery({ mood: "rain", time: "allTime" })).toEqual({
      mood: "rain",
      time: "allTime",
    });
  });
  it("rejects unknown values", () => {
    expect(isMood("rain")).toBe(true);
    expect(isMood("toString")).toBe(false);
    expect(isTime("year")).toBe(false); // Audius answers 400 for it
  });
});
