import { formatIsoDate } from "@/lib/dates";
import { LEVEL_LABELS, REQUIREMENT_LABELS, REQUIREMENT_TYPES, STATUS_LABELS, type Programme, type Requirement } from "./types";

export type Column = { programme: Programme; deadline: string | null; requirements: Requirement[] };
/** kind says how to read the text: a real value, an unknown, a not-applicable, or nothing recorded at all. */
export type Cell = { text: string; kind: "value" | "unknown" | "na" | "missing"; lowest?: boolean };
export type MatrixRow = { key: string; label: string; group: "overview" | "requirements"; cells: Cell[]; differs: boolean; note?: string };

const value = (text: string): Cell => ({ text, kind: "value" });
const unknown: Cell = { text: "Unknown", kind: "unknown" };
const orUnknown = (s: string | null) => (s ? value(s) : unknown);

const money = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Tuition as shown anywhere: the amount with its own currency, or Unknown / Not applicable. Never blank, never 0 by default. */
export function tuitionLabel(p: Pick<Programme, "tuition_state" | "tuition_amount" | "tuition_currency">): string {
  if (p.tuition_state === "known" && p.tuition_amount != null && p.tuition_currency) return money(p.tuition_amount, p.tuition_currency);
  return p.tuition_state === "not_applicable" ? "Not applicable" : "Unknown";
}

function requirementCell(r: Requirement | undefined): Cell {
  if (!r) return { text: "Not recorded", kind: "missing" };
  if (r.level === "unknown") return unknown;
  if (r.level === "not_applicable") return { text: "Not applicable", kind: "na" };
  const qty = r.requirement_type === "references" && r.quantity > 1 ? ` (${r.quantity})` : "";
  return value(`${LEVEL_LABELS[r.level]}${qty}${r.detail ? `: ${r.detail}` : ""}`);
}

const differs = (cells: Cell[]) => new Set(cells.map((c) => `${c.kind}|${c.text}`)).size > 1;

/**
 * Builds the comparison rows (PRD CMP-01, CMP-02, CMP-05). Tuition amounts are only ever compared inside one
 * currency; when the known amounts use different currencies the row says so and marks nothing as lowest.
 */
export function buildMatrix(cols: Column[]): MatrixRow[] {
  const row = (key: string, label: string, group: MatrixRow["group"], cells: Cell[], note?: string): MatrixRow => ({ key, label, group, cells, differs: differs(cells), note });

  const tuition: Cell[] = cols.map(({ programme: p }) =>
    p.tuition_state === "known" && p.tuition_amount != null && p.tuition_currency
      ? value(money(p.tuition_amount, p.tuition_currency))
      : p.tuition_state === "not_applicable"
        ? { text: "Not applicable", kind: "na" }
        : unknown,
  );
  const knownIdx = cols.flatMap(({ programme: p }, i) => (p.tuition_state === "known" && p.tuition_amount != null && p.tuition_currency ? [i] : []));
  const currencies = new Set(knownIdx.map((i) => cols[i].programme.tuition_currency));
  let tuitionNote: string | undefined;
  if (currencies.size > 1) {
    tuitionNote = "Currencies differ, so amounts are shown as entered and not compared.";
  } else if (knownIdx.length > 1) {
    const amounts = knownIdx.map((i) => cols[i].programme.tuition_amount as number);
    const min = Math.min(...amounts);
    if (new Set(amounts).size > 1) knownIdx.forEach((i) => { if (cols[i].programme.tuition_amount === min) tuition[i].lowest = true; });
  }

  const overview = [
    row("country", "Country or region", "overview", cols.map((c) => orUnknown(c.programme.country_region))),
    row("subject", "Subject", "overview", cols.map((c) => orUnknown(c.programme.subject))),
    row("intake", "Intake", "overview", cols.map((c) => orUnknown(c.programme.intake_label))),
    row("duration", "Duration", "overview", cols.map((c) => (c.programme.duration_months ? value(`${c.programme.duration_months} months`) : unknown))),
    row("tuition", "Tuition", "overview", tuition, tuitionNote),
    row("deadline", "Submission deadline", "overview", cols.map((c) => (c.deadline ? value(formatIsoDate(c.deadline)) : unknown))),
    row("status", "Application status", "overview", cols.map((c) => value(STATUS_LABELS[c.programme.status]))),
    row("shortlisted", "Shortlisted", "overview", cols.map((c) => value(c.programme.is_shortlisted ? "Yes" : "No"))),
  ];

  const requirements = REQUIREMENT_TYPES.filter((t) => cols.some((c) => c.requirements.some((r) => r.requirement_type === t))).map((t) =>
    row(`req-${t}`, REQUIREMENT_LABELS[t], "requirements", cols.map((c) => requirementCell(c.requirements.find((r) => r.requirement_type === t)))),
  );
  return [...overview, ...requirements];
}
