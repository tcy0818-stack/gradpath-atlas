"use client";

import { ActionForm } from "@/components/action-form";
import { Field, primaryButton } from "@/components/ui";
import type { FormState } from "@/lib/auth/actions";
import type { ProgrammeRef } from "@/lib/deadlines";
import { PRIORITIES, PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS, type Task } from "@/lib/tasks";

const priorityOptions = PRIORITIES.map((v) => ({ value: v, label: PRIORITY_LABELS[v] }));
const statusOptions = TASK_STATUSES.map((v) => ({ value: v, label: TASK_STATUS_LABELS[v] }));

/**
 * `candidates` are the tasks that may be chosen as prerequisite: the server already left out the task itself and
 * everything that depends on it, so the list cannot offer a loop. The database refuses one regardless.
 */
export function TaskForm({ mode, action, defaults, programmes, candidates }: {
  mode: "create" | "edit";
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaults?: Partial<Task>;
  programmes: ProgrammeRef[];
  candidates: Pick<Task, "id" | "title" | "status">[];
}) {
  const programmeOptions = [{ value: "", label: "General (not tied to a programme)" }, ...programmes.map((p) => ({ value: p.id, label: `${p.programme_name}, ${p.university_name}` }))];
  const prereqOptions = [{ value: "", label: "None" }, ...candidates.map((t) => ({ value: t.id, label: t.status === "done" ? `${t.title} (done)` : t.title }))];
  return (
    <ActionForm action={action} submitLabel={mode === "create" ? "Add task" : "Save task"} submitClassName={primaryButton + " sm:!w-auto"}>
      {(state) => {
        const echoed = state.status === "error" ? state.values : undefined;
        const val = (name: keyof Task, fallback: string) => echoed?.[name] ?? (defaults?.[name] == null ? fallback : String(defaults[name]));
        const e = state.fieldErrors ?? {};
        return (
          <>
            {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
            <Field id="title" name="title" label="Task" defaultValue={val("title", "")} error={e.title} maxLength={160} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="programme_id" name="programme_id" label="Programme" options={programmeOptions} defaultValue={val("programme_id", "")} error={e.programme_id} />
              <Field id="due_date" name="due_date" label="Due date" type="date" required={false} hint="Leave blank for no date. Undated tasks sort last." defaultValue={val("due_date", "")} error={e.due_date} />
              <Field id="priority" name="priority" label="Priority" options={priorityOptions} defaultValue={val("priority", "medium")} error={e.priority} />
              <Field id="status" name="status" label="Status" options={statusOptions} defaultValue={val("status", "todo")} error={e.status} />
            </div>
            <Field id="prerequisite_task_id" name="prerequisite_task_id" label="Do this after" required={false} hint="Pick one task that must be done first. This task shows as Blocked until then." options={prereqOptions} defaultValue={val("prerequisite_task_id", "")} error={e.prerequisite_task_id} />
          </>
        );
      }}
    </ActionForm>
  );
}
