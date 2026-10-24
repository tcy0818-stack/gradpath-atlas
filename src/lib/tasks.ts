// Task rules, written once (PRD 5.5, TSK-01..05). Pure: blocked/actionable/overdue are calculated from the current
// rows and today's date, never stored. The database trigger tasks_guard (0006) enforces the same cycle and
// completion rules; this module gives the UI and Server Actions the same answers with readable messages.
import { classifyDue, compareDue, type DueClass } from "@/lib/dates";

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABELS: Record<Priority, string> = { low: "Low", medium: "Medium", high: "High" };
const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2 };

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = { todo: "To do", in_progress: "In progress", done: "Done" };

export type Task = {
  id: string;
  programme_id: string | null;
  title: string;
  due_date: string | null;
  priority: Priority;
  status: TaskStatus;
  prerequisite_task_id: string | null;
  completed_at: string | null;
  sample_key: string | null;
};

export type TaskView = Task & {
  /** Not done, and its prerequisite exists and is not done. */
  blocked: boolean;
  waitingOn: Task | null;
  /** Not done and not blocked: something you can work on now. */
  actionable: boolean;
  due: DueClass;
  /** Not done and due before today. Due today is not overdue. */
  overdue: boolean;
};

export function decorate(tasks: Task[], today: string): TaskView[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return tasks.map((t) => {
    const pre = t.prerequisite_task_id ? (byId.get(t.prerequisite_task_id) ?? null) : null;
    const open = t.status !== "done";
    const blocked = open && pre != null && pre.status !== "done";
    const due = classifyDue(t.due_date, today);
    return { ...t, blocked, waitingOn: blocked ? pre : null, actionable: open && !blocked, due, overdue: open && due === "overdue" };
  });
}

/** True when making `prereqId` the prerequisite of `taskId` would loop (including a task depending on itself). */
export function wouldCreateCycle(tasks: Pick<Task, "id" | "prerequisite_task_id">[], taskId: string, prereqId: string): boolean {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const seen = new Set<string>();
  let cur: string | null | undefined = prereqId;
  while (cur) {
    if (cur === taskId) return true;
    if (seen.has(cur)) return true; // an existing loop in the data: refuse rather than spin
    seen.add(cur);
    cur = byId.get(cur)?.prerequisite_task_id;
  }
  return false;
}

/** The first rule a save would break, as a sentence for the user, or null. `taskId` is null for a new task. */
export function taskRuleError(tasks: Task[], taskId: string | null, next: { status: TaskStatus; prerequisite_task_id: string | null }): string | null {
  const pid = next.prerequisite_task_id;
  if (!pid) return null;
  if (pid === taskId) return "A task cannot be its own prerequisite.";
  const pre = tasks.find((t) => t.id === pid);
  if (!pre) return "That prerequisite no longer exists. Reload the page and choose another.";
  if (taskId && wouldCreateCycle(tasks, taskId, pid)) return `“${pre.title}” already depends on this task, so choosing it would create a loop.`;
  if (next.status === "done" && pre.status !== "done") return `Finish “${pre.title}” before marking this task done.`;
  return null;
}

// --- list filters and sorting (TSK-02) ----------------------------------------------------------------------------------
export const TASK_SORTS = { due: "Due date (soonest first, undated last)", priority: "Priority (high first)" } as const;
export type TaskSort = keyof typeof TASK_SORTS;
export const TASK_FILTERS = { open: "Not done", todo: "To do", in_progress: "In progress", done: "Done", blocked: "Blocked" } as const;
export type TaskFilter = keyof typeof TASK_FILTERS;
/** programme: "" = all, "general" = tasks without a programme, otherwise a programme id. */
export type TaskParams = { programme: string; status: TaskFilter | ""; sort: TaskSort };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseTaskParams(sp: SearchParams): TaskParams {
  const status = first(sp.status);
  const sort = first(sp.sort);
  return {
    programme: first(sp.programme).slice(0, 40),
    status: status in TASK_FILTERS ? (status as TaskFilter) : "",
    sort: sort in TASK_SORTS ? (sort as TaskSort) : "due",
  };
}

export function filterSortTasks(rows: TaskView[], p: TaskParams): TaskView[] {
  const out = rows.filter((t) => {
    if (p.programme === "general" ? t.programme_id != null : p.programme && t.programme_id !== p.programme) return false;
    if (p.status === "open") return t.status !== "done";
    if (p.status === "blocked") return t.blocked;
    return !p.status || t.status === p.status;
  });
  const byPriority = (a: TaskView, b: TaskView) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  const done = (a: TaskView, b: TaskView) => Number(a.status === "done") - Number(b.status === "done"); // finished work sinks
  return out.sort((a, b) =>
    p.sort === "priority"
      ? done(a, b) || byPriority(a, b) || compareDue(a.due_date, b.due_date) || a.title.localeCompare(b.title, "en")
      : done(a, b) || compareDue(a.due_date, b.due_date) || byPriority(a, b) || a.title.localeCompare(b.title, "en"),
  );
}
