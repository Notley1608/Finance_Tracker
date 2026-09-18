import { describe, expect, it } from "vitest";
import {
  buildMonthWindow,
  colourFor,
  formatAmount,
  formatDate,
  getErrorMessage,
  monthName,
  toMonthKey,
} from "./index";

describe("formatAmount", () => {
  it("formats as AUD currency", () => {
    expect(formatAmount(1234.5)).toContain("$");
  });

  it("formats zero", () => {
    expect(formatAmount(0)).toMatch(/\$0\.00/);
  });
});

describe("formatDate", () => {
  it("formats an ISO date", () => {
    expect(formatDate("2024-03-15")).toBe("15 Mar 2024");
  });
});

describe("month helpers", () => {
  it("maps month numbers to names", () => {
    expect(monthName(1)).toBe("January");
    expect(monthName(12)).toBe("December");
  });

  it("builds a month key", () => {
    expect(toMonthKey(2024, 3)).toBe("2024-03");
  });

  it("builds a month window ending in the current month", () => {
    const window = buildMonthWindow(3);
    expect(window).toHaveLength(3);
    expect(window.at(-1)?.key).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("colourFor", () => {
  it("cycles through the fallback palette", () => {
    expect(colourFor(0)).toBe(colourFor(10));
  });
});

describe("getErrorMessage", () => {
  it("extracts error messages", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage("oops")).toBe("oops");
    expect(getErrorMessage({ message: "nested" })).toBe("nested");
  });

  it("falls back for unknown input", () => {
    expect(getErrorMessage(undefined)).toBe("Something went wrong");
  });
});