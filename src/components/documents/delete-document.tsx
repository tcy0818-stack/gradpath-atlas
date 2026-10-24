"use client";

import { useRef } from "react";
import { deleteDocumentAction } from "@/lib/documents/actions";

/** Delete with a confirmation that names every requirement link it removes. The programmes themselves stay. */
export function DeleteDocument({ id, title, usage }: { id: string; title: string; usage: { programmeName: string; requirementLabel: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="inline-flex min-h-11 items-center rounded-lg border border-danger bg-surface px-3.5 py-2 text-sm font-semibold text-danger hover:bg-danger-tint">
        Delete document…
      </button>
      <dialog ref={dialog} aria-labelledby="delete-doc-title" className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-black/40">
        <h2 id="delete-doc-title" className="text-lg font-semibold">Delete “{title}”?</h2>
        <p className="mt-3 text-ink-2">This cannot be undone.</p>
        {usage.length === 0 ? (
          <p className="mt-2 text-ink-2">It is not linked to any requirement, so nothing else changes.</p>
        ) : (
          <>
            <p className="mt-2 text-ink-2">It will be unlinked from {usage.length === 1 ? "this requirement" : `these ${usage.length} requirements`}, which may lower their readiness:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
              {usage.map((u, i) => <li key={i}>{u.requirementLabel} for {u.programmeName}</li>)}
            </ul>
          </>
        )}
        <p className="mt-3 text-ink-2">The programmes and requirements themselves are kept.</p>
        <form action={deleteDocumentAction} className="mt-6 flex flex-wrap justify-end gap-3">
          <input type="hidden" name="id" value={id} />
          <button type="button" onClick={() => dialog.current?.close()} className="inline-flex min-h-11 items-center rounded-lg border border-control bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-accent-tint">
            Keep document
          </button>
          <button type="submit" className="inline-flex min-h-11 items-center rounded-lg bg-danger px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90">
            Delete permanently
          </button>
        </form>
      </dialog>
    </>
  );
}
