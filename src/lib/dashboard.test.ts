import { describe, expect, it } from "vitest";
import { summarise, type WorkspaceInput } from "./dashboard";
import { actionsCsv, programmesCsv, workspaceJson } from "./export";
import type { DocFacts, DocumentRow } from "./documents/types";
import type { Programme, Requirement } from "./programmes/types";
import type { Task } from "./tasks";

const today = "2027-01-10";
const prog = (id: string, status: Programme["status"], extra: Partial<Programme> = {}): Programme => ({
  id, owner_id: "u", university_name: `Uni ${id}`, programme_name: `Prog ${id}`, country_region: null, subject: null, intake_label: null, duration_months: null,
  tuition_state: "unknown", tuition_amount: null, tuition_currency: null, status, is_shortlisted: false, notes: null, sample_key: null, created_at: "", updated_at: "", ...extra,
});
const req = (id: string, programme_id: string, requirement_type: Requirement["requirement_type"], extra: Partial<Requirement> = {}): Requirement => ({
  id, owner_id: "u", programme_id, requirement_type, level: "required", detail: null, quantity: 1, self_confirmed: false, created_at: "", updated_at: "", ...extra,
});
const task = (id: string, extra: Partial<Task>): Task => ({ id, programme_id: null, title: id, due_date: null, priority: "medium", status: "todo", prerequisite_task_id: null, completed_at: null, sample_key: null, ...extra });
const dl = (id: string, programme_id: string | null, due_date: string, extra = {}) => ({ id, programme_id, deadline_type: programme_id ? ("submission" as const) : ("milestone" as const), title: id, due_date, is_done: false, sample_key: null, ...extra });
const ready: DocFacts = { id: "d1", title: "Transcript", doc_type: "transcript", prep_status: "ready", expiry_date: null };
const draft: DocFacts = { id: "d2", title: "SOP", doc_type: "statement", prep_status: "draft", expiry_date: null };

const input: WorkspaceInput = {
  today,
  programmes: [prog("A", "preparing", { is_shortlisted: true }), prog("B", "researching"), prog("C", "submitted")],
  requirements: [req("rA1", "A", "transcript"), req("rA2", "A", "statement"), req("rA3", "A", "academic"), req("rB1", "B", "cv"), req("rC1", "C", "transcript"), req("rA4", "A", "language", { level: "optional" })],
  linked: new Map([["rA1", [ready]], ["rA2", [draft]]]),
  deadlines: [dl("dA", "A", "2027-01-10"), dl("dB", "B", "2027-01-25"), dl("dC", "C", "2027-01-05"), dl("dGen", null, "2027-01-24")],
  tasks: [
    task("t1", { programme_id: "A", due_date: "2027-01-09" }),
    task("t2", { programme_id: "A", due_date: "2027-01-12", prerequisite_task_id: "t1" }),
    task("t3", {}),
    task("t4", { programme_id: "C", due_date: "2027-01-01" }),
    task("t5", { programme_id: "A", due_date: "2027-01-02", status: "done" }),
  ],
};
const ws = summarise(input);

describe("dashboard counts", () => {
  it("applies the PRD 5.5 definitions to known rows", () => {
    expect(ws.counts).toEqual({
      activeApplications: 2, // preparing + submitted
      upcomingDeadlines: 2, // A today, general milestone +14; B at +15 is later, C is closed
      overdueTasks: 1, // t1 only: t4 belongs to a submitted programme, t5 is done, t2 is not due yet
      unmetRequired: 3, // A: draft statement + unconfirmed academic; B: cv. C is closed, optional language ignored
    });
  });
  it("keeps preparation, task progress and application status apart", () => {
    const a = ws.programmes.find((p) => p.programme.id === "A")!;
    expect(a.programme.status).toBe("preparing");
    expect(a.readiness.label).toBe("1 of 3 required satisfied");
    expect(a.tasks.filter((t) => t.status === "done")).toHaveLength(1);
  });
  it("a changed row changes the figure", () => {
    const moved = summarise({ ...input, tasks: input.tasks.map((t) => (t.id === "t1" ? { ...t, status: "done" as const } : t)) });
    expect(moved.counts.overdueTasks).toBe(0);
    expect(moved.blocked).toHaveLength(0); // t2 is unblocked once t1 is done
  });
  it("is all zero for an empty workspace", () => {
    const empty = summarise({ ...input, programmes: [], requirements: [], linked: new Map(), deadlines: [], tasks: [] });
    expect(empty.counts).toEqual({ activeApplications: 0, upcomingDeadlines: 0, overdueTasks: 0, unmetRequired: 0 });
    expect(empty.nextActions).toEqual([]);
  });
});

describe("next actions", () => {
  it("orders overdue, today, soon, then undated, and omits blocked and closed work", () => {
    const keys = ws.nextActions.map((a) => a.key);
    expect(keys.slice(0, 3)).toEqual(["task-t1", "deadline-dA", "deadline-dGen"]);
    expect(keys.at(-1)).toBe("task-t3");
    expect(keys).not.toContain("task-t2"); // blocked
    expect(keys).not.toContain("task-t4"); // submitted programme
    expect(keys).not.toContain("task-t5"); // done
    expect(keys).not.toContain("deadline-dC");
    expect(keys).not.toContain("requirements-C");
  });
  it("lists blocked tasks separately with what they wait on", () => {
    expect(ws.blocked.map((t) => [t.id, t.waitingOn?.id])).toEqual([["t2", "t1"]]);
  });
});

const doc: DocumentRow = { id: "d1", owner_id: "u", title: "=cmd|' /C calc'!A0", doc_type: "transcript", prep_status: "ready", expiry_date: null, notes: "a, \"b\"\nc", sample_key: null, created_at: "", updated_at: "" };

describe("exports", () => {
  it("programme CSV has one row per programme, words for unknown tuition and the unmet items", () => {
    const rows = programmesCsv(ws).trim().split("\r\n");
    expect(rows).toHaveLength(4);
    expect(rows[1]).toContain(",Unknown,"); // tuition unknown, never 0
    expect(rows[1]).toContain("Preparing,Yes,No,1 of 3 required satisfied");
    expect(rows[1]).toContain("Statement: 0 of 1 ready document");
  });
  it("actions CSV lists outstanding tasks, deadlines and unmet requirements, not done or closed ones", () => {
    const csv = actionsCsv(ws);
    expect(csv).toContain("Task,t1,Prog A,2027-01-09,Overdue,Medium,To do,");
    expect(csv).toContain("Task,t2,Prog A,2027-01-12,Due soon,Medium,Blocked,t1");
    expect(csv).not.toContain("Task,t5");
    expect(csv).not.toContain("Task,t4"); // belongs to a submitted programme
    expect(csv).not.toContain("dC");
    expect(csv).toContain("Unmet requirement");
  });
  it("neutralises formulas typed into user text and still parses as JSON", () => {
    const programme = prog("F", "preparing", { programme_name: '=HYPERLINK("x")', notes: "line1\nline2" });
    const csv = programmesCsv(summarise({ ...input, programmes: [programme], requirements: [], deadlines: [], tasks: [] }));
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    const json = JSON.parse(workspaceJson(ws, [doc]));
    expect(json.documents[0].title).toBe(doc.title); // JSON is data, not a spreadsheet cell
    expect(json.programmes).toHaveLength(3);
  });
  it("contains no identifiers, owner ids or credentials", () => {
    const out = programmesCsv(ws) + actionsCsv(ws) + workspaceJson(ws, [doc]);
    expect(out).not.toMatch(/owner_id|"id"|password|token|secret|api[_-]?key/i);
  });
});
