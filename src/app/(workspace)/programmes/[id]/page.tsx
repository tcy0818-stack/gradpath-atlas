import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader, Section } from "@/components/page-header";
import { DeleteProgramme, NotesForm, StatusForm } from "@/components/programmes/detail-forms";
import { ProgrammeForm } from "@/components/programmes/programme-form";
import { ReadinessMeter } from "@/components/programmes/readiness-meter";
import { ReadinessPanel } from "@/components/programmes/readiness-panel";
import { RequirementsEditor } from "@/components/programmes/requirements-editor";
import { ExampleBadge, StatusBadge } from "@/components/programmes/status-badge";
import { DueLabel } from "@/components/planning/due-label";
import { Alert, quietButton, standaloneLink, textLink } from "@/components/ui";
import { getProfile } from "@/lib/auth/dal";
import { classifyDue } from "@/lib/dates";
import { DEADLINE_TYPE_LABELS, decorateDeadlines } from "@/lib/deadlines";
import { getDeadlinesForProgramme } from "@/lib/planning/queries";
import { listDocumentFacts } from "@/lib/documents/queries";
import { setShortlistAction, updateProgrammeAction } from "@/lib/programmes/actions";
import { getProgrammeDetail } from "@/lib/programmes/queries";
import { STATUS_LABELS } from "@/lib/programmes/types";

export const metadata: Metadata = { title: "Programme" };

const NOTICES: Record<string, string> = {
  "deadline-failed": "The programme was saved, but its deadline could not be. Set it again under Details.",
  "delete-failed": "The programme could not be deleted. Nothing was removed; try again.",
};

export default async function ProgrammePage({ params, searchParams }: PageProps<"/programmes/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [{ programme: p, requirements, deadline, history, impact, readiness, today }, profile, documents, deadlineRows] = await Promise.all([getProgrammeDetail(id), getProfile(), listDocumentFacts(), getDeadlinesForProgramme(id)]);
  const deadlines = decorateDeadlines(deadlineRows, [{ id: p.id, programme_name: p.programme_name, university_name: p.university_name, status: p.status }], today).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];
  const when = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: profile.timeZone }).format(new Date(iso));

  const dueClass = classifyDue(deadline, today);
  const facts = [p.country_region, p.intake_label, p.duration_months ? `${p.duration_months} months` : null].filter(Boolean).join(" · ");

  return (
    <div className="space-y-8">
      <PageHeader
        back={<Link href="/programmes" className={textLink}>Back to programmes</Link>}
        title={p.programme_name}
        lede={<>{p.university_name}{facts && <span className="text-muted"> · {facts}</span>}</>}
        actions={
          <form action={setShortlistAction}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="value" value={p.is_shortlisted ? "0" : "1"} />
            <button type="submit" aria-pressed={p.is_shortlisted} className={`${quietButton} ${p.is_shortlisted ? "!border-accent !bg-accent-tint" : ""}`}>
              <Icon name="star" size={16} filled={p.is_shortlisted} className="mr-1.5" />
              {p.is_shortlisted ? "Shortlisted (click to remove)" : "Add to shortlist"}
            </button>
          </form>
        }
      />
      <dl className="-mt-2 flex flex-wrap items-start gap-x-10 gap-y-4 rounded-xl border border-line bg-surface p-4 shadow-panel sm:p-5">
        <div><dt className="mb-1 text-xs font-semibold text-muted">Application status</dt><dd className="flex flex-wrap items-center gap-2"><StatusBadge status={p.status} />{p.sample_key && <ExampleBadge />}</dd></div>
        <div><dt className="mb-1 text-xs font-semibold text-muted">Application deadline</dt><dd className="text-sm font-medium">{deadline ? <DueLabel date={deadline} due={dueClass} muted={p.status !== "researching" && p.status !== "preparing"} /> : <span className="text-muted">None recorded</span>}</dd></div>
        <div><dt className="mb-1 text-xs font-semibold text-muted">Document readiness</dt><dd><ReadinessMeter readiness={readiness} /></dd></div>
      </dl>
      {notice && <Alert tone="error">{notice}</Alert>}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <Section id="ready-h" title="Readiness">
            <ReadinessPanel readiness={readiness} documents={documents} today={today} />
          </Section>

          <Section id="req-h" title="Requirements">
            <RequirementsEditor programmeId={p.id} requirements={requirements} />
          </Section>

          <Section id="details-h" title="Details">
            <ProgrammeForm mode="edit" action={updateProgrammeAction} defaults={{ ...p, submission_deadline: deadline }} />
          </Section>

          <Section id="notes-h" title="Notes">
            <NotesForm id={p.id} notes={p.notes} />
          </Section>

          <Section id="danger-h" title="Delete programme" hint="Removes this programme and what is attached to it. Reusable documents are kept.">
            <DeleteProgramme id={p.id} name={p.programme_name} impact={impact} />
          </Section>
        </div>

        <aside className="min-w-0 space-y-8 lg:sticky lg:top-20 lg:self-start" aria-label="Status and deadlines">
          <section aria-labelledby="status-h" className="rounded-xl border border-line bg-surface p-5 shadow-panel">
            <h2 id="status-h" className="text-xl">Application status</h2>
            <div className="mt-3"><StatusForm id={p.id} status={p.status} /></div>
            <h3 className="mt-5 text-sm font-semibold">Status history</h3>
            {history.length === 0 ? (
              <p className="mt-1 text-sm text-ink-2">No changes recorded yet.</p>
            ) : (
              <ol className="mt-2 space-y-1.5 border-l border-line pl-3 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="text-ink-2">
                    <span className="block font-medium text-ink">{h.from_status ? `${STATUS_LABELS[h.from_status]} to ${STATUS_LABELS[h.to_status]}` : `Added as ${STATUS_LABELS[h.to_status]}`}</span>
                    <span>{when(h.changed_at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="dl-h" className="rounded-xl border border-line bg-surface p-5 shadow-panel">
            <h2 id="dl-h" className="text-xl">Deadlines</h2>
            {deadlines.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-control p-3 text-sm text-ink-2">No deadlines yet. Set the application deadline under Details, or add a preparation milestone.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {deadlines.map((d) => (
                  <li key={d.id} className="py-1">
                    <Link href={`/deadlines/${d.id}`} className={`${standaloneLink} !font-semibold`}>{d.title}</Link>
                    <p className="-mt-1 pb-2 text-sm text-ink-2">{DEADLINE_TYPE_LABELS[d.deadline_type]} · <DueLabel date={d.due_date} due={d.due} muted={!d.outstanding} />{d.closedReason && <span className="ml-2">{d.closedReason}</span>}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 flex flex-col text-sm">
              <Link href={`/deadlines/new?programme=${p.id}`} className={standaloneLink}>Add a milestone</Link>
              <Link href={`/tasks?programme=${p.id}`} className={standaloneLink}>Tasks for this programme</Link>
              <Link href={`/tasks/new?programme=${p.id}`} className={standaloneLink}>Add a task</Link>
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
