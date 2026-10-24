import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-path";

describe("safeNextPath", () => {
  it("accepts same-site relative paths, keeping query and hash", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/programmes?status=preparing#top")).toBe("/programmes?status=preparing#top");
  });

  it.each([
    "//evil.com",
    "///evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "https://evil.com",
    "http://evil.com/x",
    "javascript:alert(1)",
    "evil.com",
    "dashboard",
    "/%2f/evil.com",
    "/%5cevil.com",
    "/a\nb",
    "/a\u0000b",
    "/path\\with\\backslash",
    "",
  ])("rejects %j", (bad) => {
    expect(safeNextPath(bad)).toBeNull();
  });

  it("rejects null, undefined and oversized input", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("/" + "a".repeat(600))).toBeNull();
  });
});
