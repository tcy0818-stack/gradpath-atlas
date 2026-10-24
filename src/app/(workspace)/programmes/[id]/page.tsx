import type { Metadata } from "next";
import Link from "next/link";
import { DeleteProgramme, NotesForm, StatusForm } from "@/components/programmes/detail-forms";
import { ProgrammeForm } from "@/components/programmes/programme-form";
import { RequirementsEditor } from "@/components/programmes/requirements-editor";
import { ExampleBadge, StatusBadge } from "@/components/programmes/status-badge";
import { Alert, quietButton, textLink } from "@/components/ui";
import { getProfile } from "@/lib/auth/dal";
import { formatIsoDate } from "@/lib/dates";
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
  const [{ programme: p, requirements, deadline, history, impact }, profile] = await Promise.all([getProgrammeDetail(id), getProfile()]);
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];
  const when = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: profile.timeZone }).format(new Date(iso));

  return (
    <>
      <p className="text-sm"><Link href="/programmes" className={textLink}>Back to programmes</Link></p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.programme_name}</h1>
          <p className="text-ink-2">{p.university_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={p.status} />
            {p.sample_key && <ExampleBadge />}
            {deadline && <span className="text-sm text-ink-2">Deadline {formatIsoDate(deadline)}</span>}
          </div>
        </div>
        <form action={setShortlistAction}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="value" value={p.is_shortlisted ? "0" : "1"} />
          <button type="submit" aria-pressed={p.is_shortlisted} className={`${quietButton} ${p.is_shortlisted ? "!border-accent !bg-accent-tint" : ""}`}>
            {p.is_shortlisted ? "Shortlisted (click to remove)" : "Add to shortlist"}
          </button>
        </form>
      </div>
      {notice && <div className="mt-4"><Alert tone="error">{notice}</Alert></div>}

      <div className="mt-8 max-w-3xl space-y-10">
        <section aria-labelledby="status-h">
          <h2 id="status-h" className="mb-3 text-lg font-semibold">Application status</h2>
          <StatusForm id={p.id} status={p.status} />
          <h3 className="mt-6 text-sm font-semibold">Status history</h3>
          {history.length === 0 ? (
            <p className="mt-1 text-sm text-ink-2">No changes recorded yet.</p>
          ) : (
            <ol className="mt-2 space-y-1 text-sm">
              {history.map((h) => (
                <li key={h.id} className="text-ink-2">
                  <span className="font-medium text-ink">{h.from_status ? `${STATUS_LABELS[h.from_status]} to ${STATUS_LABELS[h.to_status]}` : `Added as ${STATUS_LABELS[h.to_status]}`}</span>
                  <span>, {when(h.changed_at)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="details-h">
          <h2 id="details-h" className="mb-3 text-lg font-semibold">Details</h2>
          <ProgrammeForm mode="edit" action={updateProgrammeAction} defaults={{ ...p, submission_deadline: deadline }} />
        </section>

        <section aria-labelledby="req-h">
          <h2 id="req-h" className="mb-3 text-lg font-semibold">Requirements</h2>
          <RequirementsEditor programmeId={p.id} requirements={requirements} />
        </section>

        <section aria-labelledby="notes-h">
          <h2 id="notes-h" className="mb-3 text-lg font-semibold">Notes</h2>
          <NotesForm id={p.id} notes={p.notes} />
        </section>

        <section aria-labelledby="danger-h" className="border-t border-line pt-6">
          <h2 id="danger-h" className="mb-2 text-lg font-semibold">Delete programme</h2>
          <p className="mb-3 max-w-[65ch] text-ink-2">Removes this programme and what is attached to it. Reusable documents are kept.</p>
          <DeleteProgramme id={p.id} name={p.programme_name} impact={impact} />
        </section>
      </div>
    </>
  );
}
