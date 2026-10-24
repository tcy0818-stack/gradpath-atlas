import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { publicEnv, serverSecretKey } from "./env";

const ok = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

describe("env validation", () => {
  it("returns values when all are set", () => {
    expect(publicEnv(ok).supabaseUrl).toBe("https://abc.supabase.co");
  });

  it("names every missing variable in one message", () => {
    expect(() => publicEnv({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL is missing; NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing/,
    );
  });

  it("rejects blank and non-URL values", () => {
    expect(() => publicEnv({ ...ok, NEXT_PUBLIC_SUPABASE_URL: "  " })).toThrow(/NEXT_PUBLIC_SUPABASE_URL is missing/);
    expect(() => publicEnv({ ...ok, NEXT_PUBLIC_SITE_URL: "not a url" })).toThrow(/not a valid URL/);
  });

  it("does not echo secret values in errors", () => {
    expect(() => serverSecretKey({})).toThrow(/SUPABASE_SECRET_KEY is missing/);
    expect(() => publicEnv({ ...ok, NEXT_PUBLIC_SITE_URL: "bad-value-123" })).not.toThrow(/bad-value-123/);
  });
});

describe("secret key isolation", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });
  const files = walk("src").filter((f) => !f.endsWith(".test.ts"));

  it("is referenced only in src/lib/env.ts", () => {
    const users = files.filter((f) => readFileSync(f, "utf8").includes("SUPABASE_SECRET_KEY"));
    expect(users.map((f) => f.replaceAll("\\", "/"))).toEqual(["src/lib/env.ts"]);
  });

  it("is never exposed as NEXT_PUBLIC_", () => {
    expect(files.some((f) => /NEXT_PUBLIC_[A-Z_]*SECRET/.test(readFileSync(f, "utf8")))).toBe(false);
  });
});
