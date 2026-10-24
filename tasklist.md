# GradPath Atlas — Task List (`tasklist.md`)

Companion to `PRD.md`. Requirement IDs (e.g. `PRG-03`) are defined in PRD §2.2. Source citations use the same format as the PRD (`Brief p.N`, `Ln p.N`).

## Status

| Item | State |
| --- | --- |
| **Current build phase** | **Phase 1 — Foundation** (code complete; Supabase database checks blocked — see M2.12) |
| Next phase | Phase 2 — Authentication. **Starts only when the student explicitly asks for it.** |
| Application code / dependencies / migrations | Next.js scaffold, env validation, Vitest, 9 SQL migrations and a local database test suite exist. No Supabase project is connected. |
| Git | Student stages, commits, pushes and deploys manually. The agent never runs Git mutation commands. |

## How to use this file

* Execute **one authorised phase per run**, select **one pending task at a time**, run its gate, then update its checkbox (Brief p.37; L3 p.34). After the last task in the phase: update docs, report, suggest a commit message, **STOP** (Brief p.37: "wait for your green light").
* `- [x]` is allowed **only after the gate has actually passed**, and the line must carry brief evidence (command and result, or the manual check done). Never tick a task because the code compiled.
* Leave blocked or unperformed checks as `- [ ]` with `⛔ BLOCKED:` and the reason and exact follow-up.
* **3-strike rule** (Brief p.39): after three failed attempts at the same underlying problem, stop, record the error / attempts / next diagnostic step under the task, keep working changes, and wait. No destructive Git cleanup.
* If a task changes the plan, update `PRD.md` and note the change in "Change log" below.

### Gate types

| Gate | Meaning |
| --- | --- |
| **DOC** | Document audit (coverage, citations, consistency). |
| **BUILD** | `npm run build` succeeds with zero TypeScript/routing errors (Brief p.35). |
| **TEST** | Focused unit tests pass (`npm test`). |
| **LINT** | `npm run lint` and type check pass. |
| **DEV** | `npm run dev` renders the page on `http://localhost:3000` with no browser-console errors (Brief p.35). |
| **DB** | Migration/SQL runs against a real Supabase project and rows/policies are inspected (Brief p.35). |
| **VIS** | Viewport checks at 1440, 768 and 375 px (Brief p.35). |
| **MAN** | Manual check against the stated acceptance criteria. |

### Task line format

`- [ ] **ID** · Phase · Req IDs — change · *Depends:* … · **Gate (type):** what must be true`

---

## Phase map (task IDs by build phase)

| Phase | Tasks |
| --- | --- |
| 0 — Specification | M1.01–M1.08, M4.01, M4.02 |
| 1 — Foundation | M1.09–M1.15, M2.01–M2.13 |
| 2 — Authentication | M3.01–M3.12 |
| 3 — Programmes | M2.14, M5.01–M5.10 |
| 4 — Documents | M5.11–M5.15 |
| 5 — Tasks and deadlines | M5.16–M5.22 |
| 6 — Complete the value loop | M4.03–M4.08, M5.23–M5.28 |
| 7 — Public pages and polish | M6.01–M6.09 |
| 8 — Final verification and delivery | M6.10–M6.17 |

---

## Module 1 — Sources, environment and secret handling

- [x] **M1.01** · P0 · PRC-01 — Inspect the project folder and Git status without modifying Git. · **Gate (DOC):** *Evidence (2026-10-25):* folder listing shows the brief PDF and `Lecture/` with L1–L7 PDFs and nothing else; `git status` → "fatal: not a git repository" (read-only). No `prompt.md` exists in the folder; the prompt file is `D:\Downloads\claude-code-gradpath-atlas-prompt.md`.
- [x] **M1.02** · P0 · PRC-01 — Read the assignment brief (pp.1–19, 28–29, 32–47). · **Gate (DOC):** *Evidence:* text extracted with `pdftotext -layout`; required pages 1–4, 11, 28–29, 32–43 read in full; pp.20–27 and 30–31 (other businesses' prompts) intentionally not read (Brief p.13). Recorded in PRD §0.3.
- [x] **M1.03** · P0 · PRC-01 — Read lectures L1–L7. · **Gate (DOC):** *Evidence:* all seven PDFs extracted and read in full; image-only slides and videos were not inspected (listed in PRD §0.3). Missing materials listed in PRD §0.4 (A-03, A-04).
- [x] **M1.04** · P0 · PRC-01 — Write `PRD.md` in the project root using the seven-section structure. · **Gate (DOC):** file exists; sections 1–7 present; every requirement ID used elsewhere is defined; sources cited. *Evidence:* `PRD.md` created (sections 1–7 plus document-control preface §0); audit script found 72 defined requirement IDs and 0 undefined IDs used.
- [x] **M1.05** · P0 · PRC-01 — Write this `tasklist.md`. · *Depends:* M1.04 · **Gate (DOC):** every PRD requirement ID is referenced by at least one task; every task ID cited in the PRD traceability table exists here. *Evidence:* audit script: 0 requirement IDs unreferenced, 0 PRD-cited task IDs missing, 94 tasks defined and all present in the phase map.
- [x] **M1.06** · P0 · PRC-01 — Write `CLAUDE.md` (stable project instructions incl. one-phase-per-run, manual Git, stop rule). · *Depends:* M1.04 · **Gate (DOC):** contains the one-phase rule, truthful-checkbox rule, manual-Git statement. *Evidence:* `CLAUDE.md` rules 1, 4, 5 and the phase-end STOP line present.
- [x] **M1.07** · P0 · SUB-01 — Write initial `README.md`. · *Depends:* M1.04 · **Gate (DOC):** states honestly that nothing runs yet; includes submission checklist and the `.gitignore` warning. *Evidence:* README status banner, "Before your first `git add`" section, and submission checklist present; no unrun command is presented as working.
- [x] **M1.08** · P0 · PRC-01 — Audit documents against the assignment and course sources. · *Depends:* M1.04–M1.07 · **Gate (DOC):** scripted ID cross-check passes (PRD ↔ tasklist) and brief/lecture citations spot-checked against the extracted text. *Evidence:* ID cross-check (Python, results above); ~40 citations (Brief pp.1–5, 11, 18, 28–29, 33–35, 37, 39, 43; L1 pp.7–8, 21, 24–26, 43, 61–66, 83; L2 pp.11, 13, 35, 38, 53, 61–64; L3 pp.14, 25–26, 31, 39; L4 pp.56, 66, 68–69, 77; L5 pp.49–52, 70–72, 76; L6 pp.4, 78, 88, 90, 95, 100, 107; L7 pp.30, 36, 50, 55, 67, 71) re-checked against the extracted page text. Not verified: image-only slides, videos.
- [x] **M1.09** · P1 · SEC-03 — Create `.gitignore` (env files, `node_modules`, `.next`, build output, Supabase local temp, **the brief PDF and `Lecture/` course PDFs and extracted course text**, editor/OS files). · **Gate (MAN):** *Evidence:* the student had already run `git init`; read-only `git check-ignore -v` reports `.env.local`, `Lecture/x.pdf`, `a.pdf`, `node_modules/x` and `L1.p.txt` as ignored while plain `git check-ignore .env.example` exits 1 (not ignored); `git status --short --ignored` lists `Lecture/` and the brief PDF as ignored.
- [x] **M1.10** · P1 · DEP-01 — Check installed Node/npm versions and the *current* official docs for Next.js App Router and Supabase SSR auth; record versions and the doc pages consulted in `README.md`. · **Gate (DOC):** *Evidence:* Node v22.13.0, npm 10.9.2; Next.js 16.4.3 / React 19.3.0 / Tailwind 4 (scaffold); latest on npm: `@supabase/supabase-js` 2.118.0, `@supabase/ssr` 0.12.7 (not installed yet). Docs read: Supabase API-keys guide (publishable/secret keys replace `anon`/`service_role`) and Supabase Next.js SSR guide (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `proxy.ts` on Next 16); Next.js docs ship in `node_modules/next/dist/docs/`. Recorded in `README.md` (Versions and docs checked) and PRD §6.2; env names in PRD/CLAUDE.md corrected accordingly.
- [x] **M1.11** · P1 · DEP-01 — Scaffold Next.js (App Router, TypeScript, Tailwind) in the project root with a lockfile; no extra packages. · *Depends:* M1.10 · **Gate (BUILD):** *Evidence:* scaffolded in a temp folder (create-next-app refuses a folder containing README/.gitignore) and copied in without touching planning docs or course files; the default page, Geist font import and dark-mode block were replaced by a minimal placeholder and a system-font light theme. `NEXT_TELEMETRY_DISABLED=1 npm run build` → compiled; routes `/` and `/_not-found`. `npm run dev` → HTTP 200, page text correct, browser console shows only the React DevTools info line and HMR (no errors). Caveat: the first plain `npm run build` failed with `EXDEV … nextjs-nodejs\Config\config.json` (Windows config-file rename, environmental); it passes with `NEXT_TELEMETRY_DISABLED=1`.
- [x] **M1.12** · P1 · PRC-01 — Configure strict TypeScript, ESLint, and npm scripts `lint`, `typecheck`, `test`, `build`. · *Depends:* M1.11 · **Gate (LINT):** *Evidence:* `npm run lint` → no output (pass); `npm run typecheck` (`next typegen && tsc --noEmit`, so route types exist on a clean checkout) → pass after deleting `.next` and `next-env.d.ts`. TypeScript `strict` is on (scaffold default).
- [x] **M1.13** · P1 · PRC-01 — Add Vitest with one trivial passing test. · *Depends:* M1.12 · **Gate (TEST):** *Evidence:* `npm test` → 2 files, 40 tests passed (env tests + database tests). `@types/node` raised to ^22 to satisfy Vitest 5's peer range.
- [x] **M1.14** · P1 · SEC-03, SEC-04 — Create `.env.example` (names + safe placeholders) and `src/lib/env.ts` that validates required variables with a helpful message per missing name; separate browser-safe and server-only reads. Decide and record whether `zod` is added. · **Gate (TEST):** *Evidence:* `src/lib/env.test.ts` — missing variables are all named in one message, blank and non-URL values rejected, bad values not echoed; a source scan asserts `SUPABASE_SECRET_KEY` appears only in `src/lib/env.ts` and no `NEXT_PUBLIC_*SECRET*` name exists. **Decision:** `zod` is **not** added in Phase 1 (no form exists yet); it is decided at the first form task (M3.03). The Supabase client libraries are likewise added in M3.01.
- [x] **M1.15** · P1 · SUB-01 — Update `README.md` with real setup commands only for what now works; mark everything else as pending. · *Depends:* M1.11–M1.14 · **Gate (DOC):** *Evidence:* README rewritten; every command listed was run in this phase; Supabase-dependent steps are labelled pending.

## Module 2 — Schema, migrations, ownership/RLS and demo seeds

All SQL lives in `supabase/migrations/NNNN_name.sql`, one concern per file, written for Postgres ≥ 15. Database gates are **blocked until a Supabase project and credentials exist** (the student supplies them; never paste secrets into chat).

- [ ] **M2.01** · P1 · AUTH-06, SEC-01 — `0001_foundation.sql`: `set_updated_at()`; `profiles`; `handle_new_user()` security-definer trigger on `auth.users` (execute revoked from API roles). · **Gate (DB):** ⛔ BLOCKED until M2.12 (Supabase). *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* profile auto-created for each new user; a user can update only their own profile and cannot insert or delete; invalid `demo_plan` rejected; trigger functions not executable by anon/authenticated.
- [ ] **M2.02** · P1 · PRG-01, PRG-02, PRG-03 — `0002_programmes.sql`: `programmes` with the tuition-state CHECK, status CHECK, `unique (owner_id,id)`, sample_key partial unique index, updated_at trigger. · *Depends:* M2.01 · **Gate (DB):** ⛔ BLOCKED until M2.12. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* unknown/N-A tuition with an amount (including 0) rejected; known tuition needs amount + upper-case currency and ≥ 0; bad status and blank names rejected; `updated_at` advances.
- [ ] **M2.03** · P1 · DL-01, DL-03, DL-05 — `0003_deadlines.sql`: `deadlines` (date column, composite FK to programmes, one-submission-per-programme partial unique index, submission requires a programme). · *Depends:* M2.02 · **Gate (DB):** ⛔ BLOCKED until M2.12. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* second submission deadline rejected; submission without a programme rejected; stored date round-trips as `2027-01-31`.
- [ ] **M2.04** · P1 · REQ-01, REQ-02 — `0004_requirements.sql`: `requirements` (type/level CHECKs, quantity 1–10, self_confirmed, unique (programme,type) except 'other'). · *Depends:* M2.02 · **Gate (DB):** ⛔ BLOCKED until M2.12. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* duplicate type rejected, repeated 'other' allowed, quantity out of range rejected.
- [ ] **M2.05** · P1 · DOC-01, DOC-02, SEC-02 — `0005_documents.sql`: `documents` and junction `requirement_documents` with composite FKs `(owner_id, …)` and cascade rules. · *Depends:* M2.04 · **Gate (DB):** ⛔ BLOCKED until M2.12. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* deleting a programme removes its links but not a document linked elsewhere; deleting a document removes only its links.
- [ ] **M2.06** · P1 · TSK-01, TSK-03, TSK-04, TSK-05 — `0006_tasks.sql`: `tasks` with self-dependency CHECK, composite FK with `ON DELETE SET NULL (prerequisite_task_id)`, and the `tasks_guard` trigger (cycle + done-requires-prerequisite + `completed_at`). · *Depends:* M2.02 · **Gate (DB):** ⛔ BLOCKED until M2.12. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* self, 2-node and 3-node cycles rejected; "done" rejected while the prerequisite is not done (update and insert) and accepted afterwards; `completed_at` set/cleared; deleting a prerequisite keeps the dependent with `owner_id` intact.
- [ ] **M2.07** · P1 · PRG-06 — `0007_status_history.sql`: `programme_status_history` + security-definer trigger on programmes. · *Depends:* M2.02 · **Gate (DB):** ⛔ BLOCKED until M2.12. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* creation logs one row; a real status change logs one row; no-op status and other edits log nothing; user insert/update/delete on history refused; other users see none.
- [ ] **M2.08** · P1 · SEC-01 — `0008_rls.sql`: RLS + select/insert/update/delete policies for every table, anon revoked, narrow grants. · *Depends:* M2.01–M2.07 · **Gate (DB):** ⛔ BLOCKED until M2.12. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* RLS enabled on all 8 tables; policy matrix as designed; no `using (true)`; anon holds no privilege; B cannot read/update/delete A's rows or insert as A; anon refused; `owner_id` cannot be reassigned. Mutation check: weakening a select policy, a composite FK, or the tuition CHECK each made the suite fail; after restoring the migrations the suite passed again.
- [ ] **M2.09** · P1 · SEED-01, SEED-02, SEED-03 — `0009_seed_functions.sql`: `seed_demo_data(p_seed_date date)` and `reset_demo_data()` as **security invoker** functions; foundation covers 6 fictional programmes, 36 requirements and 5 submission deadlines relative to the supplied date; idempotent via sample_key. · *Depends:* M2.08 · **Gate (DB):** ⛔ BLOCKED until M2.13 (Supabase). *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* second seed adds nothing (6/36/5); other users unaffected; overdue/today/soon/none/submitted cases present; seed date 2026-12-28 → +6 days = 2027-01-03; reset removes only sample rows and keeps a manual programme, task and document; reseed restores; anon refused (42501), unauthenticated `authenticated` call refused (28000).
- [ ] **M2.10** · P1 · SEC-01 — `supabase/tests/rls_coverage.sql`: catalog query returning one row per missing RLS / missing policy / unrestricted policy / anon privilege (expected: zero rows). · *Depends:* M2.08 · **Gate (LINT):** script reviewed ✔; **Gate (DB):** ⛔ BLOCKED until M2.12 — paste into the Supabase SQL editor and expect zero rows. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* zero rows on the migrated schema, and it reports `missing DELETE policy` when one policy is dropped (rolled back).
- [ ] **M2.11** · P1 · SEC-02, SEC-06 — Two-user ownership tests: reads, updates, deletes, forged cross-owner links (task→programme, deadline→programme, requirement→programme, link→document/requirement in both directions, prerequisite→task), anon, status-history forgery. · *Depends:* M2.08 · **Gate (DB):** ⛔ BLOCKED: the same scenarios must also be run against a real Supabase project with two real users through the API (planned with supabase-js in M3.11). *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* all scenarios pass in `supabase/tests/db.test.ts`; a forged link to a real foreign UUID fails with the same error code as a random UUID.
- [ ] **M2.12** · P1 · SEC-01 — Apply migrations 0001–0009 to the Supabase development project and inspect tables/policies. · *Depends:* M2.01–M2.09 · **Gate (DB):** ⛔ BLOCKED: no Supabase project or credentials exist in this environment. *Student steps:* create a free Supabase project; copy the project URL and **publishable** key into `.env.local` (never into chat); apply `supabase/migrations/0001…0009` in order (Supabase CLI `supabase db push`, or paste each file into the SQL editor); then run `supabase/tests/rls_coverage.sql` and expect zero rows.
- [ ] **M2.13** · P1 · SEED-02 — Run seed twice, then reset, then seed again; compare row counts. · *Depends:* M2.09, M2.12 · **Gate (DB):** ⛔ BLOCKED until M2.12 — on Supabase: counts identical after repeat seed; manual rows untouched by reset. *Local result (2026-10-25, PGlite = real PostgreSQL in-process + test-only Supabase shim; NOT a Supabase run):* verified (see M2.09).
- [ ] **M2.14** · **P3** · PRC-01 — TypeScript row types for the schema (generated with the Supabase CLI once a project exists, otherwise hand-written and labelled). *Moved from Phase 1 to Phase 3: nothing in Phases 1–2 reads these tables from the app, so unused types would only drift.* · *Depends:* M2.01–M2.07 · **Gate (LINT):** `npm run typecheck` passes.

## Module 3 — Authentication and protected routes (Phase 2)

Email-based flows cannot be fully verified without live Supabase email configuration; those gates stay blocked until configured.

- [ ] **M3.01** · P2 · AUTH-06 — Create browser, server and request-layer Supabase clients exactly as the *currently documented* SSR pattern (recorded in M1.10). · *Depends:* M1.14 · **Gate (BUILD):** build passes; no service-role import in client modules.
- [ ] **M3.02** · P2 · AUTH-04 — Add route protection for the Auth routes in PRD §3.1 plus a server-side session guard helper; add `safeNextPath()` that only returns same-site relative paths. · *Depends:* M3.01 · **Gate (TEST):** unit tests for the protected-path matcher and `safeNextPath` (rejects `//evil.com`, `https://…`, backslashes); **Gate (DEV):** anonymous request to `/dashboard` redirects to `/login`.
- [ ] **M3.03** · P2 · AUTH-01, AUTH-05, PUB-05 — `/signup` with labelled fields, password rules, privacy notice beside the submit button, and identical outcome wording for new/existing emails. · *Depends:* M3.01 · **Gate (DEV):** form renders and validates; ⛔ end-to-end submit BLOCKED until Supabase configured.
- [ ] **M3.04** · P2 · AUTH-01, AUTH-03 — `/auth/callback` route handling verification and recovery links per the documented flow. · *Depends:* M3.01 · **Gate (BUILD):** builds; ⛔ link behaviour BLOCKED until email templates and redirect URLs are configured.
- [ ] **M3.05** · P2 · AUTH-02, AUTH-05 — `/login` with generic failure message and safe post-login redirect. · *Depends:* M3.02 · **Gate (DEV):** error text identical for unknown email vs wrong password.
- [ ] **M3.06** · P2 · AUTH-02 — Sign-out action. · *Depends:* M3.05 · **Gate (DEV):** after sign-out, browser Back and direct URLs to protected routes redirect to `/login`.
- [ ] **M3.07** · P2 · AUTH-03, AUTH-05 — `/forgot-password` showing the same success message regardless of email. · *Depends:* M3.01 · **Gate (DEV):** message identical for any input; ⛔ delivery BLOCKED until email configured.
- [ ] **M3.08** · P2 · AUTH-03 — `/reset-password` accessible only with a recovery session; sets a new password. · *Depends:* M3.04 · **Gate (DEV):** page blocked without a recovery session; ⛔ full reset BLOCKED until email configured.
- [ ] **M3.09** · P2 · UX-01, UX-03 — Minimal authenticated workspace shell (sidebar + top bar, active route, skip link, visible focus). · *Depends:* M3.02 · **Gate (DEV):** all nav links resolve (stub pages allowed and labelled); keyboard-only navigation works.
- [ ] **M3.10** · P2 · SET-01 — Ensure a `profiles` row exists after sign-up and capture the browser time zone once. · *Depends:* M2.12, M3.03 · **Gate (DB):** ⛔ BLOCKED until M2.12 — new user has exactly one profile row with a valid IANA time zone.
- [ ] **M3.11** · P2 · SEC-02 — Run the two-user ownership script (M2.11) against the live project. · *Depends:* M2.11, M2.12, M3.03 · **Gate (DB):** ⛔ BLOCKED until two test users exist — all forged-link attempts fail.
- [ ] **M3.12** · P2 · AUTH-01…06 — Browser check of sign-up, sign-in, sign-out, protected redirects and console errors. · *Depends:* M3.03–M3.09 · **Gate (MAN):** each flow performed and recorded; email verification and reset recorded as blocked if email is not configured.

## Module 4 — Required integrations, export, and explicit deferral decisions

- [x] **M4.01** · P0 · DOC-05 — Decision: **no file upload or storage** in the MVP; documents are metadata + readiness only; no fake upload control. · **Gate (DOC):** *Evidence:* recorded in PRD §2.3, §5.2 (`documents`), §6.6 and requirement DOC-05; storage/versioning listed in PRD §2.4.
- [x] **M4.02** · P0 · PUB-03 — Decision: **no payment processor**; upgrade is a labelled simulation storing only `profiles.demo_plan`. · **Gate (DOC):** *Evidence:* recorded in PRD §1.6, §4.4, §6.4 and requirement PUB-03/04.
- [ ] **M4.03** · P6 · SEC-07, EXP-01 — `src/lib/csv.ts`: RFC-4180 quoting and neutralisation of leading `= + - @ TAB CR` in user-entered text. · **Gate (TEST):** tests for each dangerous prefix, quotes, commas, newlines, Unicode.
- [ ] **M4.04** · P6 · EXP-01, EXP-02, RDY-02 — Pure export builders (programme summary CSV, actions CSV, JSON) using the shared readiness/dates modules. · *Depends:* M4.03, M5.11, M5.16 · **Gate (TEST):** fixture produces expected rows including unmet requirements and next tasks; unknown tuition exports as "Unknown", not 0.
- [ ] **M4.05** · P6 · SEC-06, EXP-01, EXP-02 — Authenticated, owner-scoped export route handlers with `Content-Disposition`. · *Depends:* M4.04 · **Gate (MAN/DB):** signed-out request is refused; two-user check shows no cross-user rows (⛔ BLOCKED if no live DB).
- [ ] **M4.06** · P6 · SEC-04, SEC-05 — `/api/account/delete`: verify session, then delete via the admin API using the server-only key; typed confirmation required. · *Depends:* M1.14, M3.12 · **Gate (DB/MAN):** ⛔ BLOCKED until live DB — after deletion, sign-in fails and no rows with that owner remain; a second user's data is unchanged.
- [ ] **M4.07** · P6 · EXP-03 — Print stylesheet for `/adviser` and comparison. · **Gate (VIS):** print preview legible without navigation chrome.
- [ ] **M4.08** · P6 · SEC-03, SEC-04 — Search the production build output for secrets. · *Depends:* M1.11 · **Gate (BUILD):** after `npm run build`, searching `.next/static` for the service-role variable name/value pattern finds nothing.

## Module 5 — Workspace UI and core student workflows

### Phase 3 — Programmes, requirements, comparison

- [ ] **M5.01** · P3 · PRG-01 — Server-side data-access functions and validation schemas for programmes and requirements (user-scoped client only). · *Depends:* M2.14, M3.12 · **Gate (TEST):** validation tests cover the three-state tuition rule and field limits.
- [ ] **M5.02** · P3 · CMP-03, PRG-02 — `/programmes` list with search, filters (status, country/region, subject, shortlisted), sorts, shortlist star and row selection. · *Depends:* M5.01 · **Gate (DEV):** each filter/sort changes results; empty-result message and "clear filters" work.
- [ ] **M5.03** · P3 · PRG-01, PRG-03, DL-01 — Create/edit programme form incl. tuition state, currency, intake, duration and the **submission deadline field (writes the `deadlines` submission row, not a programme column)**. · *Depends:* M5.01 · **Gate (DEV):** invalid input shows linked messages; Unknown/N-A saved distinctly; reload shows saved values.
- [ ] **M5.04** · P3 · PRG-04 — Programme update/delete server actions with confirmation dialog stating counts of requirements, deadlines, tasks and links removed. · *Depends:* M5.03 · **Gate (MAN):** counts match; documents survive deletion (⛔ DB-level confirmation blocked until M2.12).
- [ ] **M5.05** · P3 · PRG-02 — Shortlist toggle on list and detail. · *Depends:* M5.02 · **Gate (DEV):** state persists after reload.
- [ ] **M5.06** · P3 · REQ-01, REQ-02 — Requirement editor (type, level, detail, quantity, self-confirm) on the detail page. · *Depends:* M5.03 · **Gate (DEV):** add/edit/remove persists; duplicate type rejected with a clear message.
- [ ] **M5.07** · P3 · PRG-05, PRG-06, PRG-07 — Programme detail page with notes, status select and status-history list. · *Depends:* M5.06 · **Gate (DEV):** changing status adds a history row; notes persist.
- [ ] **M5.08** · P3 · CMP-01, CMP-02, CMP-04, CMP-05 — `/compare` matrix with sticky row labels, contained horizontal scroll, difference markers, unknown/N-A wording, currency-honesty note; pure `src/lib/compare.ts`. · *Depends:* M5.06 · **Gate (TEST):** compare tests (differences, mixed currencies never ranked, unknowns); **Gate (VIS):** at 375px page does not scroll horizontally, matrix does.
- [ ] **M5.09** · P3 · SEED-01, SEED-04, DSH-04 — "Load fictional examples" action + empty-state; "Fictional example" badges. · *Depends:* M2.13, M5.02 · **Gate (DB):** ⛔ BLOCKED until M2.12 — repeat click creates no duplicates.
- [ ] **M5.10** · P3 · PRG-01…07, CMP-01…05 — Phase 3 verification: CRUD persistence, selection survives reload, ownership, console clean. · *Depends:* M5.01–M5.09 · **Gate (MAN):** checklist run and recorded; blocked DB items listed.

### Phase 4 — Documents and readiness

- [ ] **M5.11** · P4 · RDY-01, RDY-02, DOC-04 — `src/lib/readiness.ts` per PRD §5.5 (required-only, quantity, ready, not expired, matching type, self-check, no-required case). · **Gate (TEST):** tests for draft, not-started, ready, expired (expiry yesterday vs today), wrong type, quantity 2 with 1 ready, optional ignored, no requirements, unknown excluded.
- [ ] **M5.12** · P4 · DOC-01, DOC-05 — `/documents` CRUD (metadata only) with explicit "files are not uploaded" text. · *Depends:* M5.11 · **Gate (DEV):** no file input exists in the DOM; create/edit/delete persist.
- [ ] **M5.13** · P4 · DOC-02, DOC-03 — Link/unlink UI on the requirement and a "used by" list on the document. · *Depends:* M5.12 · **Gate (DEV):** one document linked to two programmes; unlinking one leaves the other.
- [ ] **M5.14** · P4 · DOC-04, RDY-02 — Show readiness on programme detail and comparison via the shared module. · *Depends:* M5.11, M5.13 · **Gate (TEST/DEV):** same figure shown in both views for the same data.
- [ ] **M5.15** · P4 · DOC-01…05, RDY-01/02 — Extend the fictional seed with documents and links (new migration) and verify the whole phase. · *Depends:* M5.14 · **Gate (MAN):** reuse across two programmes, unlink, and draft/ready/expired status changes all update readiness; ⛔ seed verification BLOCKED until live DB.

### Phase 5 — Tasks and deadlines

- [ ] **M5.16** · P5 · DL-03, DL-04 — `src/lib/dates.ts`: today-in-time-zone, day arithmetic on `YYYY-MM-DD`, deadline classification. · **Gate (TEST):** tests for today, yesterday, tomorrow, +14/+15 days, month-end→month-start, year-end→year-start, leap day, missing date, and two time zones on the same instant.
- [ ] **M5.17** · P5 · DL-01, DL-02 — `/deadlines` page with Overdue / Due soon / Later groups and add/edit/delete. · *Depends:* M5.16 · **Gate (DEV):** a deadline today appears under *Due soon* as "Due today".
- [ ] **M5.18** · P5 · DL-05, DL-01 — Deadlines section on programme detail; enforce one submission deadline per programme; completed/submitted items drop out of outstanding. · *Depends:* M5.17 · **Gate (DEV/MAN):** marking submitted removes the deadline from outstanding lists.
- [ ] **M5.19** · P5 · TSK-03, TSK-04, TSK-05 — `src/lib/tasks.ts`: blocked/actionable, self-dependency and cycle detection mirroring the database trigger. · **Gate (TEST):** tests for blocked, unblocked after prerequisite done, self, two-node and three-node cycles, deleted prerequisite.
- [ ] **M5.20** · P5 · TSK-01, TSK-02, TSK-03 — `/tasks` page: CRUD, filters by programme/status, sort by due date/priority, prerequisite selector (own tasks only), *Blocked* badge with waiting-on text. · *Depends:* M5.19 · **Gate (DEV):** blocked task cannot be completed; undated tasks sort last.
- [ ] **M5.21** · P5 · SEED-01, SEED-03 — Extend the fictional seed with tasks, a prerequisite chain, general-season items, and overdue / due-today / soon-due deadlines (new migration). · *Depends:* M5.20 · **Gate (DB):** ⛔ BLOCKED until live DB — repeat seeding makes no duplicates.
- [ ] **M5.22** · P5 · TSK-01…05, DL-01…05 — Phase 5 verification. · *Depends:* M5.16–M5.21 · **Gate (MAN):** dependency, cycle and date-boundary behaviour confirmed in the browser and tests; blocked items listed.

### Phase 6 — Complete the value loop

- [ ] **M5.23** · P6 · DSH-01, DSH-02, RDY-02 — `src/lib/dashboard.ts` and `src/lib/next-actions.ts` per PRD §5.5. · *Depends:* M5.11, M5.16, M5.19 · **Gate (TEST):** counts and ordering tests incl. submitted programmes excluded and blocked tasks not listed as actions.
- [ ] **M5.24** · P6 · DSH-01…04 — `/dashboard` with counts, next actions, and separate Status vs Preparation indicators; empty state. · *Depends:* M5.23 · **Gate (DEV):** changing a task/document/deadline changes the figures on reload.
- [ ] **M5.25** · P6 · ADV-01, EXP-03 — `/adviser` read-only preview with banner, shortlist, readiness, missing items, deadlines. · *Depends:* M5.23 · **Gate (MAN):** no edit controls; label states it is not shared access.
- [ ] **M5.26** · P6 · SET-01, SET-02, SET-03, SEC-05 — `/settings`: profile/time zone, sample reset with impact counts, export-before-delete, delete-account flow wired to M4.06. · *Depends:* M4.05, M4.06 · **Gate (MAN):** destructive actions need confirmation and report their result; ⛔ deletion BLOCKED until live DB.
- [ ] **M5.27** · P6 · SEED-02, SET-02 — Verify reset isolation. · *Depends:* M5.26 · **Gate (DB):** ⛔ BLOCKED until live DB — manual records unchanged; sample-linked rows removed; reseed restores without duplicates.
- [ ] **M5.28** · P6 · PRC-01 — Phase 6 verification of the whole value loop (PRD §2.1). · *Depends:* M5.23–M5.27, M4.03–M4.08 · **Gate (MAN):** six-step loop completed in the browser; exports opened and checked; results recorded.

## Module 6 — Simulated upgrade, final audits, deployment and submission

### Phase 7 — Public pages and polish

- [ ] **M6.01** · P7 · UX-01, UX-03 — Design tokens, status badge components, 2px focus ring, system font stack. · **Gate (MAN):** contrast values for text and badges recorded (≥ 4.5:1).
- [ ] **M6.02** · P7 · PUB-01 — Landing page with a **real screenshot** of the app (captured from the working app, with alt text) and CTA visible within 375×667. · *Depends:* M5.28 · **Gate (VIS):** hero + CTA visible without scrolling at 375×667; no testimonials, logos or figures.
- [ ] **M6.03** · P7 · PUB-02 — Pricing page with the three tiers and exact values from PRD §1.6, labelled hypothetical. · **Gate (MAN):** prices, currency (US$), duration and feature differences match the PRD.
- [ ] **M6.04** · P7 · PUB-03 — Simulated upgrade confirmation persisting `profiles.demo_plan` only. · *Depends:* M6.03 · **Gate (MAN):** label "Simulation — no payment taken" visible; no card fields; ⛔ persistence BLOCKED until live DB.
- [ ] **M6.05** · P7 · PUB-04, UX-03 — Licence enquiry modal using `<dialog>`; collects nothing. · *Depends:* M6.03 · **Gate (MAN):** focus moves in, is trapped, Esc closes, focus returns to the trigger.
- [ ] **M6.06** · P7 · PUB-05, PUB-06 — `/privacy` (PICS) and cookie statement; link from sign-up and footer. · **Gate (MAN):** page states data stored, purposes, processors, retention, export/deletion, cookies, "not legal advice / coursework prototype".
- [ ] **M6.07** · P7 · UX-02 — Responsive audit of every route at 1440, 768 and 375 px. · **Gate (VIS):** no clipped content or page-level horizontal scroll; recorded per route.
- [ ] **M6.08** · P7 · UX-03 — Accessibility pass: keyboard-only run of the value loop, labels, table semantics, dialog focus, reduced motion; optional automated scan. · **Gate (MAN):** results recorded; no claim of full WCAG conformance.
- [ ] **M6.09** · P7 · UX-04 — Loading, empty, error and not-found states for each data route. · **Gate (DEV):** each state triggered once and observed.

### Phase 8 — Final verification and delivery

- [ ] **M6.10** · P8 · all — End-to-end audit against PRD §7.1 final checks; write `TESTING.md` (runnable checks, student manual checklist, actual results kept separate from unperformed tests, later improvements). · **Gate (MAN):** every check marked performed / blocked with reason.
- [ ] **M6.11** · P8 · SEC-01, SEC-02, SEC-06 — Run RLS coverage (M2.10) and ownership tests (M2.11) on the final schema. · **Gate (DB):** ⛔ BLOCKED until live DB — all attempts fail as specified.
- [ ] **M6.12** · P8 · PRC-01 — Final `npm run lint`, `typecheck`, `test`, `build`. · **Gate (BUILD/TEST/LINT):** all pass; output recorded.
- [ ] **M6.13** · P8 · SUB-01 — Finalise `README.md`, fill traceability evidence in PRD §7.8, record material changes from the original plan. · **Gate (DOC):** every row has evidence or an explicit blocked reason.
- [ ] **M6.14** · P8 · DEP-01 — Write exact manual steps: Supabase project, auth/URL/email settings, migrations, Vercel import, environment variables, redirect URLs. · **Gate (DOC):** steps cross-checked against Brief pp.15, 18 and the recorded provider docs.
- [ ] **M6.15** · P8 · SUB-01 — Submission pack checklist: repository access (instructor invited as collaborator if private, Brief p.4), live link, PDF cover items (Brief p.2), blank AI declaration (Brief p.3), PRD/tasklist copies in surname order, VeriGuide per member. · **Gate (DOC):** checklist complete; personal identifiers and declaration % left blank for the student.
- [ ] **M6.16** · P8 · DEP-01 — Smoke-test the **live** deployment (landing, sign-up, sign-in, sample load, export). · **Gate (MAN):** ⛔ BLOCKED until the student deploys manually; no live URL exists.
- [ ] **M6.17** · P8 · SUB-01 — Reminder: keep the live site accessible for ≥ 30 days after the Blackboard deadline (Brief p.3) and confirm the active deadline with the instructor (PRD A-02). · **Gate (DOC):** reminder present in README.

---

## Deferred (Post-MVP, the brief's "Phase 2") — not unfinished required work

* D-01 Private file storage and versioning · D-02 real payments and entitlements · D-03 adviser invitations, permissions, cohorts · D-04 institutional admin · D-05 CSV import / programme templates · D-06 email and calendar reminders · D-07 calendar view · D-08 currency conversion with cited rates · D-09 multi-season support · D-10 timestamped notes log · D-11 "keep this sample as mine" · D-12 automated accessibility scanning in CI · D-13 consented analytics · D-14 optional, clearly labelled programme-data sourcing (Brief p.29) · D-15 localisation.

## Change log

| Date | Change |
| --- | --- |
| 2026-10-25 | Initial plan created in Phase 0. |
| 2026-10-25 | Phase 1: env var names changed to Supabase's current `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` (docs checked); `zod` and the Supabase client libraries deferred to the first task that needs them; M2.14 (row types) moved to Phase 3; database tests run against in-process PostgreSQL (PGlite) with a test-only Supabase shim, which does **not** replace the pending Supabase runs (M2.12, M2.13, M3.11). `typecheck` now runs `next typegen` first. |
