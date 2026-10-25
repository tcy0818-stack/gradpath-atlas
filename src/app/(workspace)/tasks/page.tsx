import type { Metadata } from "next";
import Link from "next/link";
import { DueLabel, Pill } from "@/components/planning/due-label";
import { PageHeader } from "@/components/page-header";
import { Alert, primaryButton, quietButton, standaloneLink, textLink } from "@/components/ui";
import { setTaskStatusAction } from "@/lib/planning/actions";
import { listProgrammeRefs, listTasks, todayForUser } from "@/lib/planning/queries";
import { PRIORITY_LABELS, TASK_FILTERS, TASK_SORTS, TASK_STATUS_LABELS, decorate, filterSortTasks, parseTaskParams } from "@/lib/tasks";

export const metadata: Metadata = { title: "Tasks" };

const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  created: { tone: "success", text: "Task added." },
  deleted: { tone: "success", text: "Task deleted. Any task that was waiting on it is now unblocked." },
  blocked: { tone: "error", text: "That task is waiting on another task, so it can't be marked done yet. Finish the prerequisite first." },
  failed: { tone: "error", text: "That change couldn't be saved. Reload the page and try again." },
};
const control = "mt-1 block min-h-11 w-full rounded-lg border border-control bg-surface px-3 py-2 text-base text-ink";

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const sp = await searchParams;
  const params = parseTaskParams(sp);
  const [tasks, programmes, today] = await Promise.all([listTasks(), listProgrammeRefs(), todayForUser()]);
  const all = decorate(tasks, today);
  const rows = filterSortTasks(all, params);
  const programmeName = new Map(programmes.map((p) => [p.id, p.programme_name]));
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];
  const open = all.filter((t) => t.status !== "done");
  const filtered = Boolean(params.programme || params.status || params.sort !== "due");

  return (
    <>
      <PageHeader
        title="Tasks"
        lede={<>Dates are calendar dates in your time zone ({today} today). A task that needs another task first is <strong>Blocked</strong> until that task is done. Task progress is separate from document readiness and from application status.</>}
        actions={<Link href="/tasks/new" className={`${primaryButton} !w-auto`}>Add task</Link>}
      />
      {notice && <div className="mt-4"><Alert tone={notice.tone}>{notice.text}</Alert></div>}

      {all.length === 0 ? (
        <section aria-labelledby="empty-h" className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-panel sm:p-8">
          <h2 id="empty-h" className="text-2xl">No tasks yet</h2>
          <p className="mt-2 max-w-[65ch] text-ink-2">Add the steps you need to take, such as requesting references or booking a language test. Tie a task to a programme, or leave it general. Loading fictional examples on the Programmes page also adds sample tasks.</p>
          <div className="mt-4"><Link href="/tasks/new" className={`${primaryButton} !w-auto`}>Add your first task</Link></div>
        </section>
      ) : (
        <div className="mt-8 space-y-4">
          <form method="get" role="search" aria-label="Filter and sort tasks" className="rounded-xl border border-line bg-surface p-4 shadow-panel sm:p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="programme" className="block text-sm font-semibold">Programme</label>
                <select id="programme" name="programme" defaultValue={params.programme} className={control}>
                  <option value="">All tasks</option>
                  <option value="general">General only</option>
                  {programmes.map((p) => <option key={p.id} value={p.id}>{p.programme_name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-semibold">Show</label>
                <select id="status" name="status" defaultValue={params.status} className={control}>
                  <option value="">Everything</option>
                  {Object.entries(TASK_FILTERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sort" className="block text-sm font-semibold">Sort by</label>
                <select id="sort" name="sort" defaultValue={params.sort} className={control}>
                  {Object.entries(TASK_SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="submit" className={quietButton}>Apply</button>
              {filtered && <Link href="/tasks" className={textLink}>Clear filters</Link>}
            </div>
          </form>

          <p className="text-sm text-ink-2" aria-live="polite">
            Showing {rows.length} of {all.length} {all.length === 1 ? "task" : "tasks"}. {open.length} not done · {open.filter((t) => t.blocked).length} blocked · {open.filter((t) => t.overdue).length} overdue.
          </p>

          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-control p-6">
              <p className="font-semibold">No tasks match these filters.</p>
              <p className="mt-1 text-ink-2">Try different filters, or <Link href="/tasks" className={textLink}>clear them</Link>.</p>
            </div>
          ) : (
            <div role="region" aria-label="Tasks" tabIndex={0} className="relative overflow-x-auto rounded-xl border border-line bg-surface shadow-panel">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <caption className="sr-only">Your tasks</caption>
                <thead className="border-b border-line bg-info-tint">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Task</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Due</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Priority</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-2 font-semibold"><span className="sr-only">Mark done or reopen</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-b border-line last:border-0 hover:bg-bg">
                      <td className="px-3 py-1">
                        <Link href={`/tasks/${t.id}`} className={`${standaloneLink} !font-semibold`}>{t.title}</Link>
                        <div className="text-ink-2">{t.programme_id ? (programmeName.get(t.programme_id) ?? "Programme") : "General"}</div>
                        {t.waitingOn && <div className="text-ink-2">Waiting on: {t.waitingOn.title}</div>}
                      </td>
                      <td className="px-3 py-3"><DueLabel date={t.due_date} due={t.due} muted={t.status === "done"} /></td>
                      <td className="px-3 py-3">{PRIORITY_LABELS[t.priority]}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex flex-wrap items-center gap-1.5">
                          <Pill tone={t.status === "done" ? "ok" : "neutral"}>{TASK_STATUS_LABELS[t.status]}</Pill>
                          {t.blocked && <Pill tone="danger">Blocked</Pill>}
                        </span>
                      </td>
                      <td className="px-3 py-1">
                        <form action={setTaskStatusAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="status" value={t.status === "done" ? "todo" : "done"} />
                          <button type="submit" disabled={t.blocked} className={`${quietButton} disabled:cursor-not-allowed disabled:opacity-60`}>
                            {t.status === "done" ? "Reopen" : "Mark done"}
                            <span className="sr-only">: {t.title}{t.blocked ? " (blocked, finish the prerequisite first)" : ""}</span>
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
