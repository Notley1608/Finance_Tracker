import { describe, expect, it } from "bun:test";
import { isSameMonth, occurrencesForMonth } from "./recurrence";

describe("isSameMonth", () => {
  it("detects same-year/month membership", () => {
    expect(isSameMonth("2024-03-15", 2024, 2)).toBe(true);
    expect(isSameMonth("2024-03-31", 2024, 2)).toBe(true);
    expect(isSameMonth("2024-03-01", 2024, 3)).toBe(false);
    expect(isSameMonth("2023-03-15", 2024, 2)).toBe(false);
  });
});

describe("occurrencesForMonth", () => {
  it("returns nothing for non-recurring entries", () => {
    expect(occurrencesForMonth("2024-03-15", "none", 2024, 4)).toEqual([]);
  });

  it("skips templates whose own date falls in the target month", () => {
    expect(occurrencesForMonth("2024-05-05", "weekly", 2024, 4)).toEqual([]);
  });

  it("projects weekly occurrences into the target month", () => {
    // 2024-01-01 is a Monday; the Monday occurrences that land in May
    // are the 6th, 13th, 20th and 27th.
    expect(occurrencesForMonth("2024-01-01", "weekly", 2024, 4)).toEqual([
      "2024-05-06",
      "2024-05-13",
      "2024-05-20",
      "2024-05-27",
    ]);
  });

  it("projects monthly occurrences, clamping short months", () => {
    expect(occurrencesForMonth("2024-01-15", "monthly", 2024, 4)).toEqual([
      "2024-05-15",
    ]);
    expect(occurrencesForMonth("2024-01-31", "monthly", 2024, 1)).toEqual([
      "2024-02-29",
    ]);
  });

  it("projects yearly occurrences", () => {
    expect(occurrencesForMonth("2024-06-01", "yearly", 2025, 5)).toEqual([
      "2025-06-01",
    ]);
    expect(occurrencesForMonth("2024-06-01", "yearly", 2025, 6)).toEqual([]);
  });
});