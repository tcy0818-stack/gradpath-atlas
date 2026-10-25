"use client";

import { useRef, type ReactNode } from "react";

/** Delete button that opens a native <dialog> (traps focus) saying exactly what will happen before anything is removed. */
export function ConfirmDelete({ id, title, buttonLabel, keepLabel, confirmLabel = "Delete permanently", action, children }: {
  id: string;
  title: string;
  buttonLabel: string;
  keepLabel: string;
  /** Text of the button that carries out the action; defaults to "Delete permanently". */
  confirmLabel?: string;
  action: (fd: FormData) => Promise<void>;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="inline-flex min-h-11 items-center rounded-lg border border-danger bg-surface px-3.5 py-2 text-sm font-semibold text-danger hover:bg-danger-tint">
        {buttonLabel}
      </button>
      <dialog ref={dialog} aria-labelledby={`confirm-${id}`} className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-black/40">
        <h2 id={`confirm-${id}`} className="text-lg font-semibold">{title}</h2>
        <div className="mt-3 space-y-2 text-ink-2">{children}</div>
        <form action={action} className="mt-6 flex flex-wrap justify-end gap-3">
          <input type="hidden" name="id" value={id} />
          <button type="button" onClick={() => dialog.current?.close()} className="inline-flex min-h-11 items-center rounded-lg border border-control bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-accent-tint">
            {keepLabel}
          </button>
          <button type="submit" className="inline-flex min-h-11 items-center rounded-lg bg-danger px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90">
            {confirmLabel}
          </button>
        </form>
      </dialog>
    </>
  );
}
