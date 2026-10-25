import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { textLink } from "@/components/ui";
import { signUpAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Create your account</h1>
      <AuthForm
        action={signUpAction}
        submitLabel="Create account"
        pendingLabel="Creating account…"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 8 characters." },
          { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
      />
      <section aria-labelledby="privacy-heading" className="mt-5 rounded-lg border border-line bg-info-tint px-3.5 py-3 text-sm text-ink-2">
        <h2 id="privacy-heading" className="font-semibold text-ink">What we store</h2>
        <p className="mt-1">
          Your email address and the planning details you enter, only to run this planner. There is no advertising or
          analytics tracking; the only cookies keep you signed in. This is a coursework prototype, so please don&apos;t
          enter sensitive personal data. You can export your data and delete your account from Settings.
          Read the <Link href="/privacy" className={textLink}>privacy and cookie notice</Link>.
        </p>
      </section>
      <p className="mt-4 flex min-h-11 flex-wrap items-center gap-x-1.5 text-sm text-ink-2">
        Already have an account? <Link href="/login" className={textLink}>Sign in</Link>
      </p>
    </>
  );
}
