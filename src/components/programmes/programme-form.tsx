"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Field, primaryButton } from "@/components/ui";
import type { FormState } from "@/lib/auth/actions";
import { STATUSES, STATUS_LABELS, TUITION_STATES, TUITION_STATE_LABELS, type Programme, type TuitionState } from "@/lib/programmes/types";

type Defaults = Partial<Programme> & { submission_deadline?: string | null };
type Props = {
  mode: "create" | "edit";
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaults?: Defaults;
};

const tuitionOptions = TUITION_STATES.map((v) => ({ value: v, label: TUITION_STATE_LABELS[v] }));
const statusOptions = STATUSES.map((v) => ({ value: v, label: STATUS_LABELS[v] }));
const CURRENCIES = ["GBP", "EUR", "USD", "HKD", "AUD", "CAD", "SGD", "CHF"];

/**
 * Programme details. Tuition is a three-way choice so that "unknown" and "not applicable" are real answers and a
 * blank amount can never be mistaken for 0 (PRG-03); the amount and currency are only editable when it is known.
 */
export function ProgrammeForm({ mode, action, defaults = {} }: Props) {
  return (
    <ActionForm action={action} submitLabel={mode === "create" ? "Add programme" : "Save details"} submitClassName={primaryButton + " sm:!w-auto"}>
      {(state) => <Fields mode={mode} defaults={defaults} state={state} />}
    </ActionForm>
  );
}

function Fields({ mode, defaults, state }: { mode: Props["mode"]; defaults: Defaults; state: FormState }) {
  // After a rejected save, show what the user typed rather than the stored values.
  const echoed = state.status === "error" ? state.values : undefined;
  const val = (name: string, fallback: unknown) => echoed?.[name] ?? (fallback == null ? "" : String(fallback));
  const errors = state.fieldErrors ?? {};
  const [tuition, setTuition] = useState<TuitionState>((val("tuition_state", defaults.tuition_state ?? "unknown") as TuitionState) || "unknown");
  const known = tuition === "known";

  return (
    <>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="university_name" name="university_name" label="University" defaultValue={val("university_name", defaults.university_name)} error={errors.university_name} maxLength={120} />
        <Field id="programme_name" name="programme_name" label="Programme" defaultValue={val("programme_name", defaults.programme_name)} error={errors.programme_name} maxLength={160} />
        <Field id="country_region" name="country_region" label="Country or region" required={false} defaultValue={val("country_region", defaults.country_region)} error={errors.country_region} maxLength={80} />
        <Field id="subject" name="subject" label="Subject" required={false} defaultValue={val("subject", defaults.subject)} error={errors.subject} maxLength={80} />
        <Field id="intake_label" name="intake_label" label="Intake" required={false} hint="For example Sep 2027. Leave blank if unknown." defaultValue={val("intake_label", defaults.intake_label)} error={errors.intake_label} maxLength={40} />
        <Field id="duration_months" name="duration_months" label="Duration in months" required={false} type="number" inputMode="numeric" min={1} max={120} step={1} hint="Leave blank if unknown." defaultValue={val("duration_months", defaults.duration_months)} error={errors.duration_months} />
      </div>

      <fieldset className="rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Tuition</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="tuition_state" name="tuition_state" label="Tuition is" options={tuitionOptions} defaultValue={tuition} error={errors.tuition_state} onChange={(v) => setTuition(v as TuitionState)} />
          <Field id="tuition_amount" name="tuition_amount" label="Amount" type="number" inputMode="decimal" min={0} step="0.01" required={known} disabled={!known} defaultValue={val("tuition_amount", defaults.tuition_amount)} error={errors.tuition_amount} />
          <div>
            <Field id="tuition_currency" name="tuition_currency" label="Currency (3 letters)" list="currencies" required={known} disabled={!known} maxLength={3} defaultValue={val("tuition_currency", defaults.tuition_currency)} error={errors.tuition_currency} />
            <datalist id="currencies">{CURRENCIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">Amount and currency apply only when tuition is known. Amounts in different currencies are never converted or compared as equal.</p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="submission_deadline" name="submission_deadline" label="Application deadline" type="date" required={false} hint="Leave blank if unknown." defaultValue={val("submission_deadline", defaults.submission_deadline)} error={errors.submission_deadline} />
        {mode === "create" && <Field id="status" name="status" label="Application status" options={statusOptions} defaultValue={val("status", "researching")} error={errors.status} />}
      </div>
      {mode === "create" && <Field id="notes" name="notes" label="Notes" required={false} rows={4} maxLength={5000} defaultValue={val("notes", "")} error={errors.notes} />}
    </>
  );
}
