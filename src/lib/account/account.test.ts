import { describe, expect, it, vi } from "vitest";
import { performDeletion, secretKeyReady } from "./delete";
import { profileSchema } from "./schemas";

const ok = () => vi.fn(async () => ({ error: null }));

describe("secretKeyReady", () => {
  it.each(["sb_secret_replace_me", "", undefined, "your-key-here"])("treats %j as not configured", (k) => expect(secretKeyReady(k)).toBe(false));
  it("accepts a real-looking key", () => expect(secretKeyReady("sb_secret_AbCdEf123")).toBe(true));
});

describe("performDeletion", () => {
  const base = { typed: "DELETE", secretKey: () => "sb_secret_real" };
  it("rejects an unauthenticated caller without touching the API", async () => {
    const deleteUser = ok();
    expect(await performDeletion({ ...base, userId: null, deleteUser })).toBe("unauthenticated");
    expect(deleteUser).not.toHaveBeenCalled();
  });
  it("needs the exact typed confirmation", async () => {
    const deleteUser = ok();
    for (const typed of ["", "delete", "DELETE ME"]) expect(await performDeletion({ ...base, typed, userId: "u1", deleteUser })).toBe("confirmation");
    expect(deleteUser).not.toHaveBeenCalled();
  });
  it("does not pretend to delete when the secret key is a placeholder or missing", async () => {
    const deleteUser = ok();
    expect(await performDeletion({ ...base, secretKey: () => "sb_secret_replace_me", userId: "u1", deleteUser })).toBe("not-configured");
    expect(await performDeletion({ ...base, secretKey: () => { throw new Error("missing"); }, userId: "u1", deleteUser })).toBe("not-configured");
    expect(deleteUser).not.toHaveBeenCalled();
  });
  it("deletes only the verified user id, once", async () => {
    const deleteUser = ok();
    expect(await performDeletion({ ...base, userId: "u1", typed: " DELETE ", deleteUser })).toBe("deleted");
    expect(deleteUser).toHaveBeenCalledExactlyOnceWith("u1", "sb_secret_real");
  });
  it("reports a failed deletion", async () => {
    expect(await performDeletion({ ...base, userId: "u1", deleteUser: async () => ({ error: new Error("x") }) })).toBe("failed");
  });
});

describe("profileSchema", () => {
  it("trims, clears a blank name and accepts a real zone", () => {
    expect(profileSchema.parse({ display_name: "  Sam  ", time_zone: "Asia/Hong_Kong" })).toEqual({ display_name: "Sam", time_zone: "Asia/Hong_Kong" });
    expect(profileSchema.parse({ display_name: "   ", time_zone: "UTC" }).display_name).toBeNull();
  });
  it("rejects an unknown zone and an over-long name", () => {
    expect(profileSchema.safeParse({ display_name: "", time_zone: "Mars/Olympus" }).success).toBe(false);
    expect(profileSchema.safeParse({ display_name: "x".repeat(81), time_zone: "UTC" }).success).toBe(false);
  });
});
