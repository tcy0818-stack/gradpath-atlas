import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDelete } from "@/components/planning/confirm-delete";
import { PageHeader, Section } from "@/components/page-header";
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
    <div className="space-y-8">
      <PageHeader
        back={<Link href="/deadlines" className={textLink}>Back to deadlines</Link>}
        title={deadline.title}
        lede={<>{DEADLINE_TYPE_LABELS[deadline.deadline_type]}{view.programme && <> · {view.programme.programme_name}</>} · <DueLabel date={deadline.due_date} due={view.due} muted={!view.outstanding} />{view.closedReason && <> · Not outstanding: {view.closedReason}</>}</>}
      />
      {notice && <Alert tone="error">{notice}</Alert>}

      <div className="max-w-3xl space-y-10">
        <Section id="details-h" title="Details">
          <DeadlineForm mode="edit" action={updateDeadlineAction} programmes={programmes} defaults={deadline} />
        </Section>
        <Section id="danger-h" title="Delete deadline" hint="Removes this date only. The programme is kept.">
          <ConfirmDelete id={deadline.id} title={`Delete “${deadline.title}”?`} buttonLabel="Delete deadline…" keepLabel="Keep deadline" action={deleteDeadlineAction}>
            <p>This cannot be undone.</p>
            {deadline.deadline_type === "submission" && <p>This is the programme&apos;s application deadline, so the programme will show an unknown deadline in the list and comparison until you set one again.</p>}
          </ConfirmDelete>
        </Section>
      </div>
    </div>
  );
}
