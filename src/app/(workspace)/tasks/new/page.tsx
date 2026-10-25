import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/planning/task-form";
import { textLink } from "@/components/ui";
import { createTaskAction } from "@/lib/planning/actions";
import { listProgrammeRefs, listTasks } from "@/lib/planning/queries";

export const metadata: Metadata = { title: "Add task" };

export default async function NewTaskPage({ searchParams }: PageProps<"/tasks/new">) {
  const sp = await searchParams;
  const programme = Array.isArray(sp.programme) ? sp.programme[0] : sp.programme;
  const [programmes, tasks] = await Promise.all([listProgrammeRefs(), listTasks()]);
  return (
    <>
      <PageHeader back={<Link href="/tasks" className={textLink}>Back to tasks</Link>} title="Add a task" />
      <div className="mt-8 max-w-3xl rounded-xl border border-line bg-surface p-5 shadow-panel sm:p-6">
        <TaskForm mode="create" action={createTaskAction} programmes={programmes} candidates={tasks} defaults={{ programme_id: programmes.some((p) => p.id === programme) ? programme : null }} />
      </div>
    </>
  );
}
