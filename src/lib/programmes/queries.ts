import "server-only";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth/dal";
import { todayInZone } from "@/lib/dates";
import { db, must } from "@/lib/db";
import { loadLinkedDocs } from "@/lib/documents/queries";
import { computeReadiness, type Readiness } from "@/lib/readiness";
import type { Column } from "./compare";
import type { ListRow } from "./list";
import { idSchema } from "./schemas";
import type { Programme, Requirement, StatusHistoryRow } from "./types";

// Queries use the signed-in user's own session (src/lib/db.ts), so Row Level Security decides what is visible.
const todayForUser = async () => todayInZone((await getProfile()).timeZone);

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
  /** Calculated from the requirements and their linked documents; never stored. */
  readiness: Readiness;
  today: string;
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
  const linked = await loadLinkedDocs(supabase, requirements.map((r) => r.id));
  const today = await todayForUser();
  const documentLinks = [...linked.values()].reduce((n, d) => n + d.length, 0);
  return {
    programme: p.data as Programme,
    requirements,
    deadline: deadlines.find((d) => d.deadline_type === "submission")?.due_date ?? null,
    history: must(hist, "status history") as StatusHistoryRow[],
    readiness: computeReadiness(requirements, linked, today),
    today,
    impact: { requirements: requirements.length, deadlines: deadlines.length, tasks: tasks.count ?? 0, documentLinks },
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
  const [linked, today] = await Promise.all([loadLinkedDocs(supabase, reqs.map((x) => x.id)), todayForUser()]);
  return valid.flatMap((id) => {
    const programme = programmes.get(id);
    if (!programme) return [];
    const requirements = reqs.filter((x) => x.programme_id === id);
    return [{ programme, deadline: due.get(id) ?? null, requirements, readiness: computeReadiness(requirements, linked, today) }];
  });
}
