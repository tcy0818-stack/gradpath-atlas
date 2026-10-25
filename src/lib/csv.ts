// CSV writer for exports (SEC-07, EXP-01). RFC 4180 quoting, plus neutralising of spreadsheet formulas in text.
export type Cell = string | number | boolean | null | undefined;

// Excel and Sheets treat a cell starting with one of these as a formula; a leading apostrophe makes it plain text.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: Cell): string {
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Header row first. CRLF line ends per RFC 4180; a leading BOM lets Excel read the file as UTF-8. */
export function toCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
