// Two-real-user isolation check through the ordinary Supabase API (M3.11, SEC-02, SEC-06).
// Uses only the publishable key and two normal user sessions; no secret/admin key anywhere.
// Run it yourself:  npm run check:api-isolation   (needs the TEST_USER_* values in .env.local, see .env.example).
// Everything it creates is named "api-isolation-<id>" and is deleted at the end. It never prints passwords or tokens.
import { createClient } from "@supabase/supabase-js";

const need = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD", "TEST_USER_B_EMAIL", "TEST_USER_B_PASSWORD"];
const missing = need.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(", ")}. See .env.example (TEST_USER_* are two throw-away confirmed accounts you created).`);
  process.exit(2);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const fresh = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${ok ? "" : detail ? ` (${detail})` : ""}`);
};
const code = (res) => res.error?.code ?? (res.error ? "error" : "none");

async function signIn(email, password, who) {
  const c = fresh();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`Could not sign in as user ${who} (${error.code ?? "error"}). Create and confirm the account first, and check the .env.local values.`);
    process.exit(2);
  }
  return { client: c, id: data.user.id };
}

const A = await signIn(process.env.TEST_USER_A_EMAIL, process.env.TEST_USER_A_PASSWORD, "A");
const B = await signIn(process.env.TEST_USER_B_EMAIL, process.env.TEST_USER_B_PASSWORD, "B");
if (A.id === B.id) {
  console.error("TEST_USER_A and TEST_USER_B are the same account; they must differ.");
  process.exit(2);
}
const tag = `api-isolation-${Date.now()}`;

try {
  // --- user A creates data -------------------------------------------------------------------------------------
  const prog = await A.client.from("programmes").insert({ university_name: tag, programme_name: "A programme" }).select().single();
  const req = await A.client.from("requirements").insert({ programme_id: prog.data?.id, requirement_type: "transcript", level: "required" }).select().single();
  const doc = await A.client.from("documents").insert({ title: tag, doc_type: "transcript" }).select().single();
  const task = await A.client.from("tasks").insert({ title: tag }).select().single();
  check("A can create a programme, requirement, document and task", [prog, req, doc, task].every((r) => !r.error), code(prog) + code(req) + code(doc) + code(task));
  if ([prog, req, doc, task].some((r) => r.error)) throw new Error("setup failed");

  const pid = prog.data.id;

  // --- user B tries to read / change A's data ------------------------------------------------------------------
  const read = await B.client.from("programmes").select("id").eq("id", pid);
  check("B cannot read A's programme", !read.error && read.data.length === 0, code(read));
  const readReq = await B.client.from("requirements").select("id").eq("id", req.data.id);
  check("B cannot read A's requirement", !readReq.error && readReq.data.length === 0, code(readReq));
  const upd = await B.client.from("programmes").update({ programme_name: "hacked" }).eq("id", pid).select();
  check("B cannot update A's programme", !upd.error && upd.data.length === 0, code(upd));
  const del = await B.client.from("programmes").delete().eq("id", pid).select();
  check("B cannot delete A's programme", !del.error && del.data.length === 0, code(del));
  const still = await A.client.from("programmes").select("programme_name").eq("id", pid).single();
  check("A's programme is unchanged afterwards", still.data?.programme_name === "A programme", code(still));

  // --- Phase 3 operations: requirements, deadlines, status history, shortlist ---------------------------------
  const dl = await A.client.from("deadlines").insert({ programme_id: pid, deadline_type: "submission", title: tag, due_date: "2027-01-15" }).select().single();
  check("A can set a submission deadline", !dl.error, code(dl));
  const reqUpd = await B.client.from("requirements").update({ level: "optional" }).eq("id", req.data.id).select();
  check("B cannot update A's requirement", !reqUpd.error && reqUpd.data.length === 0, code(reqUpd));
  const reqDel = await B.client.from("requirements").delete().eq("id", req.data.id).select();
  check("B cannot delete A's requirement", !reqDel.error && reqDel.data.length === 0, code(reqDel));
  const dlRead = await B.client.from("deadlines").select("id").eq("programme_id", pid);
  check("B cannot read A's deadlines", !dlRead.error && dlRead.data.length === 0, code(dlRead));
  const dlUpd = await B.client.from("deadlines").update({ due_date: "2030-01-01" }).eq("programme_id", pid).select();
  check("B cannot change A's deadline", !dlUpd.error && dlUpd.data.length === 0, code(dlUpd));
  const histRead = await B.client.from("programme_status_history").select("id").eq("programme_id", pid);
  check("B cannot read A's status history", !histRead.error && histRead.data.length === 0, code(histRead));
  const star = await B.client.from("programmes").update({ is_shortlisted: true }).eq("id", pid).select();
  check("B cannot shortlist or change A's programme status", !star.error && star.data.length === 0, code(star));
  const statusA = await A.client.from("programmes").update({ status: "preparing" }).eq("id", pid).select("status").single();
  const histA = await A.client.from("programme_status_history").select("to_status").eq("programme_id", pid);
  check("A's own status change is recorded in history", statusA.data?.status === "preparing" && histA.data?.some((h) => h.to_status === "preparing"), code(statusA) + code(histA));

  // --- forged relationships ------------------------------------------------------------------------------------
  const asOwner = await B.client.from("programmes").insert({ owner_id: A.id, university_name: tag, programme_name: "forged owner" });
  check("B cannot insert a row owned by A (RLS)", code(asOwner) === "42501", code(asOwner));
  const t1 = await B.client.from("tasks").insert({ title: tag, programme_id: pid });
  check("B cannot attach a task to A's programme (FK)", code(t1) === "23503", code(t1));
  const t2 = await B.client.from("tasks").insert({ title: tag, prerequisite_task_id: task.data.id });
  check("B cannot use A's task as a prerequisite (FK)", code(t2) === "23503", code(t2));
  const d1 = await B.client.from("deadlines").insert({ title: tag, deadline_type: "milestone", due_date: "2027-01-01", programme_id: pid });
  check("B cannot attach a deadline to A's programme (FK)", code(d1) === "23503", code(d1));
  const r1 = await B.client.from("requirements").insert({ programme_id: pid, requirement_type: "cv" });
  check("B cannot add a requirement to A's programme (FK)", code(r1) === "23503", code(r1));
  const bDoc = await B.client.from("documents").insert({ title: tag, doc_type: "cv" }).select().single();
  const l1 = await B.client.from("requirement_documents").insert({ requirement_id: req.data.id, document_id: bDoc.data?.id });
  check("B cannot link B's document to A's requirement (FK)", code(l1) === "23503", code(l1));
  const l2 = await B.client.from("requirement_documents").insert({ requirement_id: req.data.id, document_id: doc.data.id });
  check("B cannot link A's document to A's requirement (FK)", code(l2) === "23503", code(l2));

  // --- Phase 4: documents and links ---------------------------------------------------------------------------
  const ownLink = await A.client.from("requirement_documents").insert({ requirement_id: req.data.id, document_id: doc.data.id });
  check("A can link A's document to A's requirement", !ownLink.error, code(ownLink));
  const docRead = await B.client.from("documents").select("id").eq("id", doc.data.id);
  check("B cannot read A's document", !docRead.error && docRead.data.length === 0, code(docRead));
  const linkRead = await B.client.from("requirement_documents").select("document_id").eq("document_id", doc.data.id);
  check("B cannot read A's document links", !linkRead.error && linkRead.data.length === 0, code(linkRead));
  const docUpd = await B.client.from("documents").update({ prep_status: "ready" }).eq("id", doc.data.id).select();
  check("B cannot change A's document", !docUpd.error && docUpd.data.length === 0, code(docUpd));
  const linkDel = await B.client.from("requirement_documents").delete().eq("document_id", doc.data.id).select();
  check("B cannot unlink A's document", !linkDel.error && linkDel.data.length === 0, code(linkDel));
  const docDel = await B.client.from("documents").delete().eq("id", doc.data.id).select();
  check("B cannot delete A's document", !docDel.error && docDel.data.length === 0, code(docDel));
  const linkStill = await A.client.from("requirement_documents").select("document_id").eq("document_id", doc.data.id);
  check("A's document and link are unchanged afterwards", linkStill.data?.length === 1, code(linkStill));

  // --- Phase 5: tasks and deadlines ----------------------------------------------------------------------------
  const dep = await A.client.from("tasks").insert({ title: tag, prerequisite_task_id: task.data.id, programme_id: pid }).select().single();
  check("A can create a task that depends on A's task", !dep.error, code(dep));
  const tRead = await B.client.from("tasks").select("id").eq("id", task.data.id);
  check("B cannot read A's task", !tRead.error && tRead.data.length === 0, code(tRead));
  const tUpd = await B.client.from("tasks").update({ status: "done" }).eq("id", task.data.id).select();
  check("B cannot complete A's task", !tUpd.error && tUpd.data.length === 0, code(tUpd));
  const tDel = await B.client.from("tasks").delete().eq("id", task.data.id).select();
  check("B cannot delete A's task", !tDel.error && tDel.data.length === 0, code(tDel));
  const blockedDone = await A.client.from("tasks").update({ status: "done" }).eq("id", dep.data?.id);
  check("A cannot complete a task whose prerequisite is not done (database rule)", code(blockedDone) === "23514", code(blockedDone));
  const loop = await A.client.from("tasks").update({ prerequisite_task_id: dep.data?.id }).eq("id", task.data.id);
  check("A cannot create a prerequisite cycle (database rule)", code(loop) === "23514", code(loop));
  const selfDep = await A.client.from("tasks").update({ prerequisite_task_id: task.data.id }).eq("id", task.data.id);
  check("A cannot make a task its own prerequisite", Boolean(selfDep.error), code(selfDep));
  const subDup = await A.client.from("deadlines").insert({ programme_id: pid, deadline_type: "submission", title: tag, due_date: "2027-02-01" });
  check("A cannot add a second submission deadline to a programme", code(subDup) === "23505", code(subDup));
  const miles = await A.client.from("deadlines").insert({ programme_id: pid, deadline_type: "milestone", title: tag, due_date: "2027-01-05" }).select().single();
  check("A can add a milestone", !miles.error, code(miles));
  const mDel = await B.client.from("deadlines").delete().eq("programme_id", pid).select();
  check("B cannot delete A's deadlines", !mDel.error && mDel.data.length === 0, code(mDel));
  const mDone = await B.client.from("deadlines").update({ is_done: true }).eq("id", miles.data?.id).select();
  check("B cannot mark A's milestone done", !mDone.error && mDone.data.length === 0, code(mDone));
  const planB = await B.client.rpc("seed_demo_planning", { p_seed_date: new Date().toISOString().slice(0, 10) });
  const planAnon = await fresh().rpc("seed_demo_planning", { p_seed_date: "2026-10-25" });
  check("B can run the planning seed for B's own account; anon is refused", !planB.error && Boolean(planAnon.error), code(planB) + code(planAnon));
  await B.client.rpc("reset_demo_data");

  // --- profiles, history, demo-data functions ------------------------------------------------------------------
  const prof = await B.client.from("profiles").select("id");
  check("B sees only B's own profile", !prof.error && prof.data.length === 1 && prof.data[0].id === B.id, code(prof));
  // Simulated plan label (Phase 7): a profile update by B must not reach A's row. Nothing is written to A's profile.
  const planOther = await B.client.from("profiles").update({ demo_plan: "season_pass" }).eq("id", A.id).select("id");
  check("B cannot change A's simulated plan", !planOther.error && planOther.data.length === 0, code(planOther));
  const hist = await A.client.from("programme_status_history").insert({ owner_id: A.id, programme_id: pid, to_status: "withdrawn" });
  check("A cannot write status history", code(hist) === "42501", code(hist));
  const seed = await B.client.rpc("seed_demo_data", { p_seed_date: new Date().toISOString().slice(0, 10) });
  const reset = await B.client.rpc("reset_demo_data");
  check("B can seed and reset B's own demo data", !seed.error && !reset.error, code(seed) + code(reset));
  const aAfter = await A.client.from("programmes").select("id").eq("id", pid);
  check("B's reset did not touch A's data", aAfter.data?.length === 1, code(aAfter));

  // --- anonymous caller ----------------------------------------------------------------------------------------
  const anon = fresh();
  const anonRead = await anon.from("programmes").select("id").limit(1);
  check("anon cannot read programmes", Boolean(anonRead.error) || anonRead.data.length === 0, code(anonRead));
  const anonSeed = await anon.rpc("seed_demo_data", { p_seed_date: "2026-10-25" });
  check("anon cannot run seed_demo_data", Boolean(anonSeed.error), code(anonSeed));
  await B.client.from("documents").delete().eq("id", bDoc.data?.id);
} catch (e) {
  console.error(`Check aborted: ${e.message}`);
  results.push(false);
} finally {
  // cleanup, as the owner (RLS only lets each user delete their own rows)
  await A.client.from("programmes").delete().eq("university_name", tag);
  await A.client.from("documents").delete().eq("title", tag);
  await A.client.from("tasks").delete().eq("title", tag);
  await B.client.from("documents").delete().eq("title", tag);
  await A.client.auth.signOut();
  await B.client.auth.signOut();
}

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
