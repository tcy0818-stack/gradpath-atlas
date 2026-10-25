import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDelete } from "@/components/planning/confirm-delete";
import { DueLabel, Pill } from "@/components/planning/due-label";
import { PageHeader, Section } from "@/components/page-header";
import { TaskForm } from "@/components/planning/task-form";
import { Alert, textLink } from "@/components/ui";
import { deleteTaskAction, updateTaskAction } from "@/lib/planning/actions";
import { getTask, listProgrammeRefs, listTasks, todayForUser } from "@/lib/planning/queries";
import { TASK_STATUS_LABELS, decorate, wouldCreateCycle } from "@/lib/tasks";

export const metadata: Metadata = { title: "Task" };

const NOTICES: Record<string, string> = { "delete-failed": "The task could not be deleted. Nothing was removed; try again." };

export default async function TaskPage({ params, searchParams }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [task, tasks, programmes, today] = await Promise.all([getTask(id), listTasks(), listProgrammeRefs(), todayForUser()]);
  const view = decorate(tasks, today).find((t) => t.id === task.id)!;
  // Not itself, and not anything that already depends on it (it would loop).
  const candidates = tasks.filter((t) => t.id !== task.id && !wouldCreateCycle(tasks, task.id, t.id));
  const dependents = tasks.filter((t) => t.prerequisite_task_id === task.id);
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];

  return (
    <div className="space-y-8">
      <PageHeader
        back={<Link href="/tasks" className={textLink}>Back to tasks</Link>}
        title={task.title}
        lede={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><Pill tone={task.status === "done" ? "ok" : "neutral"}>{TASK_STATUS_LABELS[task.status]}</Pill>{view.blocked && <Pill tone="danger">Blocked</Pill>}<span>Due: <DueLabel date={task.due_date} due={view.due} muted={task.status === "done"} /></span>{view.waitingOn && <span>Waiting on: {view.waitingOn.title}</span>}</span>}
      />
      {notice && <Alert tone="error">{notice}</Alert>}

      <div className="max-w-3xl space-y-10">
        <Section id="details-h" title="Details">
          <TaskForm mode="edit" action={updateTaskAction} programmes={programmes} candidates={candidates} defaults={task} />
        </Section>

        {dependents.length > 0 && (
          <Section id="dep-h" title="Waiting on this task">
            <ul className="list-disc space-y-1 pl-5 text-ink-2">
              {dependents.map((d) => <li key={d.id}><Link href={`/tasks/${d.id}`} className={textLink}>{d.title}</Link></li>)}
            </ul>
          </Section>
        )}

        <Section id="danger-h" title="Delete task" hint="Removes this task only. Programmes and documents are not affected.">
          <ConfirmDelete id={task.id} title={`Delete “${task.title}”?`} buttonLabel="Delete task…" keepLabel="Keep task" action={deleteTaskAction}>
            <p>This cannot be undone.</p>
            {dependents.length === 0 ? (
              <p>No other task is waiting on it.</p>
            ) : (
              <>
                <p>{dependents.length === 1 ? "This task is" : `These ${dependents.length} tasks are`} waiting on it and will no longer be blocked:</p>
                <ul className="list-disc space-y-1 pl-5">{dependents.map((d) => <li key={d.id}>{d.title}</li>)}</ul>
              </>
            )}
          </ConfirmDelete>
        </Section>
      </div>
    </div>
  );
}
