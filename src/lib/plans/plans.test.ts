import { describe, expect, it } from "vitest";
import { isSelectablePlan } from "./plans";

describe("isSelectablePlan", () => {
  it("allows only the free plan and the season pass; the licence tier is enquiry-only", () => {
    expect(isSelectablePlan("free")).toBe(true);
    expect(isSelectablePlan("season_pass")).toBe(true);
    for (const v of ["licence_enquiry", "", "admin", null, undefined, 1]) expect(isSelectablePlan(v)).toBe(false);
  });
});
