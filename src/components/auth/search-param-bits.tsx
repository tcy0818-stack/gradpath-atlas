"use client";

import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui";
import { MESSAGES } from "@/lib/auth/error-map";
import { safeNextPath } from "@/lib/auth/safe-path";

// Read from the URL in the browser so the form itself can be prerendered. Only fixed codes are mapped to text;
// arbitrary query text is never rendered. Wrap each in <Suspense fallback={null}>.
const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  "password-updated": { tone: "success", text: "Your password was updated. Sign in with the new password." },
  "link-invalid": { tone: "error", text: "That email link is not valid. Request a new one or sign in." },
  "link-expired": { tone: "error", text: MESSAGES.linkExpired },
  expired: { tone: "error", text: MESSAGES.linkExpired },
};

export function UrlNotice() {
  const sp = useSearchParams();
  const notice = NOTICES[sp.get("notice") ?? ""] ?? NOTICES[sp.get("error") ?? ""];
  if (!notice) return null;
  return <Alert tone={notice.tone}>{notice.text}</Alert>;
}

/** Carries a validated post-login destination; the server action validates it again. */
export function NextInput() {
  const next = safeNextPath(useSearchParams().get("next"));
  return next ? <input type="hidden" name="next" value={next} /> : null;
}
