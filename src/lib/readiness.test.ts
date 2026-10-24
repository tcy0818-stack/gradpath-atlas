import { describe, expect, it } from "vitest";
import type { DocFacts } from "@/lib/documents/types";
import type { Requirement } from "@/lib/programmes/types";
import { computeReadiness, docIssue } from "./readiness";

const TODAY = "2026-10-25";
let n = 0;
const req = (o: Partial<Requirement>): Requirement => ({
  id: `r${++n}`, owner_id: "u", programme_id: "p", requirement_type: "transcript", level: "required", detail: null,
  quantity: 1, self_confirmed: false, created_at: "", updated_at: "", ...o,
});
const doc = (o: Partial<DocFacts>): DocFacts => ({ id: `d${++n}`, title: "Doc", doc_type: "transcript", prep_status: "ready", expiry_date: null, ...o });
const run = (reqs: Requirement[], links: Record<string, DocFacts[]> = {}) => computeReadiness(reqs, new Map(Object.entries(links)), TODAY);

describe("docIssue", () => {
  it("accepts a ready, matching, unexpired document", () => expect(docIssue(doc({}), "transcript", TODAY)).toBeNull());
  it("rejects draft and not started", () => {
    expect(docIssue(doc({ prep_status: "draft" }), "transcript", TODAY)).toBe("draft");
    expect(docIssue(doc({ prep_status: "not_started" }), "transcript", TODAY)).toBe("not_started");
  });
  it("expiry is the last valid day: today counts, yesterday does not", () => {
    expect(docIssue(doc({ expiry_date: TODAY }), "transcript", TODAY)).toBeNull();
    expect(docIssue(doc({ expiry_date: "2026-10-24" }), "transcript", TODAY)).toBe("expired");
  });
  it("rejects the wrong type", () => expect(docIssue(doc({ doc_type: "cv" }), "transcript", TODAY)).toBe("wrong_type"));
});

describe("computeReadiness", () => {
  it("counts a ready document as satisfying a required requirement", () => {
    const r = req({});
    const out = run([r], { [r.id]: [doc({})] });
    expect(out).toMatchObject({ required: 1, satisfied: 1, complete: true, label: "1 of 1 required satisfied" });
  });
  it("draft, expired and wrong-type links do not satisfy, and say why", () => {
    const r = req({});
    const out = run([r], { [r.id]: [doc({ prep_status: "draft" }), doc({ expiry_date: "2026-01-01" }), doc({ doc_type: "cv" })] });
    expect(out.satisfied).toBe(0);
    expect(out.items[0].state).toBe("missing");
    expect(out.items[0].linked.map((l) => l.issue)).toEqual(["draft", "expired", "wrong_type"]);
    expect(out.items[0].missing).toContain("some linked documents do not count");
  });
  it("quantity 2 with one ready document is not satisfied; two is", () => {
    const r = req({ requirement_type: "references", quantity: 2 });
    const ref = (o: Partial<DocFacts> = {}) => doc({ doc_type: "reference_letter", ...o });
    expect(run([r], { [r.id]: [ref()] }).items[0]).toMatchObject({ state: "missing", have: 1, need: 2 });
    expect(run([r], { [r.id]: [ref(), ref({ prep_status: "draft" })] }).satisfied).toBe(0);
    expect(run([r], { [r.id]: [ref(), ref()] }).satisfied).toBe(1);
  });
  it("optional, not-applicable and unknown requirements are outside the denominator", () => {
    const out = run([req({}), req({ requirement_type: "cv", level: "optional" }), req({ requirement_type: "statement", level: "not_applicable" }), req({ requirement_type: "portfolio", level: "unknown" })]);
    expect(out).toMatchObject({ required: 1, satisfied: 0, unknown: 1, label: "0 of 1 required satisfied" });
    expect(out.items.map((i) => i.state)).toEqual(["missing", "optional", "not_applicable", "unknown"]);
  });
  it("no required requirements is neither 0% nor complete", () => {
    expect(run([])).toMatchObject({ required: 0, complete: false, label: "No required requirements recorded" });
    expect(run([req({ level: "optional" })]).complete).toBe(false);
  });
  it("the academic requirement is self-checked and ignores any documents", () => {
    const a = req({ requirement_type: "academic" });
    expect(run([a], { [a.id]: [doc({})] }).items[0]).toMatchObject({ state: "missing", selfChecked: true, linked: [] });
    expect(run([{ ...a, self_confirmed: true }]).complete).toBe(true);
  });
  it("one document can satisfy requirements in two programmes", () => {
    const d = doc({});
    const a = req({ programme_id: "p1" });
    const b = req({ programme_id: "p2" });
    expect(run([a], { [a.id]: [d] }).complete).toBe(true);
    expect(run([b], { [b.id]: [d] }).complete).toBe(true);
  });
});
