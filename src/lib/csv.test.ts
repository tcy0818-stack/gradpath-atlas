import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it.each(["=SUM(A1)", "+1", "-2", "@cmd", "\tx", "\rx"])("neutralises a leading formula character in %j", (v) => {
    expect(csvCell(v).replace(/^"/, "").startsWith("'")).toBe(true);
  });
  it("leaves ordinary text, dates and numbers alone", () => {
    expect(csvCell("2027-01-31")).toBe("2027-01-31");
    expect(csvCell(0)).toBe("0");
    expect(csvCell(-5)).toBe("-5"); // a real number is data, not text a user typed
    expect(csvCell(null)).toBe("");
  });
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell("=1,2")).toBe('"\'=1,2"');
  });
  it("keeps Unicode", () => {
    expect(csvCell("Zürich — 東京 ✓")).toBe("Zürich — 東京 ✓");
  });
});

describe("toCsv", () => {
  it("writes a BOM, CRLF rows and just the header when empty", () => {
    expect(toCsv(["a", "b"], [])).toBe("﻿a,b\r\n");
    expect(toCsv(["a", "b"], [["x", 1]])).toBe("﻿a,b\r\nx,1\r\n");
  });
});
