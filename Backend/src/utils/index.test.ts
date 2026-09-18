import { describe, expect, it } from "bun:test";
import { HttpError, escapeCsvCell, formatDate } from "./index";

describe("HttpError", () => {
  it("carries a status code and message", () => {
    const error = new HttpError(404, "Not found");
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error.name).toBe("HttpError");
  });
});

describe("formatDate", () => {
  it("formats dates as YYYY-MM-DD in UTC", () => {
    expect(formatDate(new Date("2024-03-15T12:00:00Z"))).toBe("2024-03-15");
  });
});

describe("escapeCsvCell", () => {
  it("quotes cells and escapes internal quotes", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("prefixes formula injection with an apostrophe", () => {
    expect(escapeCsvCell("=SUM(A1)")).toBe('"\'=SUM(A1)"');
  });

  it("stringifies null-ish values", () => {
    expect(escapeCsvCell(null)).toBe('""');
  });
});