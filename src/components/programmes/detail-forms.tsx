"use client";

import { useRef } from "react";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { deleteProgrammeAction, saveNotesAction, setStatusAction } from "@/lib/programmes/actions";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/programmes/types";

const statusOptions = STATUSES.map((v) => ({ value: v, label: STATUS_LABELS[v] }));

export function StatusForm({ id, status }: { id: string; status: Status }) {
  return (
    <ActionForm action={setStatusAction} submitLabel="Update status" className="flex flex-wrap items-end gap-3">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <div className="min-w-[14rem]">
            <Field id="status" name="status" label="Application status" options={statusOptions} defaultValue={status} />
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function NotesForm({ id, notes }: { id: string; notes: string | null }) {
  return (
    <ActionForm action={saveNotesAction} submitLabel="Save notes">
      {(state) => (
        <>
          <input type="hidden" name="id" value={id} />
          <Field id="notes" name="notes" label="Notes about this programme" required={false} rows={5} maxLength={5000} defaultValue={(state.status === "error" ? state.values?.notes : undefined) ?? notes ?? ""} />
        </>
      )}
    </ActionForm>
  );
}

export type Impact = { requirements: number; deadlines: number; tasks: number; documentLinks: number };
const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

/** Delete with an explicit confirmation that says what goes and what stays (PRG-04). Native <dialog> traps focus. */
export function DeleteProgramme({ id, name, impact }: { id: string; name: string; impact: Impact }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="inline-flex min-h-11 items-center rounded-lg border border-danger bg-surface px-3.5 py-2 text-sm font-semibold text-danger hover:bg-danger-tint">
        Delete programme…
      </button>
      <dialog ref={dialog} aria-labelledby="delete-title" className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-black/40">
        <h2 id="delete-title" className="text-lg font-semibold">Delete “{name}”?</h2>
        <p className="mt-3 text-ink-2">This cannot be undone. Deleting the programme also removes:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
          <li>{plural(impact.requirements, "requirement")}</li>
          <li>{plural(impact.deadlines, "deadline")}</li>
          <li>{plural(impact.tasks, "task")} attached to it</li>
          <li>{plural(impact.documentLinks, "document link")} (the links only)</li>
        </ul>
        <p className="mt-3 text-ink-2">Your reusable documents are not deleted and stay linked to your other programmes.</p>
        <form action={deleteProgrammeAction} className="mt-6 flex flex-wrap justify-end gap-3">
          <input type="hidden" name="id" value={id} />
          <button type="button" onClick={() => dialog.current?.close()} className="inline-flex min-h-11 items-center rounded-lg border border-control bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-accent-tint">
            Keep programme
          </button>
          <button type="submit" className="inline-flex min-h-11 items-center rounded-lg bg-danger px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90">
            Delete permanently
          </button>
        </form>
      </dialog>
    </>
  );
}
