// Deadline rules, written once (PRD 5.5, DL-01..05). Pure: nothing is stored or changed by classifying.
// Application deadlines are `submission` rows in the same table as milestones, so a programme's deadline has one
// source of truth that the programme list, comparison and this tracker all read.
import { classifyDue, compareDue, type DueClass } from "@/lib/dates";
import { STATUS_LABELS, type Status } from "@/lib/programmes/types";

export const DEADLINE_TYPES = ["submission", "milestone", "other"] as const;
export type DeadlineType = (typeof DEADLINE_TYPES)[number];
export const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = { submission: "Application deadline", milestone: "Preparation milestone", other: "Other" };

export type Deadline = {
  id: string;
  programme_id: string | null;
  deadline_type: DeadlineType;
  title: string;
  due_date: string;
  is_done: boolean;
  sample_key: string | null;
};
export type ProgrammeRef = { id: string; programme_name: string; university_name: string; status: Status };

export type DeadlineView = Deadline & {
  programme: ProgrammeRef | null;
  due: DueClass;
  /** Not done, and (if tied to a programme) the programme is still researching or preparing. */
  outstanding: boolean;
  /** Why it is not outstanding, in words; null when it is. */
  closedReason: string | null;
};

const ACTIVE: readonly Status[] = ["researching", "preparing"];

export function decorateDeadlines(deadlines: Deadline[], programmes: ProgrammeRef[], today: string): DeadlineView[] {
  const byId = new Map(programmes.map((p) => [p.id, p]));
  return deadlines.map((d) => {
    const programme = d.programme_id ? (byId.get(d.programme_id) ?? null) : null;
    // A submission deadline is closed by the programme's status, not by its own flag.
    const done = d.deadline_type !== "submission" && d.is_done;
    const inactive = programme != null && !ACTIVE.includes(programme.status);
    const closedReason = done ? "Done" : inactive ? STATUS_LABELS[programme.status] : null;
    return { ...d, programme, due: classifyDue(d.due_date, today), outstanding: closedReason == null, closedReason };
  });
}

export type DeadlineGroups = { overdue: DeadlineView[]; soon: DeadlineView[]; later: DeadlineView[]; closed: DeadlineView[] };

/** Overdue / Due soon (today included, labelled "Due today") / Later, each chronological; the rest in `closed`. */
export function groupDeadlines(views: DeadlineView[]): DeadlineGroups {
  const sorted = [...views].sort((a, b) => compareDue(a.due_date, b.due_date) || a.title.localeCompare(b.title, "en"));
  const pick = (f: (v: DeadlineView) => boolean) => sorted.filter(f);
  return {
    overdue: pick((v) => v.outstanding && v.due === "overdue"),
    soon: pick((v) => v.outstanding && (v.due === "today" || v.due === "soon")),
    later: pick((v) => v.outstanding && v.due === "later"),
    closed: pick((v) => !v.outstanding),
  };
}
