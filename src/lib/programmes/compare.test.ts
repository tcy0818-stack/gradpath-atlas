import { describe, expect, it } from "vitest";
import { buildMatrix, type Column } from "./compare";
import { computeReadiness } from "@/lib/readiness";
import type { Programme, Requirement } from "./types";

const prog = (o: Partial<Programme>): Programme => ({
  id: "p", owner_id: "u", university_name: "U", programme_name: "P", country_region: null, subject: null, intake_label: null, duration_months: null,
  tuition_state: "unknown", tuition_amount: null, tuition_currency: null, status: "researching", is_shortlisted: false, notes: null, sample_key: null,
  created_at: "", updated_at: "", ...o,
});
const req = (o: Partial<Requirement>): Requirement => ({
  id: "r", owner_id: "u", programme_id: "p", requirement_type: "language", level: "required", detail: null, quantity: 1, self_confirmed: false, created_at: "", updated_at: "", ...o,
});
const col = (p: Partial<Programme>, requirements: Requirement[] = [], deadline: string | null = null): Column => ({ programme: prog(p), deadline, requirements });
const get = (rows: ReturnType<typeof buildMatrix>, key: string) => rows.find((r) => r.key === key)!;

describe("buildMatrix", () => {
  it("shows unknown values distinctly and flags differing rows", () => {
    const rows = buildMatrix([col({ country_region: "Germany" }), col({})]);
    const c = get(rows, "country");
    expect(c.cells.map((x) => x.text)).toEqual(["Germany", "Unknown"]);
    expect(c.differs).toBe(true);
    expect(get(rows, "subject").differs).toBe(false);
  });

  it("formats dates without shifting and distinguishes a missing deadline", () => {
    const d = get(buildMatrix([col({}, [], "2027-01-01"), col({})]), "deadline");
    expect(d.cells.map((x) => x.text)).toEqual(["1 Jan 2027", "Unknown"]);
  });

  it("never compares tuition across currencies and marks no 'lowest'", () => {
    const t = get(buildMatrix([
      col({ tuition_state: "known", tuition_amount: 18200, tuition_currency: "EUR" }),
      col({ tuition_state: "known", tuition_amount: 24500, tuition_currency: "GBP" }),
    ]), "tuition");
    expect(t.cells.map((x) => x.text)).toEqual(["EUR 18,200", "GBP 24,500"]);
    expect(t.cells.some((x) => x.lowest)).toBe(false);
    expect(t.note).toMatch(/Currencies differ/);
  });

  it("marks the lowest tuition only within one currency, and treats N/A and unknown as non-values", () => {
    const t = get(buildMatrix([
      col({ tuition_state: "known", tuition_amount: 31000, tuition_currency: "GBP" }),
      col({ tuition_state: "known", tuition_amount: 24500, tuition_currency: "GBP" }),
      col({ tuition_state: "not_applicable" }),
      col({}),
    ]), "tuition");
    expect(t.cells.map((x) => !!x.lowest)).toEqual([false, true, false, false]);
    expect(t.cells.map((x) => x.kind)).toEqual(["value", "value", "na", "unknown"]);
    expect(t.note).toBeUndefined();
  });

  it("zero tuition is a value and is not confused with unknown", () => {
    const t = get(buildMatrix([col({ tuition_state: "known", tuition_amount: 0, tuition_currency: "EUR" }), col({})]), "tuition");
    expect(t.cells[0]).toMatchObject({ text: "EUR 0", kind: "value" });
  });

  it("separates 'not recorded' from unknown and not-applicable requirements; shows reference counts", () => {
    const rows = buildMatrix([
      col({}, [req({ requirement_type: "language", level: "required", detail: "IELTS 6.5" }), req({ requirement_type: "references", level: "required", quantity: 2 })]),
      col({}, [req({ requirement_type: "language", level: "unknown" }), req({ requirement_type: "references", level: "not_applicable" })]),
      col({}, []),
    ]);
    const lang = get(rows, "req-language");
    expect(lang.cells.map((c) => [c.kind, c.text])).toEqual([["value", "Required: IELTS 6.5"], ["unknown", "Unknown"], ["missing", "Not recorded"]]);
    expect(get(rows, "req-references").cells.map((c) => c.text)).toEqual(["Required (2)", "Not applicable", "Not recorded"]);
    expect(lang.differs).toBe(true);
  });

  it("only lists requirement types recorded on at least one programme", () => {
    const rows = buildMatrix([col({}, [req({ requirement_type: "cv" })]), col({})]);
    expect(rows.filter((r) => r.group === "requirements").map((r) => r.key)).toEqual(["req-cv"]);
  });

  it("shows the same readiness figure as the shared calculation, and a requirement's state", () => {
    const reqs = [req({ id: "a", requirement_type: "transcript" }), req({ id: "b", requirement_type: "cv", level: "optional" })];
    const ready = computeReadiness(reqs, new Map([["a", [{ id: "d", title: "T", doc_type: "transcript", prep_status: "ready", expiry_date: null }]]]), "2026-10-25");
    const rows = buildMatrix([{ ...col({}, reqs), readiness: ready }, { ...col({}, []), readiness: computeReadiness([], new Map(), "2026-10-25") }]);
    expect(get(rows, "readiness").cells.map((c) => c.text)).toEqual(["1 of 1 required satisfied", "No required requirements recorded"]);
    expect(get(rows, "req-transcript").cells[0].text).toContain("satisfied (1 of 1)");
  });
});
