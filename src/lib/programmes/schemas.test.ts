import { describe, expect, it } from "vitest";
import { parseForm, programmeSchema, requirementSchema } from "./schemas";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const base = { university_name: "Aldermoor University", programme_name: "MSc Marketing", tuition_state: "unknown" };

describe("programmeSchema", () => {
  it("accepts a minimal programme; blank optional fields become null (unknown), never 0", () => {
    const r = parseForm(programmeSchema, fd({ ...base, duration_months: "", tuition_amount: "", country_region: " ", submission_deadline: "" }));
    expect(r.ok && r.data).toMatchObject({ duration_months: null, tuition_amount: null, tuition_currency: null, country_region: null, submission_deadline: null });
  });

  it("requires amount and a 3-letter currency when tuition is known; upper-cases the currency", () => {
    const miss = parseForm(programmeSchema, fd({ ...base, tuition_state: "known" }));
    expect(!miss.ok && miss.errors).toMatchObject({ tuition_amount: expect.any(String), tuition_currency: expect.any(String) });
    const ok = parseForm(programmeSchema, fd({ ...base, tuition_state: "known", tuition_amount: "24500.456", tuition_currency: " gbp " }));
    expect(ok.ok && ok.data).toMatchObject({ tuition_amount: 24500.46, tuition_currency: "GBP" });
    expect(parseForm(programmeSchema, fd({ ...base, tuition_state: "known", tuition_amount: "1", tuition_currency: "POUNDS" })).ok).toBe(false);
  });

  it("zero tuition is a real known value, distinct from unknown", () => {
    const r = parseForm(programmeSchema, fd({ ...base, tuition_state: "known", tuition_amount: "0", tuition_currency: "EUR" }));
    expect(r.ok && r.data.tuition_amount).toBe(0);
  });

  it("drops any amount or currency sent with unknown / not applicable", () => {
    for (const s of ["unknown", "not_applicable"]) {
      const r = parseForm(programmeSchema, fd({ ...base, tuition_state: s, tuition_amount: "500", tuition_currency: "GBP" }));
      expect(r.ok && r.data).toMatchObject({ tuition_amount: null, tuition_currency: null });
    }
  });

  it("rejects bad names, durations, amounts, dates and states", () => {
    const bad = (o: Record<string, string>) => parseForm(programmeSchema, fd({ ...base, ...o }));
    expect(bad({ university_name: "  " }).ok).toBe(false);
    expect(bad({ programme_name: "x".repeat(161) }).ok).toBe(false);
    expect(bad({ duration_months: "0" }).ok).toBe(false);
    expect(bad({ duration_months: "121" }).ok).toBe(false);
    expect(bad({ duration_months: "1.5" }).ok).toBe(false);
    expect(bad({ duration_months: "12 months" }).ok).toBe(false);
    expect(bad({ tuition_state: "free" }).ok).toBe(false);
    expect(bad({ tuition_state: "known", tuition_amount: "-1", tuition_currency: "GBP" }).ok).toBe(false);
    expect(bad({ submission_deadline: "2026-02-30" }).ok).toBe(false);
    expect(bad({ status: "pending" }).ok).toBe(false);
  });

  it("keeps a valid deadline and status as given", () => {
    const r = parseForm(programmeSchema, fd({ ...base, submission_deadline: "2027-01-15", status: "preparing", notes: " hi " }));
    expect(r.ok && r.data).toMatchObject({ submission_deadline: "2027-01-15", status: "preparing", notes: "hi" });
  });
});

describe("requirementSchema", () => {
  it("accepts a valid requirement and defaults quantity to 1", () => {
    const r = parseForm(requirementSchema, fd({ requirement_type: "references", level: "required", detail: "", quantity: "" }));
    expect(r.ok && r.data).toMatchObject({ quantity: 1, detail: null });
  });
  it("rejects unknown types, levels and quantities outside 1-10", () => {
    expect(parseForm(requirementSchema, fd({ requirement_type: "essay", level: "required" })).ok).toBe(false);
    expect(parseForm(requirementSchema, fd({ requirement_type: "cv", level: "maybe" })).ok).toBe(false);
    expect(parseForm(requirementSchema, fd({ requirement_type: "cv", level: "required", quantity: "11" })).ok).toBe(false);
    expect(parseForm(requirementSchema, fd({ requirement_type: "cv", level: "required", quantity: "0" })).ok).toBe(false);
  });
});
