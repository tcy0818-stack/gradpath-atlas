import type { Metadata } from "next";
import Link from "next/link";
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
      <p className="text-sm"><Link href="/tasks" className={textLink}>Back to tasks</Link></p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add a task</h1>
      <div className="mt-6 max-w-3xl">
        <TaskForm mode="create" action={createTaskAction} programmes={programmes} candidates={tasks} defaults={{ programme_id: programmes.some((p) => p.id === programme) ? programme : null }} />
      </div>
    </>
  );
}
