import { describe, expect, it } from "vitest";
import { decorateDeadlines, groupDeadlines, type Deadline, type ProgrammeRef } from "./deadlines";

const TODAY = "2026-10-25";
const prog = (id: string, status: ProgrammeRef["status"]): ProgrammeRef => ({ id, programme_name: id, university_name: "U", status });
const dl = (id: string, due_date: string, o: Partial<Deadline> = {}): Deadline => ({
  id, programme_id: null, deadline_type: "milestone", title: id, due_date, is_done: false, sample_key: null, ...o,
});
const group = (d: Deadline[], p: ProgrammeRef[] = []) => {
  const g = groupDeadlines(decorateDeadlines(d, p, TODAY));
  return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.map((x) => x.id)]));
};

describe("groupDeadlines", () => {
  it("puts yesterday in overdue, today and +14 in due soon, +15 in later", () => {
    expect(group([dl("y", "2026-10-24"), dl("t", "2026-10-25"), dl("s", "2026-11-08"), dl("l", "2026-11-09")])).toEqual({
      overdue: ["y"], soon: ["t", "s"], later: ["l"], closed: [],
    });
  });
  it("orders each group chronologically", () => {
    expect(group([dl("b", "2026-10-30"), dl("a", "2026-10-26")]).soon).toEqual(["a", "b"]);
  });
  it("done milestones drop out of the outstanding groups", () => {
    expect(group([dl("d", "2026-10-20", { is_done: true })])).toEqual({ overdue: [], soon: [], later: [], closed: ["d"] });
  });
  it("a submitted, decided or withdrawn programme's deadlines are not outstanding", () => {
    const d = [dl("s", "2026-10-20", { programme_id: "p1", deadline_type: "submission" }), dl("m", "2026-10-30", { programme_id: "p1" })];
    for (const status of ["submitted", "decision_received", "withdrawn"] as const) {
      expect(group(d, [prog("p1", status)]).closed).toEqual(["s", "m"]);
    }
    expect(group(d, [prog("p1", "preparing")])).toMatchObject({ overdue: ["s"], soon: ["m"] });
  });
  it("a submission deadline ignores its own is_done flag", () => {
    expect(group([dl("s", "2026-10-20", { programme_id: "p1", deadline_type: "submission", is_done: true })], [prog("p1", "researching")]).overdue).toEqual(["s"]);
  });
  it("general deadlines with no programme stay outstanding", () => {
    expect(group([dl("g", "2026-12-01", { deadline_type: "other" })]).later).toEqual(["g"]);
  });
  it("explains why an item is closed", () => {
    const v = decorateDeadlines([dl("s", "2026-10-20", { programme_id: "p1" })], [prog("p1", "submitted")], TODAY)[0];
    expect(v.closedReason).toBe("Submitted");
  });
});
