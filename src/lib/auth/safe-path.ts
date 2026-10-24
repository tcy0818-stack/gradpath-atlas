/** Returns `raw` only if it is a same-site relative path; otherwise null (open-redirect guard, AUTH-04). */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512) return null;
  // Must start with a single "/", never "//" (protocol-relative) or "/\" (browsers treat \ as /).
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  // No control characters, backslashes or encoded slashes/backslashes that could hide a host.
  if (/[\u0000-\u001f\u007f\\]/.test(raw) || /%(2f|5c|0a|0d|00)/i.test(raw)) return null;
  // Round-trip through URL: the result must stay on a dummy origin.
  try {
    const u = new URL(raw, "http://local.invalid");
    if (u.origin !== "http://local.invalid") return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}
