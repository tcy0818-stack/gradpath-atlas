import { describe, expect, it } from "vitest";
import { dbErrorMessage } from "./db-error";

describe("dbErrorMessage", () => {
  it("maps RLS, unique, foreign-key and check failures to fixed text", () => {
    expect(dbErrorMessage({ code: "42501" })).toMatch(/isn't allowed/);
    expect(dbErrorMessage({ code: "23505" })).toMatch(/already exists/);
    expect(dbErrorMessage({ code: "23503" })).toMatch(/no longer exists/);
    expect(dbErrorMessage({ code: "23514" })).toMatch(/rejected/);
  });
  it("falls back safely for unknown or missing errors", () => {
    expect(dbErrorMessage({ code: "XX000" })).toMatch(/Couldn't save/);
    expect(dbErrorMessage(null)).toMatch(/Couldn't save/);
  });
});
