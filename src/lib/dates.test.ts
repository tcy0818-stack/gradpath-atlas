import { describe, expect, it } from "vitest";
import { addDays, classifyDue, compareDue, daysBetween, formatIsoDate, isValidIsoDate, todayInZone } from "./dates";

describe("isValidIsoDate", () => {
  it("accepts real dates including leap days", () => {
    expect(isValidIsoDate("2026-10-25")).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2000-02-29")).toBe(true);
  });
  it.each(["2026-02-30", "2027-02-29", "1900-02-29", "2026-13-01", "2026-00-10", "2026-10-00", "2026-1-5", "26-10-25", "", "2026-10-25T00:00:00Z"])(
    "rejects %j",
    (v) => expect(isValidIsoDate(v)).toBe(false),
  );
});

describe("formatIsoDate", () => {
  it("formats without shifting the day", () => {
    expect(formatIsoDate("2026-10-25")).toBe("25 Oct 2026");
    expect(formatIsoDate("2027-01-01")).toBe("1 Jan 2027");
    expect(formatIsoDate("2026-12-31")).toBe("31 Dec 2026");
  });
  it("returns invalid input unchanged", () => expect(formatIsoDate("nonsense")).toBe("nonsense"));
});

describe("todayInZone", () => {
  const instant = new Date("2026-12-31T20:00:00Z");
  it("is the calendar day in that zone", () => {
    expect(todayInZone("UTC", instant)).toBe("2026-12-31");
    expect(todayInZone("Asia/Hong_Kong", instant)).toBe("2027-01-01");
    expect(todayInZone("America/Los_Angeles", instant)).toBe("2026-12-31");
  });
  it("falls back to UTC for an invalid zone", () => expect(todayInZone("Not/AZone", instant)).toBe("2026-12-31"));
});

describe("daysBetween / addDays", () => {
  it("crosses month, year and leap-day boundaries", () => {
    expect(daysBetween("2026-10-31", "2026-11-01")).toBe(1);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(daysBetween("2027-02-28", "2027-03-01")).toBe(1);
    expect(daysBetween("2026-10-25", "2026-10-24")).toBe(-1);
    expect(addDays("2026-12-28", 6)).toBe("2027-01-03");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("classifyDue", () => {
  const today = "2026-10-25";
  it("yesterday, today, tomorrow", () => {
    expect(classifyDue("2026-10-24", today)).toBe("overdue");
    expect(classifyDue("2026-10-25", today)).toBe("today");
    expect(classifyDue("2026-10-26", today)).toBe("soon");
  });
  it("the due-soon window ends at +14 days", () => {
    expect(classifyDue("2026-11-08", today)).toBe("soon");
    expect(classifyDue("2026-11-09", today)).toBe("later");
  });
  it("month end to month start and year end to year start", () => {
    expect(classifyDue("2026-11-01", "2026-10-31")).toBe("soon");
    expect(classifyDue("2027-01-01", "2026-12-31")).toBe("soon");
    expect(classifyDue("2026-12-31", "2027-01-01")).toBe("overdue");
    expect(classifyDue("2028-02-29", "2028-02-15")).toBe("soon");
  });
  it("missing or invalid dates are none", () => {
    expect(classifyDue(null, today)).toBe("none");
    expect(classifyDue("", today)).toBe("none");
    expect(classifyDue("2026-02-30", today)).toBe("none");
  });
  it("two time zones on the same instant can disagree about today, and so about overdue", () => {
    const instant = new Date("2026-12-31T20:00:00Z");
    expect(classifyDue("2026-12-31", todayInZone("Asia/Hong_Kong", instant))).toBe("overdue");
    expect(classifyDue("2026-12-31", todayInZone("America/Los_Angeles", instant))).toBe("today");
  });
});

describe("compareDue", () => {
  it("sorts earlier first and missing last", () => {
    expect(["2026-12-01", null, "2026-10-01"].sort(compareDue)).toEqual(["2026-10-01", "2026-12-01", null]);
  });
});
