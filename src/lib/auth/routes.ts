// Route rules used by the request-layer proxy (AUTH-04). Kept pure so they can be unit-tested.
// Every authenticated area in PRD 3.1 is listed even if its page is not built yet, so an anonymous
// visitor is sent to /login rather than seeing a 404 that reveals nothing but also protects nothing later.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/programmes",
  "/compare",
  "/documents",
  "/tasks",
  "/deadlines",
  "/adviser",
  "/settings",
  "/api/export",
  "/api/account",
];

const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");

export type RouteDecision = "allow" | "to-login" | "to-dashboard" | "to-reset-request";

export function routeDecision(pathname: string, signedIn: boolean): RouteDecision {
  if (PROTECTED_PREFIXES.some((p) => matches(pathname, p))) return signedIn ? "allow" : "to-login";
  if (GUEST_ONLY.some((p) => matches(pathname, p))) return signedIn ? "to-dashboard" : "allow";
  // The reset form is only useful with the session an emailed link creates; the page re-checks it as well.
  if (matches(pathname, "/reset-password")) return signedIn ? "allow" : "to-reset-request";
  return "allow"; // /, /pricing, /privacy, /auth/*
}
