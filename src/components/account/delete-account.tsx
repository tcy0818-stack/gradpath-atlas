"use client";

import { useRef } from "react";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { deleteAccountAction } from "@/lib/account/actions";
import { DELETE_PHRASE } from "@/lib/account/delete";

/** Opens a native <dialog> (focus is trapped, Esc closes) that says what is lost and needs the word DELETE typed. */
export function DeleteAccount() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => {
          dialog.current?.showModal();
          dialog.current?.querySelector<HTMLInputElement>("#confirm")?.focus(); // start at the field, not the export link
        }} className="inline-flex min-h-11 items-center rounded-lg border border-danger bg-surface px-3.5 py-2 text-sm font-semibold text-danger hover:bg-danger-tint">
        Delete my account…
      </button>
      <dialog ref={dialog} aria-labelledby="delete-account-title" className="m-auto w-[min(34rem,calc(100%-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-black/40">
        <h2 id="delete-account-title" className="text-lg font-semibold">Delete your account?</h2>
        <div className="mt-3 space-y-2 text-ink-2">
          <p>This permanently deletes your sign-in and everything you recorded: programmes, requirements, document records, tasks, deadlines and settings. It cannot be undone.</p>
          <p>
            Want to keep a copy? <a className="font-medium text-accent underline underline-offset-4" href="/api/export/workspace" download>Download your data (JSON)</a> first, then come back.
          </p>
        </div>
        <div className="mt-4">
          <ActionForm
            action={deleteAccountAction}
            submitLabel="Delete my account permanently"
            pendingLabel="Deleting…"
            submitClassName="inline-flex min-h-11 items-center rounded-lg bg-danger px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            extra={
              <button type="button" onClick={() => dialog.current?.close()} className="inline-flex min-h-11 items-center rounded-lg border border-control bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-accent-tint">
                Keep my account
              </button>
            }
          >
            <Field id="confirm" name="confirm" label={`Type ${DELETE_PHRASE} to confirm`} autoComplete="off" />
          </ActionForm>
        </div>
      </dialog>
    </>
  );
}
