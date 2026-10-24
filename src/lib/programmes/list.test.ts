import { describe, expect, it } from "vitest";
import { distinct, filterSort, parseListParams, type ListRow } from "./list";

const row = (o: Partial<ListRow> & { programme_name: string }): ListRow => ({
  id: o.programme_name, owner_id: "u", university_name: "U", country_region: null, subject: null, intake_label: null, duration_months: null,
  tuition_state: "unknown", tuition_amount: null, tuition_currency: null, status: "researching", is_shortlisted: false, notes: null,
  sample_key: null, created_at: "", updated_at: "", deadline: null, ...o,
});
const rows = [
  row({ programme_name: "Data", university_name: "Brightwater", country_region: "Netherlands", subject: "Data", status: "preparing", deadline: "2026-10-20", tuition_state: "known", tuition_amount: 18200, tuition_currency: "EUR", is_shortlisted: true }),
  row({ programme_name: "Marketing", university_name: "Aldermoor", country_region: "United Kingdom", subject: "Marketing", status: "preparing", deadline: "2026-10-31", tuition_state: "known", tuition_amount: 24500, tuition_currency: "GBP" }),
  row({ programme_name: "Economics", university_name: "Dunmere", country_region: "United Kingdom", subject: "Economics", deadline: null, tuition_state: "known", tuition_amount: 31000, tuition_currency: "GBP", is_shortlisted: true }),
  row({ programme_name: "CompSci", university_name: "Corvane", country_region: "Germany", deadline: "2026-12-09", tuition_state: "not_applicable" }),
];
const params = (sp: Record<string, string> = {}) => parseListParams(sp);
const names = (r: ListRow[]) => r.map((x) => x.programme_name);

describe("parseListParams", () => {
  it("falls back for unknown values", () => {
    expect(params({ status: "bogus", sort: "nonsense", shortlisted: "yes" })).toMatchObject({ status: "", sort: "deadline", shortlisted: false });
  });
  it("reads valid values", () => {
    expect(params({ status: "preparing", sort: "tuition", shortlisted: "1", q: "  mark " })).toMatchObject({ status: "preparing", sort: "tuition", shortlisted: true, q: "mark" });
  });
});

describe("filterSort", () => {
  it("searches name, university, country and subject case-insensitively", () => {
    expect(names(filterSort(rows, params({ q: "ALDER" })))).toEqual(["Marketing"]);
    expect(names(filterSort(rows, params({ q: "germany" })))).toEqual(["CompSci"]);
    expect(filterSort(rows, params({ q: "zzz" }))).toEqual([]);
  });
  it("filters by status, country and shortlist together", () => {
    expect(names(filterSort(rows, params({ status: "preparing" })))).toEqual(["Data", "Marketing"]);
    expect(names(filterSort(rows, params({ country: "United Kingdom", shortlisted: "1" })))).toEqual(["Economics"]);
  });
  it("sorts by deadline with missing deadlines last", () => {
    expect(names(filterSort(rows, params()))).toEqual(["Data", "Marketing", "CompSci", "Economics"]);
  });
  it("sorts by name and university", () => {
    expect(names(filterSort(rows, params({ sort: "name" })))).toEqual(["CompSci", "Data", "Economics", "Marketing"]);
    expect(names(filterSort(rows, params({ sort: "university" })))).toEqual(["Marketing", "Data", "CompSci", "Economics"]);
  });
  it("sorts tuition within each currency and never mixes them; unknown / N-A last", () => {
    expect(names(filterSort(rows, params({ sort: "tuition" })))).toEqual(["Data", "Marketing", "Economics", "CompSci"]);
  });
});

describe("distinct", () => {
  it("drops blanks and duplicates", () => expect(distinct(["B", null, "A", "B", ""])).toEqual(["A", "B"]));
});
