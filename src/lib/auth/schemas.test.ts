import { describe, expect, it } from "vitest";
import { fieldErrors, forgotSchema, resetSchema, signInSchema, signUpSchema } from "./schemas";

const errs = (r: { success: boolean; error?: import("zod").ZodError }) => (r.success ? {} : fieldErrors(r.error!));

describe("auth schemas", () => {
  it("trims and validates email", () => {
    const ok = forgotSchema.safeParse({ email: "  maya@example.com " });
    expect(ok.success && ok.data.email).toBe("maya@example.com");
    expect(errs(forgotSchema.safeParse({ email: "nope" })).email).toMatch(/valid email/);
    expect(errs(forgotSchema.safeParse({ email: "" })).email).toBeDefined();
  });

  it("sign-in only needs a non-empty password (no password-policy hints at login)", () => {
    expect(signInSchema.safeParse({ email: "a@example.com", password: "x" }).success).toBe(true);
    expect(errs(signInSchema.safeParse({ email: "a@example.com", password: "" })).password).toBeDefined();
  });

  it("sign-up enforces length, 72-byte cap and matching confirmation", () => {
    const base = { email: "a@example.com", password: "longenough1", confirm: "longenough1" };
    expect(signUpSchema.safeParse(base).success).toBe(true);
    expect(errs(signUpSchema.safeParse({ ...base, password: "short", confirm: "short" })).password).toMatch(/8 characters/);
    expect(errs(signUpSchema.safeParse({ ...base, confirm: "different1" })).confirm).toMatch(/do not match/);
    const long = "a".repeat(73);
    expect(errs(signUpSchema.safeParse({ ...base, password: long, confirm: long })).password).toMatch(/72/);
    const multibyte = "é".repeat(37); // 74 bytes
    expect(errs(signUpSchema.safeParse({ ...base, password: multibyte, confirm: multibyte })).password).toMatch(/72/);
  });

  it("reset enforces the same password rules", () => {
    expect(resetSchema.safeParse({ password: "longenough1", confirm: "longenough1" }).success).toBe(true);
    expect(errs(resetSchema.safeParse({ password: "short", confirm: "short" })).password).toBeDefined();
    expect(errs(resetSchema.safeParse({ password: "longenough1", confirm: "x" })).confirm).toBeDefined();
  });
});
