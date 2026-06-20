// Relative-time formatting for the issue detail's activity feed and Details panel
// (see docs/changes/0006). Jira shows "x minutes ago" style stamps that fall back
// to an absolute date once an event is old enough. `now` is an explicit argument
// (not a hidden `Date.now()` call) so every consumer — and every test — formats
// against a deterministic clock; the store mutates timestamps through the same
// injectable clock, so a comment added at T renders "just now" at T.

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// Past ~7 days we stop counting and show an absolute date, matching Jira (and
// avoiding awkward "45 days ago" stamps).
const ABSOLUTE_AFTER = 7 * DAY;

// Pluralise a whole-unit count, e.g. unit(1, "minute") → "1 minute ago" and
// unit(3, "minute") → "3 minutes ago". Always called with count ≥ 1.
function ago(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

// Format `timestamp` (epoch ms) relative to `now` (epoch ms). Within the last
// week it reads as a coarse "x <unit> ago" stamp stepping seconds → minutes →
// hours → days; older than a week (or any future timestamp) it falls back to an
// absolute date. Sub-minute differences read "just now" so brand-new comments
// don't flicker "0 seconds ago".
export function formatRelativeTime(timestamp: number, now: number): string {
  const delta = now - timestamp;

  // Future timestamps (clock skew, or a seed dated ahead of `now`) have no
  // sensible "ago" reading — show the absolute date rather than a negative count.
  if (delta < 0) {
    return formatAbsoluteDate(timestamp);
  }
  if (delta < MINUTE) {
    return "just now";
  }
  if (delta < HOUR) {
    return ago(Math.floor(delta / MINUTE), "minute");
  }
  if (delta < DAY) {
    return ago(Math.floor(delta / HOUR), "hour");
  }
  if (delta < ABSOLUTE_AFTER) {
    return ago(Math.floor(delta / DAY), "day");
  }
  return formatAbsoluteDate(timestamp);
}

// Absolute "MMM D, YYYY" date (e.g. "Jun 1, 2026") in UTC, so the seed's
// UTC-based timestamps render identically regardless of the test/runner timezone.
export function formatAbsoluteDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
