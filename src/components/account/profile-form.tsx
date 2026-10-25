"use client";

import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { saveProfileAction } from "@/lib/account/actions";

/** A client component because ActionForm's render-function children cannot be passed down from a Server Component. */
export function ProfileForm({ displayName, timeZone, zones }: { displayName: string | null; timeZone: string; zones: string[] }) {
  return (
    <ActionForm action={saveProfileAction} submitLabel="Save settings">
      {(state) => (
        <>
          <Field id="display_name" name="display_name" label="Display name" required={false} maxLength={80} autoComplete="nickname" defaultValue={state.values?.display_name ?? displayName ?? ""} error={state.fieldErrors?.display_name} />
          <Field id="time_zone" name="time_zone" label="Time zone" defaultValue={state.values?.time_zone ?? timeZone} options={zones.map((z) => ({ value: z, label: z.replaceAll("_", " ") }))} error={state.fieldErrors?.time_zone} />
        </>
      )}
    </ActionForm>
  );
}
