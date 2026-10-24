"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/auth/actions";
import { Alert, Field, primaryButton } from "@/components/ui";

export type FieldSpec = {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  hint?: string;
};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? pendingLabel : label}
    </button>
  );
}

const initial: FormState = { status: "idle" };

/**
 * One form shell for every auth page. Errors are linked to their inputs and the first problem receives focus;
 * a finished form (e.g. "check your email") replaces the fields with a status message.
 */
export function AuthForm({
  action,
  fields,
  submitLabel,
  pendingLabel,
  children,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  fields: FieldSpec[];
  submitLabel: string;
  pendingLabel: string;
  /** Extra form content, e.g. a hidden input; rendered inside the <form>. */
  children?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (firstInvalid ?? alertRef.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={alertRef}>
        <Alert tone="success">{state.message}</Alert>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-5" aria-describedby={state.message ? "form-message" : undefined}>
      {children}
      {state.status === "error" && state.message && (
        <div ref={alertRef}>
          <Alert tone="error" id="form-message">{state.message}</Alert>
        </div>
      )}
      {fields.map((f) => (
        <Field
          key={f.name}
          id={f.name}
          name={f.name}
          label={f.label}
          type={f.type}
          autoComplete={f.autoComplete}
          hint={f.hint}
          defaultValue={f.type === "email" ? state.email : undefined}
          error={state.fieldErrors?.[f.name]}
        />
      ))}
      <Submit label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
