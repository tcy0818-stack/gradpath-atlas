import { describe, expect, it } from "vitest";
import { decorate, filterSortTasks, parseTaskParams, taskRuleError, wouldCreateCycle, type Task } from "./tasks";

const TODAY = "2026-10-25";
const task = (id: string, o: Partial<Task> = {}): Task => ({
  id, programme_id: null, title: id, due_date: null, priority: "medium", status: "todo", prerequisite_task_id: null, completed_at: null, sample_key: null, ...o,
});
const view = (tasks: Task[]) => Object.fromEntries(decorate(tasks, TODAY).map((t) => [t.id, t]));

describe("decorate", () => {
  it("blocks a task until its prerequisite is done, then unblocks it", () => {
    expect(view([task("a"), task("b", { prerequisite_task_id: "a" })]).b).toMatchObject({ blocked: true, actionable: false });
    expect(view([task("a", { status: "done" }), task("b", { prerequisite_task_id: "a" })]).b).toMatchObject({ blocked: false, actionable: true });
  });
  it("shows what a blocked task waits on", () => {
    expect(view([task("a"), task("b", { prerequisite_task_id: "a" })]).b.waitingOn?.id).toBe("a");
  });
  it("a deleted prerequisite (set to null) leaves the task unblocked", () => {
    expect(view([task("b", { prerequisite_task_id: null })]).b.blocked).toBe(false);
  });
  it("a done task is never blocked or overdue", () => {
    const v = view([task("a"), task("b", { prerequisite_task_id: "a", status: "done", due_date: "2026-01-01" })]).b;
    expect(v).toMatchObject({ blocked: false, overdue: false, actionable: false });
  });
  it("overdue means before today; due today is not overdue; undated is never overdue", () => {
    const v = view([task("y", { due_date: "2026-10-24" }), task("t", { due_date: TODAY }), task("n")]);
    expect([v.y.overdue, v.t.overdue, v.n.overdue]).toEqual([true, false, false]);
    expect(v.t.due).toBe("today");
  });
});

describe("cycles and rules", () => {
  const chain = [task("a"), task("b", { prerequisite_task_id: "a" }), task("c", { prerequisite_task_id: "b" })];
  it("rejects itself, two-node and three-node cycles", () => {
    expect(wouldCreateCycle(chain, "a", "a")).toBe(true);
    expect(wouldCreateCycle(chain, "a", "b")).toBe(true);
    expect(wouldCreateCycle(chain, "a", "c")).toBe(true);
  });
  it("allows a valid prerequisite", () => {
    expect(wouldCreateCycle(chain, "c", "a")).toBe(false);
    expect(wouldCreateCycle(chain, "d", "c")).toBe(false);
  });
  it("does not spin on a loop already in the data", () => {
    expect(wouldCreateCycle([task("x", { prerequisite_task_id: "y" }), task("y", { prerequisite_task_id: "x" })], "z", "x")).toBe(true);
  });
  it("taskRuleError: self, cycle, done while blocked, missing prerequisite, ok", () => {
    expect(taskRuleError(chain, "a", { status: "todo", prerequisite_task_id: "a" })).toMatch(/own prerequisite/);
    expect(taskRuleError(chain, "a", { status: "todo", prerequisite_task_id: "c" })).toMatch(/loop/);
    expect(taskRuleError(chain, "b", { status: "done", prerequisite_task_id: "a" })).toMatch(/Finish “a”/);
    expect(taskRuleError(chain, "b", { status: "todo", prerequisite_task_id: "gone" })).toMatch(/no longer exists/);
    expect(taskRuleError(chain, "c", { status: "todo", prerequisite_task_id: "a" })).toBeNull();
    expect(taskRuleError(chain, null, { status: "todo", prerequisite_task_id: null })).toBeNull();
  });
});

describe("filter and sort", () => {
  const rows = decorate(
    [
      task("late", { due_date: "2026-12-01", priority: "high", programme_id: "p1" }),
      task("soon", { due_date: "2026-10-26", priority: "low", programme_id: "p1" }),
      task("undated", { priority: "high" }),
      task("finished", { due_date: "2026-10-01", status: "done" }),
      task("wait", { due_date: "2026-10-27", prerequisite_task_id: "late" }),
    ],
    TODAY,
  );
  const ids = (p: string) => filterSortTasks(rows, parseTaskParams(Object.fromEntries(new URLSearchParams(p)))).map((t) => t.id);
  it("sorts by due date with undated last and finished work at the bottom", () => {
    expect(ids("")).toEqual(["soon", "wait", "late", "undated", "finished"]);
  });
  it("sorts by priority, then due date", () => {
    expect(ids("sort=priority")).toEqual(["late", "undated", "wait", "soon", "finished"]);
  });
  it("filters by programme, general and status", () => {
    expect(ids("programme=p1")).toEqual(["soon", "late"]);
    expect(ids("programme=general")).toEqual(["wait", "undated", "finished"]);
    expect(ids("status=done")).toEqual(["finished"]);
    expect(ids("status=blocked")).toEqual(["wait"]);
    expect(ids("status=open")).toEqual(["soon", "wait", "late", "undated"]);
  });
  it("ignores unknown filter values", () => {
    expect(parseTaskParams({ status: "nope", sort: "x" })).toEqual({ programme: "", status: "", sort: "due" });
  });
});
