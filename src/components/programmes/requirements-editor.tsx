"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { addRequirementAction, deleteRequirementAction, updateRequirementAction } from "@/lib/programmes/actions";
import { LEVELS, LEVEL_LABELS, REQUIREMENT_LABELS, REQUIREMENT_TYPES, type Requirement, type RequirementType } from "@/lib/programmes/types";

const levelOptions = LEVELS.map((v) => ({ value: v, label: LEVEL_LABELS[v] }));
const dangerButton =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-danger bg-surface px-3.5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger-tint";

function Row({ r }: { r: Requirement }) {
  const isRefs = r.requirement_type === "references";
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <ActionForm
        action={updateRequirementAction}
        submitLabel="Save"
        className="space-y-3"
        extra={
          // Same form: a second submit button that runs the delete action instead of the save action.
          <button type="submit" formAction={deleteRequirementAction} formNoValidate className={dangerButton}>
            Remove
          </button>
        }
      >
        {(state) => {
          const echoed = state.status === "error" ? state.values : undefined;
          const e = state.fieldErrors ?? {};
          return (
            <>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="requirement_type" value={r.requirement_type} />
              <h3 className="font-semibold">{REQUIREMENT_LABELS[r.requirement_type]}</h3>
              <div className="grid gap-3 sm:grid-cols-[12rem_1fr_8rem]">
                <Field id={`level-${r.id}`} name="level" label="Level" options={levelOptions} defaultValue={echoed?.level ?? r.level} error={e.level} />
                <Field id={`detail-${r.id}`} name="detail" label="Detail" required={false} maxLength={500} defaultValue={echoed?.detail ?? r.detail ?? ""} error={e.detail} />
                {isRefs ? (
                  <Field id={`qty-${r.id}`} name="quantity" label="How many" type="number" inputMode="numeric" min={1} max={10} step={1} defaultValue={echoed?.quantity ?? String(r.quantity)} error={e.quantity} />
                ) : (
                  <input type="hidden" name="quantity" value="1" />
                )}
              </div>
            </>
          );
        }}
      </ActionForm>
    </li>
  );
}

export function RequirementsEditor({ programmeId, requirements }: { programmeId: string; requirements: Requirement[] }) {
  const used = new Set(requirements.map((r) => r.requirement_type));
  const addable = REQUIREMENT_TYPES.filter((t) => t === "other" || !used.has(t));
  const [type, setType] = useState<RequirementType | "">(addable[0] ?? "");

  return (
    <div className="space-y-4">
      <p className="max-w-[65ch] text-sm text-ink-2">
        <strong>Unknown</strong> means you have not checked yet. <strong>Not applicable</strong> means the programme does not ask for it.
        Linking documents and checking readiness come in a later step.
      </p>
      {requirements.length === 0 ? (
        <p className="rounded-lg border border-dashed border-control p-4 text-ink-2">No requirements recorded yet. Add the first one below.</p>
      ) : (
        <ul className="space-y-3">
          {requirements.map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </ul>
      )}

      {addable.length > 0 && (
        <section aria-labelledby="add-req" className="rounded-lg border border-line bg-info-tint p-4">
          <h3 id="add-req" className="font-semibold">Add a requirement</h3>
          <ActionForm action={addRequirementAction} submitLabel="Add requirement" pendingLabel="Adding…" className="mt-3 space-y-3">
            {(state) => {
              const echoed = state.status === "error" ? state.values : undefined;
              const e = state.fieldErrors ?? {};
              return (
                <>
                  <input type="hidden" name="programme_id" value={programmeId} />
                  <div className="grid gap-3 sm:grid-cols-[14rem_12rem_1fr]">
                    <Field id="new-type" name="requirement_type" label="Type" options={addable.map((t) => ({ value: t, label: REQUIREMENT_LABELS[t] }))} defaultValue={echoed?.requirement_type ?? type} error={e.requirement_type} onChange={(v) => setType(v as RequirementType)} />
                    <Field id="new-level" name="level" label="Level" options={levelOptions} defaultValue={echoed?.level ?? "unknown"} error={e.level} />
                    <Field id="new-detail" name="detail" label="Detail" required={false} maxLength={500} hint="For example IELTS 6.5 or 2:1 degree." defaultValue={echoed?.detail ?? ""} error={e.detail} />
                  </div>
                  {type === "references" ? (
                    <div className="max-w-[8rem]">
                      <Field id="new-qty" name="quantity" label="How many" type="number" inputMode="numeric" min={1} max={10} step={1} defaultValue={echoed?.quantity ?? "2"} error={e.quantity} />
                    </div>
                  ) : (
                    <input type="hidden" name="quantity" value="1" />
                  )}
                </>
              );
            }}
          </ActionForm>
        </section>
      )}
    </div>
  );
}
