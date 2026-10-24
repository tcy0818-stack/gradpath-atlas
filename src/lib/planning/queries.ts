import "server-only";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth/dal";
import { todayInZone } from "@/lib/dates";
import { db, must } from "@/lib/db";
import type { Deadline, ProgrammeRef } from "@/lib/deadlines";
import { idSchema } from "@/lib/programmes/schemas";
import type { Task } from "@/lib/tasks";

const TASK_COLUMNS = "id, programme_id, title, due_date, priority, status, prerequisite_task_id, completed_at, sample_key";
const DEADLINE_COLUMNS = "id, programme_id, deadline_type, title, due_date, is_done, sample_key";

/** Today's calendar date in the signed-in user's profile time zone. */
export const todayForUser = async () => todayInZone((await getProfile()).timeZone);

export async function listTasks(): Promise<Task[]> {
  const supabase = await db();
  return must(await supabase.from("tasks").select(TASK_COLUMNS), "tasks") as Task[];
}

export async function listProgrammeRefs(): Promise<ProgrammeRef[]> {
  const supabase = await db();
  const rows = must(await supabase.from("programmes").select("id, programme_name, university_name, status"), "programmes") as ProgrammeRef[];
  return rows.sort((a, b) => a.programme_name.localeCompare(b.programme_name, "en"));
}

export async function listDeadlines(): Promise<Deadline[]> {
  const supabase = await db();
  return must(await supabase.from("deadlines").select(DEADLINE_COLUMNS), "deadlines") as Deadline[];
}

export async function getDeadlinesForProgramme(programmeId: string): Promise<Deadline[]> {
  if (!idSchema.safeParse(programmeId).success) return [];
  const supabase = await db();
  return must(await supabase.from("deadlines").select(DEADLINE_COLUMNS).eq("programme_id", programmeId), "deadlines") as Deadline[];
}

export async function getTask(id: string): Promise<Task> {
  if (!idSchema.safeParse(id).success) notFound();
  const supabase = await db();
  const r = await supabase.from("tasks").select(TASK_COLUMNS).eq("id", id).maybeSingle();
  if (r.error) throw new Error("Could not load the task.");
  if (!r.data) notFound(); // missing, or not yours: RLS makes both look the same
  return r.data as Task;
}

export async function getDeadline(id: string): Promise<Deadline> {
  if (!idSchema.safeParse(id).success) notFound();
  const supabase = await db();
  const r = await supabase.from("deadlines").select(DEADLINE_COLUMNS).eq("id", id).maybeSingle();
  if (r.error) throw new Error("Could not load the deadline.");
  if (!r.data) notFound();
  return r.data as Deadline;
}
