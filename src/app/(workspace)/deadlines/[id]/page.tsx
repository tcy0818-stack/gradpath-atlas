import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDelete } from "@/components/planning/confirm-delete";
import { DeadlineForm } from "@/components/planning/deadline-form";
import { DueLabel } from "@/components/planning/due-label";
import { Alert, textLink } from "@/components/ui";
import { DEADLINE_TYPE_LABELS, decorateDeadlines } from "@/lib/deadlines";
import { deleteDeadlineAction, updateDeadlineAction } from "@/lib/planning/actions";
import { getDeadline, listProgrammeRefs, todayForUser } from "@/lib/planning/queries";

export const metadata: Metadata = { title: "Deadline" };

const NOTICES: Record<string, string> = { "delete-failed": "The deadline could not be deleted. Nothing was removed; try again." };

export default async function DeadlinePage({ params, searchParams }: PageProps<"/deadlines/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [deadline, programmes, today] = await Promise.all([getDeadline(id), listProgrammeRefs(), todayForUser()]);
  const view = decorateDeadlines([deadline], programmes, today)[0];
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];

  return (
    <>
      <p className="text-sm"><Link href="/deadlines" className={textLink}>Back to deadlines</Link></p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{deadline.title}</h1>
      <p className="mt-1 text-ink-2">
        {DEADLINE_TYPE_LABELS[deadline.deadline_type]}
        {view.programme && <> · {view.programme.programme_name}</>} · <DueLabel date={deadline.due_date} due={view.due} muted={!view.outstanding} />
        {view.closedReason && <> · Not outstanding: {view.closedReason}</>}
      </p>
      {notice && <div className="mt-4"><Alert tone="error">{notice}</Alert></div>}

      <div className="mt-8 max-w-3xl space-y-10">
        <section aria-labelledby="details-h">
          <h2 id="details-h" className="mb-3 text-lg font-semibold">Details</h2>
          <DeadlineForm mode="edit" action={updateDeadlineAction} programmes={programmes} defaults={deadline} />
        </section>
        <section aria-labelledby="danger-h" className="border-t border-line pt-6">
          <h2 id="danger-h" className="mb-2 text-lg font-semibold">Delete deadline</h2>
          <p className="mb-3 max-w-[65ch] text-ink-2">Removes this date only. The programme is kept.</p>
          <ConfirmDelete id={deadline.id} title={`Delete “${deadline.title}”?`} buttonLabel="Delete deadline…" keepLabel="Keep deadline" action={deleteDeadlineAction}>
            <p>This cannot be undone.</p>
            {deadline.deadline_type === "submission" && <p>This is the programme&apos;s application deadline, so the programme will show an unknown deadline in the list and comparison until you set one again.</p>}
          </ConfirmDelete>
        </section>
      </div>
    </>
  );
}
