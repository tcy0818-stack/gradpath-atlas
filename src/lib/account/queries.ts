import "server-only";
import { db, must } from "@/lib/db";

export type ResetImpact = {
  programmes: number;
  documents: number;
  tasks: number;
  deadlines: number;
  /** Things you created yourself that sit inside a fictional programme and would go with it. */
  yourTasksInExamples: number;
  yourDeadlinesInExamples: number;
  /** Links from your own programmes' requirements to fictional documents (the links go; your programmes stay). */
  yourLinksToExampleDocuments: number;
  /** Your own tasks that wait on a fictional task; they stay and become unblocked. */
  yourTasksUnblocked: number;
};

/**
 * What reset_demo_data() (0009) would remove for this user, counted through their own session. It deletes rows with a
 * sample_key; deleting a programme also deletes everything inside it, which is why user-made tasks and deadlines in a
 * fictional programme are counted separately. Requirements carry no marker, so any you added inside an example go too.
 */
export async function getResetImpact(): Promise<ResetImpact> {
  const supabase = await db();
  const [p, d, t, dl] = await Promise.all([
    supabase.from("programmes").select("id").not("sample_key", "is", null),
    supabase.from("documents").select("id").not("sample_key", "is", null),
    supabase.from("tasks").select("id, programme_id, sample_key, prerequisite_task_id"),
    supabase.from("deadlines").select("id, programme_id, sample_key"),
  ]);
  const progIds = new Set(must(p, "programmes").map((x) => x.id as string));
  const docIds = must(d, "documents").map((x) => x.id as string);
  const tasks = must(t, "tasks") as { id: string; programme_id: string | null; sample_key: string | null; prerequisite_task_id: string | null }[];
  const deadlines = must(dl, "deadlines") as { programme_id: string | null; sample_key: string | null }[];
  const sampleTaskIds = new Set(tasks.filter((x) => x.sample_key).map((x) => x.id));
  const inExample = (id: string | null) => id != null && progIds.has(id);

  let linksFromYours = 0;
  if (docIds.length) {
    const links = must(await supabase.from("requirement_documents").select("requirement_id").in("document_id", docIds), "document links") as { requirement_id: string }[];
    if (links.length) {
      const reqs = must(await supabase.from("requirements").select("id, programme_id").in("id", links.map((l) => l.requirement_id)), "requirements") as { programme_id: string }[];
      linksFromYours = reqs.filter((r) => !progIds.has(r.programme_id)).length;
    }
  }

  return {
    programmes: progIds.size,
    documents: docIds.length,
    tasks: tasks.filter((x) => x.sample_key || inExample(x.programme_id)).length,
    deadlines: deadlines.filter((x) => x.sample_key || inExample(x.programme_id)).length,
    yourTasksInExamples: tasks.filter((x) => !x.sample_key && inExample(x.programme_id)).length,
    yourDeadlinesInExamples: deadlines.filter((x) => !x.sample_key && inExample(x.programme_id)).length,
    yourLinksToExampleDocuments: linksFromYours,
    yourTasksUnblocked: tasks.filter((x) => !x.sample_key && !inExample(x.programme_id) && x.prerequisite_task_id != null && sampleTaskIds.has(x.prerequisite_task_id)).length,
  };
}
