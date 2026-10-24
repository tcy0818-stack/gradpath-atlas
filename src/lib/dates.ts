// Calendar-date helpers (PRD 5.5). Dates are 'YYYY-MM-DD' strings and are never parsed through the local or UTC
// clock, so a date cannot shift by a day. Phase 5 extends this module (classification, day arithmetic).
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isValidIsoDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
  return d <= days;
}

/** '2026-10-25' -> '25 Oct 2026'. Invalid input is returned unchanged. */
export function formatIsoDate(value: string): string {
  if (!isValidIsoDate(value)) return value;
  const [y, m, d] = value.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** The calendar date 'now' falls on in an IANA time zone, e.g. for the seed date. Falls back to UTC for a bad zone. */
export function todayInZone(timeZone: string, now: Date = new Date()): string {
  const fmt = (tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  try {
    return fmt(timeZone);
  } catch {
    return fmt("UTC");
  }
}

// --- Day arithmetic and deadline classification (PRD 5.5, DL-03/DL-04) -----------------------------------------------
// Convention: every date is a calendar date ('YYYY-MM-DD') and "today" is the date in the user's profile time zone
// (todayInZone). Differences are whole calendar days computed from the year/month/day numbers, so no time zone, UTC
// offset or daylight-saving change can move a date. Nothing here writes a date; pages never alter stored deadlines.

/** The "due soon" window: today up to and including today + 14 days (an assumption, PRD 5.5). */
export const DUE_SOON_DAYS = 14;

/** Whole days from `from` to `to` (negative when `to` is earlier). Both must be valid ISO dates. */
export function daysBetween(from: string, to: string): number {
  const n = (v: string) => {
    const [y, m, d] = v.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86_400_000; // UTC is used only as a calendar calculator on exact midnights
  };
  return n(to) - n(from);
}

export function addDays(value: string, days: number): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export type DueClass = "overdue" | "today" | "soon" | "later" | "none";

/** Where a due date sits relative to today. A date equal to today is "today", never overdue. Missing date is "none". */
export function classifyDue(due: string | null | undefined, today: string, window: number = DUE_SOON_DAYS): DueClass {
  if (!due || !isValidIsoDate(due)) return "none";
  const diff = daysBetween(today, due);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  return diff <= window ? "soon" : "later";
}

/** Sort key: earlier dates first, missing dates last. */
export const compareDue = (a: string | null, b: string | null) => (a === b ? 0 : a == null ? 1 : b == null ? -1 : a < b ? -1 : 1);
