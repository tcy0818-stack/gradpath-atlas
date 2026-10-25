import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/account/print-button";
import { PageHeader } from "@/components/page-header";
import { ReadinessMeter } from "@/components/programmes/readiness-meter";
import { DueLabel, Pill } from "@/components/planning/due-label";
import { StatusBadge } from "@/components/programmes/status-badge";
import { Alert, primaryButton, standaloneLink } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import type { ProgrammeSummary } from "@/lib/dashboard";
import { formatIsoDate } from "@/lib/dates";
import { tuitionText } from "@/lib/export";
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/tasks";
import { loadWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Adviser preview" };

function Entry({ s }: { s: ProgrammeSummary }) {
  const p = s.programme;
  const missing = s.readiness.items.filter((i) => i.state === "missing");
  const checking = s.readiness.items.filter((i) => i.state === "unknown");
  const openTasks = s.tasks.filter((t) => t.status !== "done");
  const deadlines = s.deadlines.filter((d) => d.deadline_type !== "submission");
  const sub = s.submissionDeadline;
  return (
    <article aria-labelledby={`p-${p.id}`} className="break-inside-avoid rounded-xl border border-line bg-surface p-5 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={`p-${p.id}`} className="text-2xl">{p.programme_name}</h2>
          <p className="text-ink-2">{p.university_name}{p.country_region ? ` · ${p.country_region}` : ""}</p>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Application deadline</dt><dd className="font-medium">{sub ? <DueLabel date={sub.due_date} due={sub.due} muted={!sub.outstanding} /> : "None recorded"}</dd></div>
        <div><dt className="text-muted">Tuition</dt><dd className="font-medium">{tuitionText(p)}</dd></div>
        <div><dt className="mb-1 text-muted">Document preparation</dt><dd className="font-medium"><ReadinessMeter readiness={s.readiness} /></dd></div>
        <div><dt className="text-muted">Task progress</dt><dd className="font-medium">{s.tasks.length ? `${s.tasks.length - openTasks.length} of ${s.tasks.length} done` : "No tasks"}</dd></div>
      </dl>

      <h3 className="mt-5 text-sm font-semibold">Missing required items</h3>
      {missing.length === 0 ? (
        <p className="mt-1 text-sm text-ink-2">{s.readiness.required === 0 ? "No required requirements recorded." : "None. Every required item is met."}</p>
      ) : (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">{missing.map((i) => <li key={i.requirement.id}>{i.missing}</li>)}</ul>
      )}
      {checking.length > 0 && <p className="mt-1 text-sm text-ink-2">{checking.length} {checking.length === 1 ? "requirement still needs" : "requirements still need"} checking with the university.</p>}

      <h3 className="mt-5 text-sm font-semibold">Open tasks</h3>
      {openTasks.length === 0 ? <p className="mt-1 text-sm text-ink-2">No open tasks.</p> : (
        <ul className="mt-1 space-y-1 text-sm">
          {openTasks.map((t) => (
            <li key={t.id}>
              {t.title} · {PRIORITY_LABELS[t.priority]} · {t.due_date ? formatIsoDate(t.due_date) : "no date"} · {t.blocked ? `Blocked, waiting on ${t.waitingOn?.title}` : TASK_STATUS_LABELS[t.status]}
              {t.overdue && <> <Pill tone="danger">Overdue</Pill></>}
            </li>
          ))}
        </ul>
      )}
      {deadlines.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold">Other deadlines</h3>
          <ul className="mt-1 space-y-1 text-sm">{deadlines.map((d) => <li key={d.id}>{d.title} · <DueLabel date={d.due_date} due={d.due} muted={!d.outstanding} />{!d.outstanding && ` · ${d.closedReason}`}</li>)}</ul>
        </>
      )}
    </article>
  );
}

export default async function AdviserPage() {
  await requireUser();
  const { workspace: ws } = await loadWorkspace();
  const listed = ws.programmes.filter((s) => s.programme.is_shortlisted);
  const general = { tasks: ws.generalTasks.filter((t) => t.status !== "done"), deadlines: ws.generalDeadlines.filter((d) => d.outstanding) };

  return (
    <>
      <PageHeader title="Adviser-review preview" actions={<PrintButton />} />
      <div className="mt-5 max-w-[65ch]">
        <Alert tone="info">
          This is a read-only preview of <strong>your own</strong> workspace, laid out for showing to an adviser. It is not shared access: no adviser account or link exists, and nobody else can open this page. Print it or <a className="font-medium underline underline-offset-4" href="/api/export/workspace" download>download your data</a> to share it yourself.
        </Alert>
      </div>
      <p className="mt-3 text-sm text-ink-2">As of {formatIsoDate(ws.today)}. Shortlisted programmes only: {listed.length} of {ws.programmes.length}.</p>

      {listed.length === 0 ? (
        <section aria-labelledby="none-heading" className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-panel sm:p-8">
          <h2 id="none-heading" className="text-2xl">No shortlisted programmes</h2>
          <p className="mt-2 max-w-[65ch] text-ink-2">{ws.programmes.length === 0 ? "Add programmes first, then shortlist the ones to discuss." : "Shortlist the programmes you want to discuss and they will appear here."}</p>
          <div className="mt-4"><Link href="/programmes" className={`${primaryButton} !w-auto`}>{ws.programmes.length === 0 ? "Go to programmes" : "Choose a shortlist"}</Link></div>
        </section>
      ) : (
        <div className="mt-8 space-y-5">{listed.map((s) => <Entry key={s.programme.id} s={s} />)}</div>
      )}

      {(general.tasks.length > 0 || general.deadlines.length > 0) && (
        <section aria-labelledby="gen-heading" className="mt-8">
          <h2 id="gen-heading" className="text-2xl">General tasks and deadlines</h2>
          <p className="mt-1 text-sm text-ink-2">Not tied to a single programme.</p>
          <ul className="mt-2 space-y-1 text-sm">
            {general.tasks.map((t) => <li key={t.id}>{t.title} · {t.due_date ? formatIsoDate(t.due_date) : "no date"}{t.blocked ? " · Blocked" : ""}</li>)}
            {general.deadlines.map((d) => <li key={d.id}>{d.title} · {formatIsoDate(d.due_date)}</li>)}
          </ul>
        </section>
      )}
      <p className="mt-8 print:hidden"><Link href="/programmes" className={standaloneLink}>Back to programmes</Link></p>
    </>
  );
}
