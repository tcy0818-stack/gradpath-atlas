// Invented data for the landing-page preview only (PUB-01). Nothing here is read from any account. It runs through
// the real summarise / buildMatrix / computeReadiness code so the preview shows how the product actually calculates.
import { summarise } from "@/lib/dashboard";
import type { DocFacts } from "@/lib/documents/types";
import { buildMatrix, type Column } from "@/lib/programmes/compare";
import type { Programme, Requirement } from "@/lib/programmes/types";
import { computeReadiness } from "@/lib/readiness";
import type { Task } from "@/lib/tasks";

export const EXAMPLE_TODAY = "2027-01-10";

const prog = (id: string, university: string, name: string, extra: Partial<Programme>): Programme => ({
  id, owner_id: "example", university_name: university, programme_name: name, country_region: null, subject: null, intake_label: "Sep 2027", duration_months: 12,
  tuition_state: "known", tuition_amount: null, tuition_currency: null, status: "preparing", is_shortlisted: true, notes: null, sample_key: `example-${id}`, created_at: "", updated_at: "", ...extra,
});
const req = (id: string, programme_id: string, requirement_type: Requirement["requirement_type"], extra: Partial<Requirement> = {}): Requirement => ({
  id, owner_id: "example", programme_id, requirement_type, level: "required", detail: null, quantity: 1, self_confirmed: false, created_at: "", updated_at: "", ...extra,
});
const task = (id: string, extra: Partial<Task>): Task => ({ id, programme_id: null, title: id, due_date: null, priority: "medium", status: "todo", prerequisite_task_id: null, completed_at: null, sample_key: "example", ...extra });

const programmes = [
  prog("a", "Aldermoor University", "MSc Marketing Analytics", { country_region: "United Kingdom", tuition_amount: 24500, tuition_currency: "GBP" }),
  prog("b", "Brightwater Institute", "MSc Data Science", { country_region: "Netherlands", tuition_amount: 18200, tuition_currency: "EUR", status: "researching" }),
];
const requirements = [
  req("a1", "a", "transcript"), req("a2", "a", "statement"),
  req("b1", "b", "transcript"), req("b2", "b", "cv"),
];
const transcript: DocFacts = { id: "d1", title: "Transcript", doc_type: "transcript", prep_status: "ready", expiry_date: null };
const statement: DocFacts = { id: "d2", title: "Statement draft", doc_type: "statement", prep_status: "draft", expiry_date: null };
const linked = new Map<string, DocFacts[]>([["a1", [transcript]], ["b1", [transcript]], ["a2", [statement]]]);
const deadlines = [
  { id: "da", programme_id: "a", deadline_type: "submission" as const, title: "Application deadline", due_date: "2027-01-24", is_done: false, sample_key: "example" },
  { id: "db", programme_id: "b", deadline_type: "submission" as const, title: "Application deadline", due_date: "2027-03-01", is_done: false, sample_key: "example" },
];
const tasks = [
  task("t1", { programme_id: "a", title: "Finish the statement draft", due_date: "2027-01-12", priority: "high" }),
  task("t2", { programme_id: "a", title: "Submit the Aldermoor application", due_date: "2027-01-22", prerequisite_task_id: "t1" }),
];

export const exampleWorkspace = summarise({ today: EXAMPLE_TODAY, programmes, requirements, linked, deadlines, tasks });

const columns: Column[] = programmes.map((p) => ({
  programme: p,
  deadline: deadlines.find((d) => d.programme_id === p.id)?.due_date ?? null,
  requirements: requirements.filter((r) => r.programme_id === p.id),
  readiness: computeReadiness(requirements.filter((r) => r.programme_id === p.id), linked, EXAMPLE_TODAY),
}));
export const exampleColumns = columns;
// The preview shows the rows that make the point; the real comparison page has them all.
const SHOWN = new Set(["tuition", "deadline", "readiness", "req-transcript", "req-statement", "req-cv"]);
export const exampleRows = buildMatrix(columns).filter((r) => SHOWN.has(r.key));
/** The one document that counts toward a requirement in both programmes. */
export const exampleReusedDocument = { title: transcript.title, usedBy: programmes.map((p) => p.programme_name) };
