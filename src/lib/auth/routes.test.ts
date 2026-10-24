import { describe, expect, it } from "vitest";
import { routeDecision } from "./routes";

describe("routeDecision", () => {
  it("sends anonymous visitors from every protected area to login", () => {
    for (const p of ["/dashboard", "/programmes", "/programmes/new", "/programmes/123", "/compare", "/documents",
      "/tasks", "/deadlines", "/adviser", "/settings", "/api/export/csv", "/api/account/delete"]) {
      expect(routeDecision(p, false), p).toBe("to-login");
      expect(routeDecision(p, true), p).toBe("allow");
    }
  });

  it("does not treat lookalike prefixes as protected", () => {
    expect(routeDecision("/dashboards", false)).toBe("allow");
    expect(routeDecision("/tasksfoo", false)).toBe("allow");
  });

  it("keeps signed-in users off guest-only pages", () => {
    for (const p of ["/login", "/signup", "/forgot-password"]) {
      expect(routeDecision(p, true), p).toBe("to-dashboard");
      expect(routeDecision(p, false), p).toBe("allow");
    }
  });

  it("sends visitors without a session away from the reset form", () => {
    expect(routeDecision("/reset-password", false)).toBe("to-reset-request");
    expect(routeDecision("/reset-password", true)).toBe("allow");
  });

  it("leaves public and callback pages alone", () => {
    for (const p of ["/", "/pricing", "/privacy", "/auth/callback"]) {
      expect(routeDecision(p, false), p).toBe("allow");
      expect(routeDecision(p, true), p).toBe("allow");
    }
  });
});
