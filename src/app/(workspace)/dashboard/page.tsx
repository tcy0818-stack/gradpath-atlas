import type { Metadata } from "next";
import Link from "next/link";
import { DueLabel, Pill } from "@/components/planning/due-label";
import { LoadExamples } from "@/components/programmes/load-examples";
import { StatusBadge } from "@/components/programmes/status-badge";
import { primaryButton, standaloneLink } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { DUE_SOON_DAYS, formatIsoDate } from "@/lib/dates";
import { loadWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Dashboard" };

const SHOWN = 8;
const FIGURES = [
  { key: "activeApplications", label: "Active applications", href: "/programmes", meaning: "Programmes with status Preparing or Submitted." },
  { key: "upcomingDeadlines", label: "Upcoming deadlines", href: "/deadlines", meaning: `Outstanding deadlines due today or within ${DUE_SOON_DAYS} days.` },
  { key: "overdueTasks", label: "Overdue tasks", href: "/tasks?status=open", meaning: "Tasks not done and due before today, on programmes still being researched or prepared." },
  { key: "unmetRequired", label: "Unmet required requirements", href: "/programmes", meaning: "Required items with no Ready, unexpired, matching document (or not confirmed, for the academic check), on programmes still being researched or prepared." },
] as const;

export default async function DashboardPage() {
  await requireUser(); // pages verify the session themselves; layouts do not re-run on navigation
  const { workspace: ws } = await loadWorkspace();
  const shown = ws.nextActions.slice(0, SHOWN);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 max-w-[65ch] text-ink-2">
        Worked out from your records as of {formatIsoDate(ws.today)}, your time zone. Application status, document readiness and task progress are shown separately because they answer different questions.
      </p>

      {ws.programmes.length === 0 ? (
        <section aria-labelledby="empty-heading" className="mt-6 rounded-lg border border-line bg-surface p-6">
          <h2 id="empty-heading" className="text-lg font-semibold">Nothing is tracked yet</h2>
          <p className="mt-2 max-w-[65ch] text-ink-2">
            Add the master&apos;s programmes you are considering, or load invented examples to see how the planner works. Examples are labelled &ldquo;Fictional example&rdquo; and can be removed from Settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/programmes/new" className={`${primaryButton} !w-auto`}>Add a programme</Link>
            <LoadExamples />
          </div>
        </section>
      ) : (
        <>
          <section aria-labelledby="figures-heading" className="mt-6">
            <h2 id="figures-heading" className="sr-only">Figures</h2>
            <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {FIGURES.map((f) => (
                <div key={f.key} className="bg-surface p-4">
                  <dt className="text-sm font-semibold">{f.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight">{ws.counts[f.key]}</dd>
                  <dd className="mt-1 text-sm text-muted">{f.meaning}</dd>
                  <dd><Link href={f.href} className={standaloneLink}>See them<span className="sr-only">: {f.label}</span></Link></dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="next-heading" className="mt-8">
            <h2 id="next-heading" className="text-lg font-semibold">Next actions</h2>
            <p className="mt-1 max-w-[65ch] text-sm text-ink-2">Overdue first, then due today and soon, then work with no date. Blocked tasks are not listed here.</p>
            {shown.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-control p-4 text-ink-2">Nothing needs doing right now. Add a task or a deadline when something comes up.</p>
            ) : (
              <ol className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
                {shown.map((a) => (
                  <li key={a.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1">
                    <div className="min-w-0">
                      <Link href={a.href} className={`${standaloneLink} !font-semibold`}>{a.title}</Link>
                      <p className="-mt-1 pb-2 text-sm text-ink-2">{a.context} · {a.note}</p>
                    </div>
                    <div className="text-sm">{a.date ? <DueLabel date={a.date} due={a.due} /> : <span className="text-muted">No date</span>}</div>
                  </li>
                ))}
              </ol>
            )}
            {ws.nextActions.length > shown.length && (
              <p className="mt-2 text-sm text-ink-2">Showing {shown.length} of {ws.nextActions.length}. See all in <Link href="/tasks" className={standaloneLink}>Tasks</Link> and <Link href="/deadlines" className={standaloneLink}>Deadlines</Link>.</p>
            )}
          </section>

          {ws.blocked.length > 0 && (
            <section aria-labelledby="blocked-heading" className="mt-8">
              <h2 id="blocked-heading" className="text-lg font-semibold">Blocked tasks</h2>
              <p className="mt-1 max-w-[65ch] text-sm text-ink-2">These wait on another task. Finish that one first.</p>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
                {ws.blocked.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-x-3 px-4 py-1">
                    <Link href={`/tasks/${t.id}`} className={`${standaloneLink} !font-semibold`}>{t.title}</Link>
                    <Pill tone="danger">Blocked</Pill>
                    <span className="text-sm text-ink-2">Waiting on: {t.waitingOn?.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="progs-heading" className="mt-8">
            <h2 id="progs-heading" className="text-lg font-semibold">Programmes</h2>
            <div role="region" aria-label="Programmes: status, preparation and tasks" tabIndex={0} className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <caption className="sr-only">Status, document preparation, task progress and application deadline for each programme</caption>
                <thead className="border-b border-line bg-bg">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Programme</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Preparation</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Tasks</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Application deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {ws.programmes.map((s) => {
                    const done = s.tasks.filter((t) => t.status === "done").length;
                    const d = s.submissionDeadline;
                    return (
                      <tr key={s.programme.id} className="border-b border-line last:border-0">
                        <td className="px-3 py-1">
                          <Link href={`/programmes/${s.programme.id}`} className={`${standaloneLink} !font-semibold`}>{s.programme.programme_name}</Link>
                          <div className="-mt-1 pb-2 text-ink-2">{s.programme.university_name}</div>
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={s.programme.status} /></td>
                        <td className="px-3 py-3">{s.readiness.label}</td>
                        <td className="px-3 py-3">{s.tasks.length === 0 ? <span className="text-muted">No tasks</span> : `${done} of ${s.tasks.length} done`}</td>
                        <td className="px-3 py-3">{d ? <DueLabel date={d.due_date} due={d.due} muted={!d.outstanding} /> : <span className="text-muted">None recorded</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
