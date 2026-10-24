"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Field, primaryButton } from "@/components/ui";
import type { FormState } from "@/lib/auth/actions";
import { DEADLINE_TYPES, DEADLINE_TYPE_LABELS, type Deadline, type DeadlineType, type ProgrammeRef } from "@/lib/deadlines";

const typeOptions = DEADLINE_TYPES.map((v) => ({ value: v, label: DEADLINE_TYPE_LABELS[v] }));

export function DeadlineForm({ mode, action, defaults, programmes }: {
  mode: "create" | "edit";
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaults?: Partial<Deadline>;
  programmes: ProgrammeRef[];
}) {
  const [type, setType] = useState<DeadlineType>(defaults?.deadline_type ?? "milestone");
  const programmeOptions = [{ value: "", label: "General (not tied to a programme)" }, ...programmes.map((p) => ({ value: p.id, label: `${p.programme_name}, ${p.university_name}` }))];
  return (
    <ActionForm action={action} submitLabel={mode === "create" ? "Add deadline" : "Save deadline"} submitClassName={primaryButton + " sm:!w-auto"}>
      {(state) => {
        const echoed = state.status === "error" ? state.values : undefined;
        const val = (name: keyof Deadline, fallback: string) => echoed?.[name] ?? (defaults?.[name] == null ? fallback : String(defaults[name]));
        const e = state.fieldErrors ?? {};
        return (
          <>
            {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
            <Field id="title" name="title" label="Title" defaultValue={val("title", "")} error={e.title} maxLength={160} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="deadline_type" name="deadline_type" label="Type" options={typeOptions} defaultValue={type} error={e.deadline_type} onChange={(v) => setType(v as DeadlineType)} />
              <Field id="due_date" name="due_date" label="Date" type="date" defaultValue={val("due_date", defaults?.due_date ?? "")} error={e.due_date} />
              <Field id="programme_id" name="programme_id" label="Programme" required={type === "submission"} hint={type === "submission" ? "Each programme has one application deadline; it is the same date shown in the programme list and comparison." : undefined} options={programmeOptions} defaultValue={val("programme_id", "")} error={e.programme_id} />
            </div>
            {type === "submission" ? (
              <p className="max-w-[65ch] text-sm text-ink-2">An application deadline stops being outstanding when the programme is marked Submitted, Decision received or Withdrawn.</p>
            ) : (
              <label className="flex min-h-11 items-center gap-2 text-base">
                <input type="checkbox" name="is_done" defaultChecked={(echoed ? echoed.is_done === "on" : defaults?.is_done) ?? false} className="size-5 accent-[var(--accent)]" />
                Done (no longer outstanding)
              </label>
            )}
          </>
        );
      }}
    </ActionForm>
  );
}
