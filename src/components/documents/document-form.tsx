"use client";

import { ActionForm } from "@/components/action-form";
import { Field, primaryButton } from "@/components/ui";
import type { FormState } from "@/lib/auth/actions";
import { DOC_TYPES, DOC_TYPE_LABELS, PREP_LABELS, PREP_STATUSES, type DocumentRow } from "@/lib/documents/types";

const typeOptions = DOC_TYPES.map((v) => ({ value: v, label: DOC_TYPE_LABELS[v] }));
const statusOptions = PREP_STATUSES.map((v) => ({ value: v, label: PREP_LABELS[v] }));

/** Document metadata only. There is deliberately no file input: files are not uploaded or stored (DOC-05). */
export function DocumentForm({ mode, action, defaults }: { mode: "create" | "edit"; action: (prev: FormState, fd: FormData) => Promise<FormState>; defaults?: Partial<DocumentRow> }) {
  return (
    <ActionForm action={action} submitLabel={mode === "create" ? "Add document" : "Save document"} submitClassName={primaryButton + " sm:!w-auto"}>
      {(state) => {
        const echoed = state.status === "error" ? state.values : undefined;
        const val = (name: keyof DocumentRow, fallback: string) => echoed?.[name] ?? (defaults?.[name] == null ? fallback : String(defaults[name]));
        const e = state.fieldErrors ?? {};
        return (
          <>
            {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
            <Field id="title" name="title" label="Title" hint="For example “Official transcript, BSc Economics”." defaultValue={val("title", "")} error={e.title} maxLength={160} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="doc_type" name="doc_type" label="Document type" options={typeOptions} defaultValue={val("doc_type", "transcript")} error={e.doc_type} />
              <Field id="prep_status" name="prep_status" label="Preparation status" options={statusOptions} defaultValue={val("prep_status", "not_started")} error={e.prep_status} />
              <Field id="expiry_date" name="expiry_date" label="Expiry date" type="date" required={false} hint="Last day it is valid." defaultValue={val("expiry_date", "")} error={e.expiry_date} />
            </div>
            <Field id="notes" name="notes" label="Notes" required={false} rows={4} maxLength={2000} defaultValue={val("notes", "")} error={e.notes} />
          </>
        );
      }}
    </ActionForm>
  );
}
