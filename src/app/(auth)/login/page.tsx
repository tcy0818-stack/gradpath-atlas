import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { NextInput, UrlNotice } from "@/components/auth/search-param-bits";
import { standaloneLink, textLink } from "@/components/ui";
import { signInAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Sign in</h1>
      <Suspense fallback={null}>
        <div className="mb-5 empty:hidden">
          <UrlNotice />
        </div>
      </Suspense>
      <AuthForm
        action={signInAction}
        submitLabel="Sign in"
        pendingLabel="Signing in…"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      >
        <Suspense fallback={null}>
          <NextInput />
        </Suspense>
      </AuthForm>
      <div className="mt-4 text-sm text-ink-2">
        <p>
          <Link href="/forgot-password" className={standaloneLink}>Forgot your password?</Link>
        </p>
        <p className="flex min-h-11 flex-wrap items-center gap-x-1.5">
          New here? <Link href="/signup" className={textLink}>Create an account</Link>
        </p>
      </div>
    </>
  );
}
