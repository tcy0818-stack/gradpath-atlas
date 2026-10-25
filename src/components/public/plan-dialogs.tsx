"use client";

import { useRef, type ReactNode } from "react";
import { ActionForm } from "@/components/action-form";
import { quietButton, primaryButton } from "@/components/ui";
import { selectPlanAction } from "@/lib/plans/actions";

const dialogClass = "m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-black/40";

/** Test-only plan switch (PUB-03). A native <dialog> traps focus, closes on Esc and returns focus to the button. */
export function PlanDialog({ plan, buttonLabel, title, primary = false, children }: { plan: "free" | "season_pass"; buttonLabel: string; title: string; primary?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = `plan-${plan}`;
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={primary ? `${primaryButton} !w-auto` : quietButton}>{buttonLabel}</button>
      <dialog ref={ref} aria-labelledby={`${id}-title`} className={dialogClass}>
        <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
        <p className="mt-3 rounded-lg border border-line bg-info-tint px-3.5 py-3 text-sm font-semibold text-ink">Simulation — no payment taken</p>
        <div className="mt-3 space-y-2 text-ink-2">{children}</div>
        <div className="mt-4">
          <ActionForm
            action={selectPlanAction}
            submitLabel="Confirm simulated selection"
            pendingLabel="Saving…"
            submitClassName={`${primaryButton} !w-auto`}
            extra={<button type="button" onClick={() => ref.current?.close()} className={quietButton}>Close</button>}
          >
            <input type="hidden" name="plan" value={plan} />
          </ActionForm>
        </div>
      </dialog>
    </>
  );
}

/** Licence enquiry prototype (PUB-04): collects and sends nothing. */
export function LicenceEnquiry() {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={quietButton}>Enquire about a licence</button>
      <dialog ref={ref} aria-labelledby="licence-title" className={dialogClass}>
        <h2 id="licence-title" className="text-lg font-semibold">Licence enquiry (prototype)</h2>
        <p className="mt-3 rounded-lg border border-line bg-info-tint px-3.5 py-3 text-sm font-semibold text-ink">Simulation — nothing is collected or sent</p>
        <div className="mt-3 space-y-2 text-ink-2">
          <p>In a real product this is where an adviser or university would ask about seats. This prototype has no form, no contact address and no mailbox, so nothing you do here goes anywhere.</p>
          <p>Cohort support and shared adviser access are planned features that are not built.</p>
        </div>
        <div className="mt-4 flex justify-end"><button type="button" onClick={() => ref.current?.close()} className={quietButton}>Close</button></div>
      </dialog>
    </>
  );
}
