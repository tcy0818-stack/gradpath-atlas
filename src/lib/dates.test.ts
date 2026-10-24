import { describe, expect, it } from "vitest";
import { formatIsoDate, isValidIsoDate, todayInZone } from "./dates";

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
