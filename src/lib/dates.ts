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
