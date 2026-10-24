import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { resetPasswordAction } from "@/lib/auth/actions";
import { getUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Choose a new password" };

// Reachable only with the session that an emailed reset link creates.
async function ResetForm() {
  if (!(await getUser())) redirect("/forgot-password?error=expired");
  return (
    <AuthForm
      action={resetPasswordAction}
      submitLabel="Update password"
      pendingLabel="Updating…"
      fields={[
        { name: "password", label: "New password", type: "password", autoComplete: "new-password", hint: "At least 8 characters." },
        { name: "confirm", label: "Confirm new password", type: "password", autoComplete: "new-password" },
      ]}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <Suspense fallback={<p role="status" className="text-sm text-muted">Checking your reset link…</p>}>
        <ResetForm />
      </Suspense>
    </>
  );
}
