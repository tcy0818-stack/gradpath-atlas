// Export builders (EXP-01, EXP-02, RDY-02). Pure: they format the same Workspace summary the dashboard shows, so a
// figure in a file always matches the screen. Nothing here reads the database, and no identifiers, owner ids,
// emails or tokens are included: only the student's own planning records.
import { toCsv } from "@/lib/csv";
import { compareDue, type DueClass } from "@/lib/dates";
import type { Workspace } from "@/lib/dashboard";
import type { DeadlineView } from "@/lib/deadlines";
import { DOC_TYPE_LABELS, PREP_LABELS, type DocumentRow } from "@/lib/documents/types";
import { STATUS_LABELS, type Programme } from "@/lib/programmes/types";
import { PRIORITY_LABELS, TASK_STATUS_LABELS, type TaskView } from "@/lib/tasks";

const DUE_WORDS: Record<DueClass, string> = { overdue: "Overdue", today: "Due today", soon: "Due soon", later: "Later", none: "No date" };

/** Unknown and not applicable stay words; they are never exported as 0. */
export function tuitionText(p: Programme): string {
  if (p.tuition_state === "known") return `${p.tuition_amount} ${p.tuition_currency}`;
  return p.tuition_state === "unknown" ? "Unknown" : "Not applicable";
}

const deadlineWhen = (d: DeadlineView) => (d.outstanding ? DUE_WORDS[d.due] : `Closed (${d.closedReason})`);
const taskState = (t: TaskView) => (t.blocked ? "Blocked" : TASK_STATUS_LABELS[t.status]);

export function programmesCsv(ws: Workspace): string {
  return toCsv(
    ["University", "Programme", "Country or region", "Subject", "Intake", "Duration (months)", "Tuition", "Application deadline", "Deadline status", "Application status", "Shortlisted", "Fictional example", "Preparation", "Unmet required requirements", "Requirements needing a check", "Open tasks", "Blocked tasks"],
    ws.programmes.map((s) => {
      const p = s.programme;
      return [
        p.university_name,
        p.programme_name,
        p.country_region,
        p.subject,
        p.intake_label,
        p.duration_months ?? "Unknown",
        tuitionText(p),
        s.submissionDeadline?.due_date ?? "",
        s.submissionDeadline ? deadlineWhen(s.submissionDeadline) : "No deadline recorded",
        STATUS_LABELS[p.status],
        p.is_shortlisted ? "Yes" : "No",
        p.sample_key ? "Yes" : "No",
        s.readiness.label,
        s.readiness.items.filter((i) => i.state === "missing").map((i) => i.missing).join(" "),
        s.readiness.unknown,
        s.tasks.filter((t) => t.status !== "done").length,
        s.tasks.filter((t) => t.blocked).length,
      ];
    }),
  );
}

export function actionsCsv(ws: Workspace): string {
  const byDate = <T extends { due_date: string | null; title: string }>(a: T, b: T) => compareDue(a.due_date, b.due_date) || a.title.localeCompare(b.title, "en");
  const names = new Map(ws.programmes.map((s) => [s.programme.id, s.programme.programme_name]));
  const where = (id: string | null) => (id ? (names.get(id) ?? "") : "General");
  const tasks = [...ws.programmes.filter((s) => s.open).flatMap((s) => s.tasks), ...ws.generalTasks].filter((t) => t.status !== "done").sort(byDate);
  const deadlines = [...ws.programmes.flatMap((s) => s.deadlines), ...ws.generalDeadlines].filter((d) => d.outstanding).sort(byDate);
  return toCsv(
    ["Type", "Item", "Programme", "Due date", "When", "Priority", "State", "Waiting on"],
    [
      ...tasks.map((t) => ["Task", t.title, where(t.programme_id), t.due_date ?? "", DUE_WORDS[t.due], PRIORITY_LABELS[t.priority], taskState(t), t.waitingOn?.title ?? ""]),
      ...deadlines.map((d) => ["Deadline", d.title, where(d.programme_id), d.due_date, DUE_WORDS[d.due], "", "Outstanding", ""]),
      ...ws.programmes.filter((s) => s.open).flatMap((s) =>
        s.readiness.items.filter((i) => i.state === "missing").map((i) => ["Unmet requirement", i.missing, s.programme.programme_name, "", "", "", "Not met", ""]),
      ),
    ],
  );
}

export function workspaceJson(ws: Workspace, documents: DocumentRow[]): string {
  const task = (t: TaskView) => ({ title: t.title, due_date: t.due_date, when: DUE_WORDS[t.due], priority: t.priority, state: taskState(t), waiting_on: t.waitingOn?.title ?? null });
  const deadline = (d: DeadlineView) => ({ title: d.title, type: d.deadline_type, due_date: d.due_date, when: deadlineWhen(d), outstanding: d.outstanding });
  return JSON.stringify(
    {
      exported_for_date: ws.today,
      note: "Your own GradPath Atlas records. Unknown and not-applicable values are exported as words, not zero. No files or credentials are included.",
      counts: ws.counts,
      programmes: ws.programmes.map((s) => ({
        university: s.programme.university_name,
        programme: s.programme.programme_name,
        country_region: s.programme.country_region,
        subject: s.programme.subject,
        intake: s.programme.intake_label,
        duration_months: s.programme.duration_months,
        tuition: tuitionText(s.programme),
        application_status: s.programme.status,
        shortlisted: s.programme.is_shortlisted,
        fictional_example: s.programme.sample_key != null,
        notes: s.programme.notes,
        preparation: { label: s.readiness.label, required: s.readiness.required, satisfied: s.readiness.satisfied, needing_a_check: s.readiness.unknown },
        requirements: s.readiness.items.map((i) => ({
          type: i.requirement.requirement_type,
          level: i.requirement.level,
          state: i.state,
          ready: i.have,
          needed: i.need,
          detail: i.requirement.detail,
          missing: i.missing,
          documents: i.linked.map((l) => ({ title: l.doc.title, type: l.doc.doc_type, status: l.doc.prep_status, expiry_date: l.doc.expiry_date, counts: l.issue == null, why_not: l.why })),
        })),
        deadlines: s.deadlines.map(deadline),
        tasks: s.tasks.map(task),
      })),
      general: { tasks: ws.generalTasks.map(task), deadlines: ws.generalDeadlines.map(deadline) },
      next_actions: ws.nextActions.map((a) => ({ kind: a.kind, title: a.title, programme: a.context, date: a.date, when: DUE_WORDS[a.due] })),
      documents: documents.map((d) => ({ title: d.title, type: DOC_TYPE_LABELS[d.doc_type], status: PREP_LABELS[d.prep_status], expiry_date: d.expiry_date, notes: d.notes, fictional_example: d.sample_key != null })),
    },
    null,
    2,
  );
}
