import type { Metadata } from "next";
import Link from "next/link";
import { DueLabel, Pill } from "@/components/planning/due-label";
import { Alert, primaryButton, quietButton, standaloneLink } from "@/components/ui";
import { DUE_SOON_DAYS } from "@/lib/dates";
import { DEADLINE_TYPE_LABELS, decorateDeadlines, groupDeadlines, type DeadlineView } from "@/lib/deadlines";
import { setDeadlineDoneAction } from "@/lib/planning/actions";
import { listDeadlines, listProgrammeRefs, todayForUser } from "@/lib/planning/queries";
import { STATUS_LABELS } from "@/lib/programmes/types";

export const metadata: Metadata = { title: "Deadlines" };

const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  created: { tone: "success", text: "Deadline added." },
  deleted: { tone: "success", text: "Deadline deleted." },
  failed: { tone: "error", text: "That change couldn't be saved. Reload the page and try again." },
};

function Row({ d }: { d: DeadlineView }) {
  const closed = !d.outstanding;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-1">
      <div className="py-2">
        <Link href={`/deadlines/${d.id}`} className={`${standaloneLink} !font-semibold`}>{d.title}</Link>
        <div className="text-sm text-ink-2">
          {DEADLINE_TYPE_LABELS[d.deadline_type]} ·{" "}
          {d.programme ? <Link href={`/programmes/${d.programme.id}`} className="underline underline-offset-4">{d.programme.programme_name}</Link> : "General"}
          {d.programme && d.deadline_type === "submission" && <> · Programme status: {STATUS_LABELS[d.programme.status]}</>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DueLabel date={d.due_date} due={d.due} muted={closed} />
        {closed && d.closedReason && <Pill tone="ok">{d.closedReason}</Pill>}
        {d.deadline_type !== "submission" && (
          <form action={setDeadlineDoneAction}>
            <input type="hidden" name="id" value={d.id} />
            <input type="hidden" name="value" value={d.is_done ? "0" : "1"} />
            <button type="submit" className={quietButton}>
              {d.is_done ? "Reopen" : "Mark done"}<span className="sr-only">: {d.title}</span>
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

function Group({ id, title, hint, items }: { id: string; title: string; hint?: string; items: DeadlineView[] }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-lg font-semibold">{title} <span className="font-normal text-ink-2">({items.length})</span></h2>
      {hint && <p className="mt-0.5 text-sm text-ink-2">{hint}</p>}
      {items.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-control p-4 text-ink-2">Nothing here.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface">{items.map((d) => <Row key={d.id} d={d} />)}</ul>
      )}
    </section>
  );
}

export default async function DeadlinesPage({ searchParams }: PageProps<"/deadlines">) {
  const sp = await searchParams;
  const [deadlines, programmes, today] = await Promise.all([listDeadlines(), listProgrammeRefs(), todayForUser()]);
  const groups = groupDeadlines(decorateDeadlines(deadlines, programmes, today));
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Deadlines</h1>
        <Link href="/deadlines/new" className={`${primaryButton} !w-auto`}>Add deadline</Link>
      </div>
      <p className="mt-2 max-w-[65ch] text-ink-2">
        Today is {today} in your time zone. <strong>Due soon</strong> means today or within the next {DUE_SOON_DAYS} days; a deadline dated today is shown as <strong>Due today</strong>, not overdue. Application deadlines are the same dates you set on each programme. Nothing here changes a date for you.
      </p>
      {notice && <div className="mt-4"><Alert tone={notice.tone}>{notice.text}</Alert></div>}

      {deadlines.length === 0 ? (
        <section aria-labelledby="empty-h" className="mt-6 rounded-lg border border-line bg-surface p-6">
          <h2 id="empty-h" className="text-lg font-semibold">No deadlines yet</h2>
          <p className="mt-2 max-w-[65ch] text-ink-2">Set an application deadline on a programme, or add a preparation milestone here.</p>
          <div className="mt-4"><Link href="/deadlines/new" className={`${primaryButton} !w-auto`}>Add a deadline</Link></div>
        </section>
      ) : (
        <div className="mt-6 space-y-8">
          <Group id="overdue-h" title="Overdue" items={groups.overdue} />
          <Group id="soon-h" title="Due soon" hint={`Today through ${DUE_SOON_DAYS} days from today.`} items={groups.soon} />
          <Group id="later-h" title="Later" items={groups.later} />
          {groups.closed.length > 0 && (
            <details className="rounded-lg border border-line bg-surface">
              <summary className="flex min-h-11 cursor-pointer items-center px-4 font-semibold">Done or no longer needed ({groups.closed.length})</summary>
              <ul className="divide-y divide-line border-t border-line">{groups.closed.map((d) => <Row key={d.id} d={d} />)}</ul>
            </details>
          )}
        </div>
      )}
    </>
  );
}
