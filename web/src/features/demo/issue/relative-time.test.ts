import { describe, it, expect } from "vitest";
import { formatAbsoluteDate, formatRelativeTime } from "./relative-time.ts";

// A fixed "now" so every relative case is deterministic.
const NOW = Date.UTC(2026, 5, 20, 12, 0, 0);
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("reads 'just now' for sub-minute differences", () => {
    expect(formatRelativeTime(NOW, NOW)).toBe("just now");
    expect(formatRelativeTime(NOW - 59 * SECOND, NOW)).toBe("just now");
  });

  it("counts minutes, singular and plural", () => {
    expect(formatRelativeTime(NOW - MINUTE, NOW)).toBe("1 minute ago");
    expect(formatRelativeTime(NOW - 5 * MINUTE, NOW)).toBe("5 minutes ago");
    expect(formatRelativeTime(NOW - 59 * MINUTE, NOW)).toBe("59 minutes ago");
  });

  it("counts hours, singular and plural", () => {
    expect(formatRelativeTime(NOW - HOUR, NOW)).toBe("1 hour ago");
    expect(formatRelativeTime(NOW - 3 * HOUR, NOW)).toBe("3 hours ago");
    expect(formatRelativeTime(NOW - 23 * HOUR, NOW)).toBe("23 hours ago");
  });

  it("counts days, singular and plural", () => {
    expect(formatRelativeTime(NOW - DAY, NOW)).toBe("1 day ago");
    expect(formatRelativeTime(NOW - 6 * DAY, NOW)).toBe("6 days ago");
  });

  it("falls back to an absolute date once older than a week", () => {
    const old = NOW - 8 * DAY;
    expect(formatRelativeTime(old, NOW)).toBe(formatAbsoluteDate(old));
  });

  it("falls back to an absolute date for a future timestamp", () => {
    const future = NOW + 2 * HOUR;
    expect(formatRelativeTime(future, NOW)).toBe(formatAbsoluteDate(future));
  });
});

describe("formatAbsoluteDate", () => {
  it("formats a UTC 'MMM D, YYYY' date independent of timezone", () => {
    expect(formatAbsoluteDate(Date.UTC(2026, 5, 1, 9, 0, 0))).toBe(
      "Jun 1, 2026",
    );
  });
});
