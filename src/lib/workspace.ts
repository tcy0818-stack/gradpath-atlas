import "server-only";
import { getProfile } from "@/lib/auth/dal";
import { todayInZone } from "@/lib/dates";
import { summarise } from "@/lib/dashboard";
import { db, must } from "@/lib/db";
import type { Deadline } from "@/lib/deadlines";
import { loadLinkedDocs } from "@/lib/documents/queries";
import type { DocumentRow } from "@/lib/documents/types";
import type { Programme, Requirement } from "@/lib/programmes/types";
import type { Task } from "@/lib/tasks";

/** One read of everything the dashboard, adviser preview and exports show, through the signed-in user's own session (RLS). */
export async function loadWorkspace() {
  const supabase = await db();
  const [p, r, d, t, docs, profile] = await Promise.all([
    supabase.from("programmes").select("*"),
    supabase.from("requirements").select("*"),
    supabase.from("deadlines").select("id, programme_id, deadline_type, title, due_date, is_done, sample_key"),
    supabase.from("tasks").select("id, programme_id, title, due_date, priority, status, prerequisite_task_id, completed_at, sample_key"),
    supabase.from("documents").select("*").order("title"),
    getProfile(),
  ]);
  const requirements = must(r, "requirements") as Requirement[];
  const linked = await loadLinkedDocs(supabase, requirements.map((x) => x.id));
  const workspace = summarise({
    today: todayInZone(profile.timeZone),
    programmes: must(p, "programmes") as Programme[],
    requirements,
    linked,
    deadlines: must(d, "deadlines") as Deadline[],
    tasks: must(t, "tasks") as Task[],
  });
  return { workspace, documents: must(docs, "documents") as DocumentRow[] };
}
