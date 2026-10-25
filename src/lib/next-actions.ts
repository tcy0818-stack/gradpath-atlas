// "What to do next" (PRD 5.5, DSH-02). Pure. Only things you can act on now: blocked tasks are listed apart, and
// anything tied to a submitted, decided or withdrawn programme is left out (that programme's work is closed).
import { compareDue, type DueClass } from "@/lib/dates";
import type { DeadlineView } from "@/lib/deadlines";
import { PRIORITY_LABELS, type Priority, type TaskView } from "@/lib/tasks";

export type ActionItem = {
  key: string;
  kind: "task" | "deadline" | "requirements";
  title: string;
  /** Programme name, or "General". */
  context: string;
  href: string;
  date: string | null;
  due: DueClass;
  priority: Priority | null;
  /** Extra words for the row, for example the priority or what is missing. */
  note: string;
};

const DUE_RANK: Record<DueClass, number> = { overdue: 0, today: 1, soon: 2, later: 3, none: 4 };
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Overdue, then due today, then upcoming; earlier date first; higher priority first (deadlines count as high); then title. */
export function compareActions(a: ActionItem, b: ActionItem): number {
  return (
    DUE_RANK[a.due] - DUE_RANK[b.due] ||
    compareDue(a.date, b.date) ||
    PRIORITY_RANK[a.priority ?? "high"] - PRIORITY_RANK[b.priority ?? "high"] ||
    a.title.localeCompare(b.title, "en")
  );
}

export type ProgrammeNeed = { id: string; name: string; unmetRequired: number };

export function buildNextActions(tasks: TaskView[], deadlines: DeadlineView[], needs: ProgrammeNeed[], names: ReadonlyMap<string, string>): ActionItem[] {
  const items: ActionItem[] = [];
  for (const t of tasks) {
    if (!t.actionable) continue;
    items.push({
      key: `task-${t.id}`,
      kind: "task",
      title: t.title,
      context: t.programme_id ? (names.get(t.programme_id) ?? "Programme") : "General",
      href: `/tasks/${t.id}`,
      date: t.due_date,
      due: t.due,
      priority: t.priority,
      note: `${PRIORITY_LABELS[t.priority]} priority`,
    });
  }
  for (const d of deadlines) {
    if (!d.outstanding || (d.due !== "overdue" && d.due !== "today" && d.due !== "soon")) continue;
    items.push({
      key: `deadline-${d.id}`,
      kind: "deadline",
      title: d.title,
      context: d.programme?.programme_name ?? "General",
      href: `/deadlines/${d.id}`,
      date: d.due_date,
      due: d.due,
      priority: null,
      note: "Deadline",
    });
  }
  for (const n of needs) {
    if (n.unmetRequired === 0) continue;
    items.push({
      key: `requirements-${n.id}`,
      kind: "requirements",
      title: `${n.unmetRequired} required ${n.unmetRequired === 1 ? "item" : "items"} not yet met`,
      context: n.name,
      href: `/programmes/${n.id}`,
      date: null,
      due: "none",
      priority: null,
      note: "Requirements",
    });
  }
  return items.sort(compareActions);
}
