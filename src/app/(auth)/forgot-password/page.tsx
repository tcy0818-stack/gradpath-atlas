import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { UrlNotice } from "@/components/auth/search-param-bits";
import { standaloneLink } from "@/components/ui";
import { forgotPasswordAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mb-6 text-sm text-ink-2">Enter your account email and we&apos;ll send you a link to choose a new password.</p>
      <Suspense fallback={null}>
        <div className="mb-5 empty:hidden">
          <UrlNotice />
        </div>
      </Suspense>
      <AuthForm
        action={forgotPasswordAction}
        submitLabel="Send reset link"
        pendingLabel="Sending…"
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
      />
      <p className="mt-4 text-sm text-ink-2">
        <Link href="/login" className={standaloneLink}>Back to sign in</Link>
      </p>
    </>
  );
}
