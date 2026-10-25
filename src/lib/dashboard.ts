// Dashboard, adviser preview and exports all read this one summary (PRD 5.5, DSH-01..03, RDY-02). Pure: it only
// combines the existing rules (readiness.ts, tasks.ts, deadlines.ts, dates.ts); nothing is stored or invented.
import type { DocFacts } from "@/lib/documents/types";
import { decorateDeadlines, type Deadline, type DeadlineView } from "@/lib/deadlines";
import { buildNextActions, type ActionItem } from "@/lib/next-actions";
import type { Programme, Requirement, Status } from "@/lib/programmes/types";
import { computeReadiness, type Readiness } from "@/lib/readiness";
import { decorate, type Task, type TaskView } from "@/lib/tasks";

export type WorkspaceInput = {
  today: string;
  programmes: Programme[];
  requirements: Requirement[];
  linked: ReadonlyMap<string, DocFacts[]>;
  deadlines: Deadline[];
  tasks: Task[];
};

export type ProgrammeSummary = {
  programme: Programme;
  /** Researching or preparing: its work is still open. Submitted, decided and withdrawn programmes are closed. */
  open: boolean;
  submissionDeadline: DeadlineView | null;
  /** Preparation: required requirements met by valid documents. Separate from status and from task progress. */
  readiness: Readiness;
  unmetRequired: number;
  tasks: TaskView[];
  deadlines: DeadlineView[];
};

export type Workspace = {
  today: string;
  programmes: ProgrammeSummary[];
  counts: { activeApplications: number; upcomingDeadlines: number; overdueTasks: number; unmetRequired: number };
  nextActions: ActionItem[];
  /** Open tasks waiting on another task, with what they wait on (task.waitingOn). */
  blocked: TaskView[];
  /** Tasks and deadlines not tied to any programme. */
  generalTasks: TaskView[];
  generalDeadlines: DeadlineView[];
};

const OPEN: readonly Status[] = ["researching", "preparing"];
const ACTIVE: readonly Status[] = ["preparing", "submitted"];

export function summarise(input: WorkspaceInput): Workspace {
  const { today } = input;
  const refs = input.programmes.map((p) => ({ id: p.id, programme_name: p.programme_name, university_name: p.university_name, status: p.status }));
  const taskViews = decorate(input.tasks, today);
  const deadlineViews = decorateDeadlines(input.deadlines, refs, today);

  const programmes = input.programmes
    .map((programme): ProgrammeSummary => {
      const readiness = computeReadiness(input.requirements.filter((r) => r.programme_id === programme.id), input.linked, today);
      const deadlines = deadlineViews.filter((d) => d.programme_id === programme.id);
      return {
        programme,
        open: OPEN.includes(programme.status),
        submissionDeadline: deadlines.find((d) => d.deadline_type === "submission") ?? null,
        readiness,
        unmetRequired: readiness.items.filter((i) => i.state === "missing").length,
        tasks: taskViews.filter((t) => t.programme_id === programme.id),
        deadlines,
      };
    })
    .sort((a, b) => a.programme.programme_name.localeCompare(b.programme.programme_name, "en"));

  const openIds = new Set(programmes.filter((p) => p.open).map((p) => p.programme.id));
  // A task counts if it is general or belongs to a programme that is still open.
  const liveTasks = taskViews.filter((t) => t.programme_id == null || openIds.has(t.programme_id));
  const names = new Map(input.programmes.map((p) => [p.id, p.programme_name]));
  const openProgrammes = programmes.filter((p) => p.open);

  return {
    today,
    programmes,
    counts: {
      activeApplications: input.programmes.filter((p) => ACTIVE.includes(p.status)).length,
      upcomingDeadlines: deadlineViews.filter((d) => d.outstanding && (d.due === "today" || d.due === "soon")).length,
      overdueTasks: liveTasks.filter((t) => t.overdue).length,
      unmetRequired: openProgrammes.reduce((n, p) => n + p.unmetRequired, 0),
    },
    nextActions: buildNextActions(liveTasks, deadlineViews, openProgrammes.map((p) => ({ id: p.programme.id, name: p.programme.programme_name, unmetRequired: p.unmetRequired })), names),
    blocked: liveTasks.filter((t) => t.blocked),
    generalTasks: taskViews.filter((t) => t.programme_id == null),
    generalDeadlines: deadlineViews.filter((d) => d.programme_id == null),
  };
}
