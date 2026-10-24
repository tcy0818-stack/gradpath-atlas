"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/auth/actions";
import { Alert, quietButton } from "@/components/ui";

const initial: FormState = { status: "idle" };

function Submit({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * A small form wired to a Server Action. The outcome ("Saved." or the reason it was rejected) is announced in a
 * live region next to the button, and a rejection moves focus to the message so keyboard users notice it.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  submitClassName = quietButton,
  className = "space-y-4",
  extra,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  /** Either static fields, or a function that receives the last result (field errors and echoed values). */
  children: ReactNode | ((state: FormState) => ReactNode);
  submitLabel?: string;
  pendingLabel?: string;
  submitClassName?: string;
  className?: string;
  /** Rendered after the submit button, still inside the form row (for example a delete button). */
  extra?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, initial);
  const msg = useRef<HTMLDivElement>(null);
  // React clears uncontrolled inputs after every action. Remounting the fields on each result lets them start from
  // the echoed values (after a rejection) or from fresh server data (after a save).
  const [seen, setSeen] = useState(state);
  const [round, setRound] = useState(0);
  if (seen !== state) {
    setSeen(state);
    setRound((n) => n + 1);
  }
  useEffect(() => {
    if (state.status === "error") msg.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
  }, [state]);

  return (
    <form action={formAction} noValidate className={className}>
      <div key={round} className={className}>
        {typeof children === "function" ? children(state) : children}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Submit label={submitLabel} pendingLabel={pendingLabel} className={submitClassName} />
        {extra}
      </div>
      <div ref={msg} aria-live="polite">
        {state.message && state.status !== "idle" && <Alert tone={state.status === "error" ? "error" : "success"}>{state.message}</Alert>}
      </div>
    </form>
  );
}
