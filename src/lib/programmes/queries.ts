import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Column } from "./compare";
import type { ListRow } from "./list";
import { idSchema } from "./schemas";
import type { Programme, Requirement, StatusHistoryRow } from "./types";

// Every query runs with the signed-in user's own session, so Row Level Security decides what is visible.
// A failed read throws; (workspace)/error.tsx shows a recoverable message.
async function db() {
  await requireUser();
  return createClient();
}
const must = <T,>(r: { data: T | null; error: unknown }, what: string): T => {
  if (r.error || r.data == null) throw new Error(`Could not load ${what}.`);
  return r.data;
};

export async function listProgrammeRows(): Promise<ListRow[]> {
  const supabase = await db();
  const [p, d] = await Promise.all([
    supabase.from("programmes").select("*"),
    supabase.from("deadlines").select("programme_id, due_date").eq("deadline_type", "submission"),
  ]);
  const programmes = must(p, "programmes") as Programme[];
  const due = new Map((must(d, "deadlines") as { programme_id: string; due_date: string }[]).map((x) => [x.programme_id, x.due_date]));
  return programmes.map((x) => ({ ...x, deadline: due.get(x.id) ?? null }));
}

export type ProgrammeDetail = {
  programme: Programme;
  requirements: Requirement[];
  deadline: string | null;
  history: StatusHistoryRow[];
  /** What deleting the programme removes, for the confirmation dialog (PRG-04). */
  impact: { requirements: number; deadlines: number; tasks: number; documentLinks: number };
};

export async function getProgrammeDetail(id: string): Promise<ProgrammeDetail> {
  if (!idSchema.safeParse(id).success) notFound();
  const supabase = await db();
  const p = await supabase.from("programmes").select("*").eq("id", id).maybeSingle();
  if (p.error) throw new Error("Could not load the programme.");
  if (!p.data) notFound(); // missing, or not yours: RLS makes both look the same
  const [req, dl, hist, tasks] = await Promise.all([
    supabase.from("requirements").select("*").eq("programme_id", id),
    supabase.from("deadlines").select("id, due_date, deadline_type").eq("programme_id", id),
    supabase.from("programme_status_history").select("id, programme_id, from_status, to_status, changed_at").eq("programme_id", id).order("changed_at", { ascending: false }),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("programme_id", id),
  ]);
  const requirements = must(req, "requirements") as Requirement[];
  const deadlines = must(dl, "deadlines") as { due_date: string; deadline_type: string }[];
  const links = requirements.length
    ? await supabase.from("requirement_documents").select("document_id", { count: "exact", head: true }).in("requirement_id", requirements.map((r) => r.id))
    : { count: 0, error: null };
  return {
    programme: p.data as Programme,
    requirements,
    deadline: deadlines.find((d) => d.deadline_type === "submission")?.due_date ?? null,
    history: must(hist, "status history") as StatusHistoryRow[],
    impact: { requirements: requirements.length, deadlines: deadlines.length, tasks: tasks.count ?? 0, documentLinks: links.count ?? 0 },
  };
}

/** Columns for the comparison matrix, in the order of `ids`. Unknown or foreign ids simply yield no column. */
export async function getCompareColumns(ids: string[]): Promise<Column[]> {
  const valid = [...new Set(ids)].filter((i) => idSchema.safeParse(i).success).slice(0, 6);
  if (!valid.length) return [];
  const supabase = await db();
  const [p, r, d] = await Promise.all([
    supabase.from("programmes").select("*").in("id", valid),
    supabase.from("requirements").select("*").in("programme_id", valid),
    supabase.from("deadlines").select("programme_id, due_date").eq("deadline_type", "submission").in("programme_id", valid),
  ]);
  const programmes = new Map((must(p, "programmes") as Programme[]).map((x) => [x.id, x]));
  const reqs = must(r, "requirements") as Requirement[];
  const due = new Map((must(d, "deadlines") as { programme_id: string; due_date: string }[]).map((x) => [x.programme_id, x.due_date]));
  return valid.flatMap((id) => {
    const programme = programmes.get(id);
    return programme ? [{ programme, deadline: due.get(id) ?? null, requirements: reqs.filter((x) => x.programme_id === id) }] : [];
  });
}
