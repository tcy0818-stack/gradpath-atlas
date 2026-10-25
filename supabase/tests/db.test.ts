// Database behaviour tests (M2.10, M2.11, M2.13) against a real PostgreSQL engine (PGlite, in-process).
// This proves the migrations' SQL logic. It is NOT a test of a hosted Supabase project; see tasklist M2.12.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const dir = "supabase";
let db: PGlite;
let A: string;
let B: string;

async function as<T>(uid: string | null, role: "authenticated" | "anon", fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role`);
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}
const asA = <T>(fn: () => Promise<T>) => as(A, "authenticated", fn);
const asB = <T>(fn: () => Promise<T>) => as(B, "authenticated", fn);

/** Resolves to the Postgres SQLSTATE of a failing statement, or "ok". */
async function code(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
    return "ok";
  } catch (e) {
    return (e as { code?: string }).code ?? `no-code: ${(e as Error).message}`;
  }
}
const one = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) =>
  (await db.query<T>(sql, p)).rows[0];
const count = async (table: string, where = "true") =>
  Number((await one<{ n: number }>(`select count(*)::int as n from public.${table} where ${where}`)).n);

const prog = async (name = "P") =>
  (await one<{ id: string }>(`insert into public.programmes (university_name, programme_name) values ('U', $1) returning id`, [name])).id;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(dir, "tests/auth_shim.sql"), "utf8"));
  for (const f of readdirSync(join(dir, "migrations")).sort()) {
    await db.exec(readFileSync(join(dir, "migrations", f), "utf8"));
  }
  A = (await one<{ id: string }>(`insert into auth.users (email) values ('a@example.com') returning id`)).id;
  B = (await one<{ id: string }>(`insert into auth.users (email) values ('b@example.com') returning id`)).id;
});

const OWNER_TABLES = ["programmes", "requirements", "documents", "requirement_documents", "deadlines", "tasks"];

describe("RLS coverage (SEC-01)", () => {
  it("every public table has RLS enabled", async () => {
    const rows = (await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' order by 1`,
    )).rows;
    expect(rows.map((r) => r.relname).sort()).toEqual(
      [...OWNER_TABLES, "profiles", "programme_status_history"].sort(),
    );
    expect(rows.filter((r) => !r.relrowsecurity)).toEqual([]);
  });

  it("owner tables have select/insert/update/delete policies; profiles select/update; history select only", async () => {
    const rows = (await db.query<{ tablename: string; cmd: string; qual: string | null; with_check: string | null }>(
      `select tablename, cmd, qual, with_check from pg_policies where schemaname = 'public'`,
    )).rows;
    const ops = (t: string) => rows.filter((r) => r.tablename === t).map((r) => r.cmd).sort();
    for (const t of OWNER_TABLES) expect(ops(t)).toEqual(["DELETE", "INSERT", "SELECT", "UPDATE"]);
    expect(ops("profiles")).toEqual(["SELECT", "UPDATE"]);
    expect(ops("programme_status_history")).toEqual(["SELECT"]);
    // no unrestricted policy anywhere
    expect(rows.filter((r) => r.qual?.trim() === "true" || r.with_check?.trim() === "true")).toEqual([]);
  });

  it("anon has no table privileges at all", async () => {
    const tables = [...OWNER_TABLES, "profiles", "programme_status_history"];
    for (const t of tables) {
      for (const priv of ["select", "insert", "update", "delete"]) {
        const r = await one<{ ok: boolean }>(`select has_table_privilege('anon', 'public.${t}', '${priv}') as ok`);
        expect(r.ok, `${t} ${priv}`).toBe(false);
      }
    }
  });

  it("rls_coverage.sql returns zero rows, and does flag a missing policy", async () => {
    const sql = readFileSync(join(dir, "tests/rls_coverage.sql"), "utf8");
    expect((await db.query(sql)).rows).toEqual([]);
    await db.exec(`begin; drop policy programmes_delete on public.programmes`);
    try {
      expect((await db.query<{ problem: string }>(sql)).rows).toEqual([
        { problem_object: "programmes", problem: "missing DELETE policy" },
      ]);
    } finally {
      await db.exec(`rollback`);
    }
    expect((await db.query(sql)).rows).toEqual([]);
  });

  it("hosted_authz_check.sql runs clean here, reports only PASS, and leaves no data behind", async () => {
    const before = [await count("programmes"), await count("profiles")];
    const results = await db.exec(readFileSync(join(dir, "tests/hosted_authz_check.sql"), "utf8"));
    const lines = (results[results.length - 1].rows as Record<string, string>[]).map((r) => Object.values(r)[0]);
    expect(lines.filter((l) => !l.startsWith("PASS"))).toEqual([]);
    expect(lines.length).toBeGreaterThanOrEqual(16);
    expect([await count("programmes"), await count("profiles")]).toEqual(before);
  });

  it("trigger functions are not executable by API roles", async () => {
    for (const fn of ["handle_new_user", "tasks_guard", "log_programme_status"]) {
      for (const role of ["anon", "authenticated"]) {
        const r = await one<{ ok: boolean }>(`select has_function_privilege('${role}', 'public.${fn}()', 'execute') as ok`);
        expect(r.ok, `${role} ${fn}`).toBe(false);
      }
    }
  });
});

describe("row isolation between users (SEC-01, SEC-06)", () => {
  it("B cannot read, update or delete A's rows and cannot insert as A", async () => {
    const pid = await asA(() => prog("A-only"));
    expect(await asA(() => count("programmes", `id = '${pid}'`))).toBe(1);
    expect(await asB(() => count("programmes", `id = '${pid}'`))).toBe(0);
    await asB(async () => {
      const u = await db.query(`update public.programmes set programme_name = 'hacked' where id = $1 returning id`, [pid]);
      expect(u.rows).toHaveLength(0);
      const d = await db.query(`delete from public.programmes where id = $1 returning id`, [pid]);
      expect(d.rows).toHaveLength(0);
    });
    expect(await asB(() => code(() =>
      db.query(`insert into public.programmes (owner_id, university_name, programme_name) values ($1, 'x', 'y')`, [A]),
    ))).toBe("42501");
    expect((await asA(() => one<{ programme_name: string }>(`select programme_name from public.programmes where id = '${pid}'`))).programme_name).toBe("A-only");
  });

  it("anon sees and writes nothing", async () => {
    expect(await as(null, "anon", () => code(() => db.query(`select * from public.programmes`)))).toBe("42501");
    expect(await as(null, "anon", () => code(() =>
      db.query(`insert into public.programmes (university_name, programme_name) values ('x','y')`)))).toBe("42501");
  });

  it("owner cannot be reassigned by an update", async () => {
    const pid = await asA(() => prog("mine"));
    expect(await asA(() => code(() => db.query(`update public.programmes set owner_id = $1 where id = $2`, [B, pid])))).toBe("42501");
  });
});

describe("forged cross-owner relationships fail at the database (SEC-02)", () => {
  let aProg: string, aReq: string, aDoc: string, aTask: string;
  let bReq: string, bDoc: string;

  beforeAll(async () => {
    await asA(async () => {
      aProg = await prog("forge-target");
      aReq = (await one<{ id: string }>(`insert into public.requirements (programme_id, requirement_type, level) values ($1,'transcript','required') returning id`, [aProg])).id;
      aDoc = (await one<{ id: string }>(`insert into public.documents (title, doc_type) values ('A doc','transcript') returning id`)).id;
      aTask = (await one<{ id: string }>(`insert into public.tasks (title) values ('A task') returning id`)).id;
    });
    const bProg = await asB(() => prog("b-prog"));
    await asB(async () => {
      bReq = (await one<{ id: string }>(`insert into public.requirements (programme_id, requirement_type, level) values ($1,'cv','required') returning id`, [bProg])).id;
      bDoc = (await one<{ id: string }>(`insert into public.documents (title, doc_type) values ('B doc','cv') returning id`)).id;
    });
  });

  const fk = "23503";
  it("task, deadline, requirement may not point at another user's programme", async () => {
    expect(await asB(() => code(() => db.query(`insert into public.tasks (title, programme_id) values ('t', $1)`, [aProg])))).toBe(fk);
    expect(await asB(() => code(() => db.query(`insert into public.deadlines (title, deadline_type, due_date, programme_id) values ('d','milestone','2026-01-01',$1)`, [aProg])))).toBe(fk);
    expect(await asB(() => code(() => db.query(`insert into public.requirements (programme_id, requirement_type) values ($1,'cv')`, [aProg])))).toBe(fk);
  });

  it("document links may not cross owners in either direction", async () => {
    expect(await asB(() => code(() => db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1,$2)`, [bReq, aDoc])))).toBe(fk);
    expect(await asB(() => code(() => db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1,$2)`, [aReq, bDoc])))).toBe(fk);
    expect(await asB(() => code(() => db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1,$2)`, [aReq, aDoc])))).toBe(fk);
  });

  it("a prerequisite may not be another user's task", async () => {
    expect(await asB(() => code(() => db.query(`insert into public.tasks (title, prerequisite_task_id) values ('t', $1)`, [aTask])))).toBe(fk);
  });

  it("a forged link to a real foreign UUID fails the same way as a random UUID (no existence leak)", async () => {
    const random = "00000000-0000-4000-8000-000000000001";
    const real = await asB(() => code(() => db.query(`insert into public.tasks (title, programme_id) values ('t', $1)`, [aProg])));
    const fake = await asB(() => code(() => db.query(`insert into public.tasks (title, programme_id) values ('t', $1)`, [random])));
    expect(real).toBe(fake);
  });

  it("legitimate same-owner links work", async () => {
    expect(await asA(() => code(() => db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1,$2)`, [aReq, aDoc])))).toBe("ok");
  });

  it("users cannot write status history, even for their own programme", async () => {
    const pid = await asA(() => prog("hist"));
    expect(await asA(() => code(() =>
      db.query(`insert into public.programme_status_history (owner_id, programme_id, to_status) values ($1,$2,'withdrawn')`, [A, pid])))).toBe("42501");
    expect(await asA(() => code(() => db.query(`delete from public.programme_status_history where programme_id = $1`, [pid])))).toBe("42501");
    expect(await asA(() => code(() => db.query(`update public.programme_status_history set to_status='x' where programme_id = $1`, [pid])))).toBe("42501");
  });
});

describe("programme constraints (PRG-03)", () => {
  const ins = (cols: string, vals: string) => () =>
    db.query(`insert into public.programmes (university_name, programme_name, ${cols}) values ('U','P', ${vals})`);

  it("unknown / not-applicable tuition can never be stored as an amount (including 0)", async () => {
    expect(await asA(() => code(ins("tuition_state", "'unknown'")))).toBe("ok");
    expect(await asA(() => code(ins("tuition_state, tuition_amount, tuition_currency", "'unknown', 0, 'GBP'")))).toBe("23514");
    expect(await asA(() => code(ins("tuition_state, tuition_amount, tuition_currency", "'not_applicable', 0, null")))).toBe("23514");
    expect(await asA(() => code(ins("tuition_state", "'known'")))).toBe("23514");
    expect(await asA(() => code(ins("tuition_state, tuition_amount", "'known', 100")))).toBe("23514");
  });

  it("known tuition needs a valid upper-case ISO-style currency and a non-negative amount", async () => {
    expect(await asA(() => code(ins("tuition_state, tuition_amount, tuition_currency", "'known', 100, 'gbp'")))).toBe("23514");
    expect(await asA(() => code(ins("tuition_state, tuition_amount, tuition_currency", "'known', -1, 'GBP'")))).toBe("23514");
    expect(await asA(() => code(ins("tuition_state, tuition_amount, tuition_currency", "'known', 0, 'GBP'")))).toBe("ok");
  });

  it("rejects bad status and blank names", async () => {
    expect(await asA(() => code(ins("status", "'bogus'")))).toBe("23514");
    expect(await asA(() => code(() => db.query(`insert into public.programmes (university_name, programme_name) values ('  ','P')`)))).toBe("23514");
  });
});

describe("deadlines and requirements constraints", () => {
  it("one submission deadline per programme; submission needs a programme; dates are plain dates", async () => {
    const pid = await asA(() => prog("dl"));
    const add = (type: string, pidv: string | null, date = "2027-01-31") => () =>
      db.query(`insert into public.deadlines (title, deadline_type, due_date, programme_id) values ('d', $1, $2, $3)`, [type, date, pidv]);
    expect(await asA(() => code(add("submission", pid)))).toBe("ok");
    expect(await asA(() => code(add("submission", pid)))).toBe("23505");
    expect(await asA(() => code(add("milestone", pid)))).toBe("ok");
    expect(await asA(() => code(add("submission", null)))).toBe("23514");
    const r = await asA(() => one<{ d: string }>(`select due_date::text as d from public.deadlines where programme_id = '${pid}' and deadline_type='submission'`));
    expect(r.d).toBe("2027-01-31");
  });

  it("one requirement per type except 'other'; quantity 1..10", async () => {
    const pid = await asA(() => prog("rq"));
    const add = (type: string, q = 1) => () =>
      db.query(`insert into public.requirements (programme_id, requirement_type, quantity) values ($1,$2,$3)`, [pid, type, q]);
    expect(await asA(() => code(add("cv")))).toBe("ok");
    expect(await asA(() => code(add("cv")))).toBe("23505");
    expect(await asA(() => code(add("other")))).toBe("ok");
    expect(await asA(() => code(add("other")))).toBe("ok");
    expect(await asA(() => code(add("references", 0)))).toBe("23514");
    expect(await asA(() => code(add("references", 11)))).toBe("23514");
  });
});

describe("task dependencies (TSK-03..05)", () => {
  const mk = (title: string, prereq: string | null = null, status = "todo") => () =>
    one<{ id: string }>(`insert into public.tasks (title, prerequisite_task_id, status) values ($1,$2,$3) returning id`, [title, prereq, status]);

  it("rejects self-dependency, two-node and three-node cycles", async () => {
    const t1 = (await asA(mk("t1"))).id;
    const t2 = (await asA(mk("t2", t1))).id;
    const t3 = (await asA(mk("t3", t2))).id;
    const upd = (id: string, prereq: string) => () => db.query(`update public.tasks set prerequisite_task_id = $2 where id = $1`, [id, prereq]);
    expect(await asA(() => code(upd(t1, t1)))).toBe("23514"); // self
    expect(await asA(() => code(upd(t1, t2)))).toBe("23514"); // 2-cycle
    expect(await asA(() => code(upd(t1, t3)))).toBe("23514"); // 3-cycle
  });

  it("cannot be done while the prerequisite is not done; can be once it is; completed_at follows status", async () => {
    const pre = (await asA(mk("pre"))).id;
    const dep = (await asA(mk("dep", pre))).id;
    const done = (id: string) => () => db.query(`update public.tasks set status = 'done' where id = $1`, [id]);
    expect(await asA(() => code(done(dep)))).toBe("23514");
    expect(await asA(() => code(() => db.query(`insert into public.tasks (title, prerequisite_task_id, status) values ('x',$1,'done')`, [pre])))).toBe("23514");
    expect(await asA(() => code(done(pre)))).toBe("ok");
    expect(await asA(() => code(done(dep)))).toBe("ok");
    const r = await asA(() => one<{ c: boolean }>(`select completed_at is not null as c from public.tasks where id = '${dep}'`));
    expect(r.c).toBe(true);
    await asA(() => db.query(`update public.tasks set status = 'todo' where id = $1`, [dep]));
    const r2 = await asA(() => one<{ c: boolean }>(`select completed_at is null as c from public.tasks where id = '${dep}'`));
    expect(r2.c).toBe(true);
  });

  it("deleting a prerequisite keeps the dependent and clears the link without touching owner_id", async () => {
    const pre = (await asA(mk("gone"))).id;
    const dep = (await asA(mk("stays", pre))).id;
    await asA(() => db.query(`delete from public.tasks where id = $1`, [pre]));
    const r = await asA(() => one<{ p: string | null; o: string }>(`select prerequisite_task_id as p, owner_id as o from public.tasks where id = '${dep}'`));
    expect(r.p).toBeNull();
    expect(r.o).toBe(A);
  });
});

describe("status history (PRG-06)", () => {
  it("logs creation and each real status change, but not other edits", async () => {
    const pid = await asA(() => prog("h"));
    const rows = () => asA(async () => (await db.query<{ f: string | null; t: string }>(
      `select from_status as f, to_status as t from public.programme_status_history where programme_id = $1 order by changed_at, t`, [pid])).rows);
    expect(await rows()).toEqual([{ f: null, t: "researching" }]);
    await asA(() => db.query(`update public.programmes set notes = 'x' where id = $1`, [pid]));
    await asA(() => db.query(`update public.programmes set status = 'preparing' where id = $1`, [pid]));
    await asA(() => db.query(`update public.programmes set status = 'preparing' where id = $1`, [pid]));
    expect(await rows()).toEqual([{ f: null, t: "researching" }, { f: "researching", t: "preparing" }]);
    expect(await asB(() => count("programme_status_history", `programme_id = '${pid}'`))).toBe(0);
  });
});

describe("profiles", () => {
  it("is created for each new auth user; own row only; no insert or delete by users", async () => {
    expect(await count("profiles", `id in ('${A}','${B}')`)).toBe(2);
    expect(await asA(() => count("profiles"))).toBe(1);
    expect(await asA(() => code(() => db.query(`update public.profiles set display_name='A', demo_plan='season_pass' where id=$1`, [A])))).toBe("ok");
    const other = await asA(() => db.query(`update public.profiles set display_name='x' where id=$1 returning id`, [B]));
    expect(other.rows).toHaveLength(0);
    expect(await asA(() => code(() => db.query(`update public.profiles set demo_plan='gold' where id=$1`, [A])))).toBe("23514");
    expect(await asA(() => code(() => db.query(`insert into public.profiles (id) values (gen_random_uuid())`)))).toBe("42501");
    expect(await asA(() => code(() => db.query(`delete from public.profiles where id=$1`, [A])))).toBe("42501");
  });
});

describe("simulated plan (PUB-03)", () => {
  it("stores only the plan label and time on the caller's own profile; others and anon cannot change it", async () => {
    await asA(() => db.query(`update public.profiles set demo_plan='season_pass', demo_plan_selected_at=now() where id=$1`, [A]));
    const own = await one<{ demo_plan: string; chosen: boolean }>(`select demo_plan, demo_plan_selected_at is not null as chosen from public.profiles where id=$1`, [A]);
    expect(own).toEqual({ demo_plan: "season_pass", chosen: true });
    await asA(() => db.query(`update public.profiles set demo_plan='free', demo_plan_selected_at=null where id=$1`, [A]));
    expect((await one<{ demo_plan: string }>(`select demo_plan from public.profiles where id=$1`, [A])).demo_plan).toBe("free");
    const other = await as(B, "authenticated", () => db.query(`update public.profiles set demo_plan='season_pass' where id=$1 returning id`, [A]));
    expect(other.rows).toHaveLength(0);
    expect(await as(null, "anon", () => code(() => db.query(`update public.profiles set demo_plan='season_pass' where id=$1`, [A])))).toBe("42501");
    expect((await one<{ demo_plan: string }>(`select demo_plan from public.profiles where id=$1`, [A])).demo_plan).toBe("free");
  });
});

describe("cascade rules", () => {
  it("deleting a programme removes its children and links but keeps reusable documents used elsewhere", async () => {
    await asA(async () => {
      const p1 = await prog("casc1");
      const p2 = await prog("casc2");
      const mkReq = async (p: string) => (await one<{ id: string }>(`insert into public.requirements (programme_id, requirement_type, level) values ($1,'transcript','required') returning id`, [p])).id;
      const r1 = await mkReq(p1);
      const r2 = await mkReq(p2);
      const doc = (await one<{ id: string }>(`insert into public.documents (title, doc_type) values ('shared','transcript') returning id`)).id;
      await db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1,$3),($2,$3)`, [r1, r2, doc]);
      await db.query(`insert into public.deadlines (title, deadline_type, due_date, programme_id) values ('d','submission','2027-01-01',$1)`, [p1]);
      await db.query(`insert into public.tasks (title, programme_id) values ('t',$1)`, [p1]);

      await db.query(`delete from public.programmes where id = $1`, [p1]);

      expect(await count("requirements", `programme_id = '${p1}'`)).toBe(0);
      expect(await count("deadlines", `programme_id = '${p1}'`)).toBe(0);
      expect(await count("tasks", `programme_id = '${p1}'`)).toBe(0);
      expect(await count("programme_status_history", `programme_id = '${p1}'`)).toBe(0);
      expect(await count("documents", `id = '${doc}'`)).toBe(1);
      expect(await count("requirement_documents", `document_id = '${doc}'`)).toBe(1); // link to p2 remains
    });
  });

  it("one document links to two programmes; unlinking one leaves the other; a duplicate link is refused", async () => {
    await asA(async () => {
      const mkReq = async (name: string) => (await one<{ id: string }>(`insert into public.requirements (programme_id, requirement_type) values ($1,'cv') returning id`, [await prog(name)])).id;
      const [r1, r2] = [await mkReq("reuse1"), await mkReq("reuse2")];
      const d = (await one<{ id: string }>(`insert into public.documents (title, doc_type) values ('reused cv','cv') returning id`)).id;
      await db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1,$3),($2,$3)`, [r1, r2, d]);
      expect(await code(() => db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1,$2)`, [r1, d]))).toBe("23505");
      await db.query(`delete from public.requirement_documents where requirement_id = $1 and document_id = $2`, [r1, d]);
      expect(await count("requirement_documents", `document_id = '${d}'`)).toBe(1);
      expect(await count("requirement_documents", `requirement_id = '${r2}'`)).toBe(1);
      expect(await count("documents", `id = '${d}'`)).toBe(1);
    });
  });

  it("prerequisites: blocked completion, self and cycle refused, reopening allowed, deleting a prerequisite unblocks", async () => {
    await asA(async () => {
      const a = (await one<{ id: string }>(`insert into public.tasks (title) values ('first') returning id`)).id;
      const b = (await one<{ id: string }>(`insert into public.tasks (title, prerequisite_task_id) values ('second', $1) returning id`, [a])).id;
      expect(await code(() => db.query(`update public.tasks set status = 'done' where id = $1`, [b]))).toBe("23514"); // blocked
      expect(await code(() => db.query(`update public.tasks set prerequisite_task_id = $1 where id = $1`, [a]))).toBe("23514"); // self
      expect(await code(() => db.query(`update public.tasks set prerequisite_task_id = $2 where id = $1`, [a, b]))).toBe("23514"); // cycle
      await db.query(`update public.tasks set status = 'done' where id = $1`, [a]);
      expect(await code(() => db.query(`update public.tasks set status = 'done' where id = $1`, [b]))).toBe("ok");
      await db.query(`update public.tasks set status = 'todo' where id = $1`, [a]); // reopen the prerequisite
      expect((await one<{ status: string }>(`select status from public.tasks where id = $1`, [b])).status).toBe("done"); // known limit, documented in 0006
      await db.query(`delete from public.tasks where id = $1`, [a]);
      expect((await one<{ p: string | null }>(`select prerequisite_task_id as p from public.tasks where id = $1`, [b])).p).toBeNull();
    });
  });

  it("deleting a document removes only its links", async () => {
    await asA(async () => {
      const p = await prog("casc3");
      const r = (await one<{ id: string }>(`insert into public.requirements (programme_id, requirement_type) values ($1,'cv') returning id`, [p])).id;
      const d = (await one<{ id: string }>(`insert into public.documents (title, doc_type) values ('cv','cv') returning id`)).id;
      await db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1,$2)`, [r, d]);
      await db.query(`delete from public.documents where id = $1`, [d]);
      expect(await count("requirement_documents", `requirement_id = '${r}'`)).toBe(0);
      expect(await count("requirements", `id = '${r}'`)).toBe(1);
    });
  });
});

describe("demo seed and reset (SEED-01..03)", () => {
  const seed = (uid: string, date = "2026-10-25") =>
    as(uid, "authenticated", async () => (await one<{ seed_demo_data: number }>(`select public.seed_demo_data($1::date)`, [date])).seed_demo_data);
  const snapshot = (uid: string) =>
    as(uid, "authenticated", async () => ({
      programmes: await count("programmes", "sample_key is not null"),
      requirements: await count("requirements", "programme_id in (select id from public.programmes where sample_key is not null)"),
      deadlines: await count("deadlines", "sample_key is not null"),
    }));
  let C: string;

  beforeAll(async () => {
    C = (await one<{ id: string }>(`insert into auth.users (email) values ('c@example.com') returning id`)).id;
  });

  it("is idempotent: a second run adds nothing", async () => {
    expect(await seed(C)).toBe(6);
    const first = await snapshot(C);
    expect(first).toEqual({ programmes: 6, requirements: 36, deadlines: 5 });
    expect(await seed(C)).toBe(6);
    expect(await snapshot(C)).toEqual(first);
  });

  it("only affects the caller", async () => {
    expect(await as(B, "authenticated", () => count("programmes", "sample_key is not null"))).toBe(0);
  });

  it("covers the demonstration cases", async () => {
    await as(C, "authenticated", async () => {
      const dates = Object.fromEntries((await db.query<{ k: string; d: string }>(
        `select sample_key as k, due_date::text as d from public.deadlines`)).rows.map((r) => [r.k, r.d]));
      expect(dates["brightwater-data-science-submission"]).toBe("2026-10-20"); // overdue
      expect(dates["eastvale-digital-innovation-submission"]).toBe("2026-10-25"); // today
      expect(dates["aldermoor-marketing-analytics-submission"]).toBe("2026-10-31"); // soon
      expect(dates["dunmere-economics-submission"]).toBeUndefined(); // no deadline
      const t = await one<{ s: string; a: string | null }>(`select tuition_state as s, tuition_amount::text as a from public.programmes where sample_key = 'corvane-computer-science'`);
      expect(t).toEqual({ s: "not_applicable", a: null });
      const sub = await one<{ status: string }>(`select status from public.programmes where sample_key = 'fernhollow-management'`);
      expect(sub.status).toBe("submitted");
      expect(await count("programmes", "sample_key is not null and notes like 'Fictional example%'")).toBe(6);
    });
  });

  it("computes dates across a month/year boundary from the explicit seed date", async () => {
    const D = (await one<{ id: string }>(`insert into auth.users (email) values ('d@example.com') returning id`)).id;
    await seed(D, "2026-12-28");
    const r = await as(D, "authenticated", () => one<{ d: string }>(`select due_date::text as d from public.deadlines where sample_key = 'aldermoor-marketing-analytics-submission'`));
    expect(r.d).toBe("2027-01-03");
  });

  it("seed_demo_planning adds tasks, a prerequisite chain and milestones once, anchored to the seed date", async () => {
    const E = (await one<{ id: string }>(`insert into auth.users (email) values ('e@example.com') returning id`)).id;
    const plan = (date = "2026-10-25") => as(E, "authenticated", async () => (await one<{ n: number }>(`select public.seed_demo_planning($1::date) as n`, [date])).n);
    await seed(E);
    expect(await plan()).toBe(8);
    const snap = () => as(E, "authenticated", async () => ({ tasks: await count("tasks", "sample_key is not null"), deadlines: await count("deadlines", "sample_key is not null") }));
    const first = await snap();
    expect(first).toEqual({ tasks: 8, deadlines: 8 });
    expect(await plan()).toBe(8); // repeat adds nothing
    expect(await snap()).toEqual(first);
    await as(E, "authenticated", async () => {
      const chain = (await db.query<{ t: string; p: string }>(`select t.sample_key as t, pre.sample_key as p from public.tasks t join public.tasks pre on pre.id = t.prerequisite_task_id`)).rows;
      expect(chain).toEqual(expect.arrayContaining([{ t: "task-submit-aldermoor", p: "task-draft-statement" }, { t: "task-upload-portfolio", p: "task-finalise-portfolio" }]));
      const due = await one<{ d: string }>(`select due_date::text as d from public.tasks where sample_key = 'task-request-references'`);
      expect(due.d).toBe("2026-10-23"); // overdue by two days
      expect(await count("tasks", "sample_key = 'task-research-scholarships' and due_date is null and status = 'done'")).toBe(1);
    });
    expect(await as(B, "authenticated", () => count("tasks", "sample_key is not null"))).toBe(0);
    await as(E, "authenticated", () => db.query(`select public.reset_demo_data()`));
    expect(await snap()).toEqual({ tasks: 0, deadlines: 0 });
  });

  it("seed_demo_planning is refused for anon", async () => {
    expect(await as(null, "anon", () => code(() => db.query(`select public.seed_demo_planning('2026-10-25')`)))).toBe("42501");
  });

  it("reset removes only sample rows and leaves manual records alone; reseed restores", async () => {
    await as(C, "authenticated", async () => {
      const mine = await prog("my own programme");
      await db.query(`insert into public.tasks (title) values ('my own task')`);
      await db.query(`insert into public.documents (title, doc_type) values ('my own doc','cv')`);
      const res = await one<{ reset_demo_data: Record<string, number> }>(`select public.reset_demo_data()`);
      expect(res.reset_demo_data.programmes).toBe(6);
      expect(await count("programmes", "sample_key is not null")).toBe(0);
      expect(await count("requirements", "true")).toBe(0);
      expect(await count("programmes", `id = '${mine}'`)).toBe(1);
      expect(await count("tasks", "title = 'my own task'")).toBe(1);
      expect(await count("documents", "title = 'my own doc'")).toBe(1);
    });
    expect(await seed(C)).toBe(6);
    expect(await snapshot(C)).toEqual({ programmes: 6, requirements: 36, deadlines: 5 });
  });

  it("reset with mixed manual and sample data: what survives, what cascades, and nobody else is touched (SET-02)", async () => {
    const F = (await one<{ id: string }>(`insert into auth.users (email) values ('f@example.com') returning id`)).id;
    await seed(F);
    await as(F, "authenticated", () => db.query(`select public.seed_demo_planning('2026-10-25')`));
    const bBefore = await as(B, "authenticated", async () => [await count("programmes", "true"), await count("tasks", "true"), await count("documents", "true")]);
    await as(F, "authenticated", async () => {
      const sampleProg = (await one<{ id: string }>(`select id from public.programmes where sample_key is not null limit 1`)).id;
      const sampleReq = (await one<{ id: string }>(`select id from public.requirements where programme_id = $1 limit 1`, [sampleProg])).id;
      // The shipped seed adds no documents (Phase 4 decision), so stand one in: reset treats any sample_key row the same way.
      const sampleDoc = (await one<{ id: string }>(`insert into public.documents (title, doc_type, sample_key) values ('example doc','cv','example-doc') returning id`)).id;
      const sampleTask = (await one<{ id: string }>(`select id from public.tasks where sample_key = 'task-draft-statement'`)).id;
      const myDoc = (await one<{ id: string }>(`insert into public.documents (title, doc_type) values ('my cv','cv') returning id`)).id;
      await db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1, $2)`, [sampleReq, myDoc]); // my doc on a sample requirement
      await db.query(`insert into public.tasks (title, programme_id) values ('mine inside example', $1)`, [sampleProg]); // cascades with its programme
      await db.query(`insert into public.tasks (title, prerequisite_task_id) values ('mine after example', $1)`, [sampleTask]); // survives, unblocked
      const mine = await prog("my own programme");
      const myReq = (await one<{ id: string }>(`insert into public.requirements (programme_id, requirement_type, level) values ($1, 'cv', 'required') returning id`, [mine])).id;
      await db.query(`insert into public.requirement_documents (requirement_id, document_id) values ($1, $2)`, [myReq, sampleDoc]); // my programme on a sample doc

      await db.query(`select public.reset_demo_data()`);

      expect(await count("tasks", "title = 'mine inside example'")).toBe(0);
      expect(await count("tasks", "title = 'mine after example' and prerequisite_task_id is null")).toBe(1);
      expect(await count("documents", `id = '${myDoc}'`)).toBe(1);
      expect(await count("requirement_documents", `document_id = '${myDoc}'`)).toBe(0); // its requirement went with the example
      expect(await count("programmes", `id = '${mine}'`)).toBe(1);
      expect(await count("requirements", `id = '${myReq}'`)).toBe(1);
      expect(await count("requirement_documents", `requirement_id = '${myReq}'`)).toBe(0); // the sample document is gone
      expect(await count("programmes", "sample_key is not null")).toBe(0);
      expect(await count("tasks", "sample_key is not null")).toBe(0);
    });
    expect(await as(B, "authenticated", async () => [await count("programmes", "true"), await count("tasks", "true"), await count("documents", "true")])).toEqual(bBefore);
  });

  it("anon cannot call the seed or reset functions; unauthenticated authenticated-role call is refused", async () => {
    expect(await as(null, "anon", () => code(() => db.query(`select public.seed_demo_data('2026-10-25')`)))).toBe("42501");
    expect(await as(null, "anon", () => code(() => db.query(`select public.reset_demo_data()`)))).toBe("42501");
    expect(await as(null, "authenticated", () => code(() => db.query(`select public.reset_demo_data()`)))).toBe("28000");
  });
});

describe("account deletion cascade (SEC-05 data layer)", () => {
  it("removes every row owned by the user and nothing of anyone else's", async () => {
    const E = (await one<{ id: string }>(`insert into auth.users (email) values ('e@example.com') returning id`)).id;
    await as(E, "authenticated", async () => {
      await db.query(`select public.seed_demo_data('2026-10-25')`);
      await db.query(`insert into public.documents (title, doc_type) values ('d','cv')`);
      await db.query(`insert into public.tasks (title) values ('t')`);
    });
    const bBefore = await count("programmes", `owner_id = '${B}'`);
    await db.query(`delete from auth.users where id = $1`, [E]);
    for (const t of [...OWNER_TABLES.filter((t) => t !== "requirement_documents"), "programme_status_history"]) {
      expect(await count(t, `owner_id = '${E}'`), t).toBe(0);
    }
    expect(await count("requirement_documents", `owner_id = '${E}'`)).toBe(0);
    expect(await count("profiles", `id = '${E}'`)).toBe(0);
    expect(await count("programmes", `owner_id = '${B}'`)).toBe(bBefore);
  });
});

describe("updated_at", () => {
  it("advances on update", async () => {
    const pid = await asA(() => prog("ts"));
    await db.query(`update public.programmes set created_at = now() - interval '1 day', updated_at = now() - interval '1 day' where id = $1`, [pid]);
    await asA(() => db.query(`update public.programmes set notes = 'n' where id = $1`, [pid]));
    const r = await one<{ newer: boolean }>(`select updated_at > created_at as newer from public.programmes where id = $1`, [pid]);
    expect(r.newer).toBe(true);
  });
});
