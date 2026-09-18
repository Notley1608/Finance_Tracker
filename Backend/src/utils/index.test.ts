import { describe, expect, it } from "bun:test";
import {
  HttpError,
  escapeCsvCell,
  formatDate,
  REFRESH_TOKEN_TTL_MS,
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
} from "./index";

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

describe("generateRefreshToken", () => {
  it("produces a URL-safe token of at least 48 bytes", () => {
    const token = generateRefreshToken();
    expect(token.length).toBeGreaterThanOrEqual(63);
    expect(token).not.toContain("+");
    expect(token).not.toContain("/");
  });

  it("is unique", () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });
});

describe("hashToken", () => {
  it("hashes deterministically to a hex string", () => {
    const hash = hashToken("abc123");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("abc123")).toBe(hash);
    expect(hashToken("abc123")).not.toBe(hashToken("abc124"));
  });
});

describe("refreshTokenExpiry", () => {
  it("is the configured TTL after the given date", () => {
    const base = new Date("2024-01-01T00:00:00Z");
    const expiry = new Date(refreshTokenExpiry(base));
    expect(expiry.getTime()).toBe(base.getTime() + REFRESH_TOKEN_TTL_MS);
  });
});