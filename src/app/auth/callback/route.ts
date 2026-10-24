import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/safe-path";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Landing point for email links (verification and password reset). Supports both shapes Supabase can send:
 * `?code=` (PKCE; the browser that asked must open the link) and `?token_hash=&type=` (works on any device,
 * needs the customised email templates in README). Failures redirect to /login with a fixed code, never raw text.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (params.get("error") || params.get("error_code")) redirect("/login?error=link-expired");

  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const next = safeNextPath(params.get("next")) ?? "/dashboard";

  const supabase = await createClient();
  let verified = false;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    verified = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    verified = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  if (!verified) redirect("/login?error=link-invalid");
  redirect(type === "recovery" ? "/reset-password" : next);
}
