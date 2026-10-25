# GradPath Atlas — testing

Setup and deployment: [README.md](README.md). Requirement IDs: [PRD.md](PRD.md). Per-task gates and evidence: [tasklist.md](tasklist.md), which holds the **canonical manual checklists** (Phase 6 and Phase 7 sections). This file does not repeat them.

## Evidence categories

| Label | Meaning |
| --- | --- |
| **Automated** | Run by the agent in this repository: `npm run lint`, `typecheck`, `test`, `build`. |
| **Agent-observed** | The agent looked at a running app directly (signed-out pages, fixture previews, production-build requests). It has **never signed in** to the hosted project. |
| **Student-reported** | The student ran the check and reported the result; the agent did not see the output. |
| **Not verified** | Not performed by anyone yet. |

## Final review (2026-10-25, Node 22.23.4, npm 10.9.9)

| Check | Result |
| --- | --- |
| `npm run lint` · `typecheck` · `test` · `build` | All exit 0; **18 files, 193 tests passed**; build compiled. Browser bundle: no secret-key name or `service_role`; no value-shaped keys in `.next` |
| `.env.local` | All eight variables present; `NEXT_PUBLIC_SITE_URL` is localhost; the secret key is not a placeholder (values not shown) |
| Production, signed out (agent-observed with HTTP requests and browser emulation, **not a real phone**) | `/`, `/pricing`, `/privacy`, `/login`, `/signup`, `/forgot-password` load; every private page and `/api/export/*` redirects to `/login?next=…`; `/reset-password` → `/forgot-password?error=expired`; bogus `/auth/callback` → `/login?error=link-invalid`; `?next=//evil.com` is ignored; unknown URL → 404 page. Landing at 375px: CTA visible above the fold, preview table scrolls sideways inside its region with the first column fixed, no page-level overflow; 768 and 1440px: table fits, no overflow. Empty sign-in shows linked field errors and focuses the first field. Pricing (signed out) shows "Start free" and "Sign in to try the simulated upgrade". No cookies set while signed out |
| Not run | `npm run check:api-isolation` (it signs in to the hosted project and resets the test account's examples; left to the student). No signed-in production session was available, so the workspace on production was not observed by the agent |

## Results (2026-10-25, laptop, Node 26.12.1, npm 11.20.0)

| Check | Result |
| --- | --- |
| `npm ci` | Completed from the existing lockfile; lockfile unchanged |
| `npm run lint` | No output (pass) |
| `npm run typecheck` | Pass |
| `npm test` | **18 files, 193 tests passed** (includes 42 database tests on in-process PostgreSQL via PGlite: row-level security, forged links, cascades, seed/reset, simulated plan, and an integrated programme → requirements → documents → readiness → tasks → dashboard → export workflow) |
| `npm run build` | Passed, all routes generated (dev server stopped first) |
| Secret names in browser bundle | `.next/static`: no matches for the secret-key name or `service_role`; no value-shaped keys anywhere in `.next` |
| Source review | The secret key is read only in `src/lib/env.ts` and used only in `src/lib/supabase/admin.ts` (imported by the account-deletion action); no client component imports either; no `dangerouslySetInnerHTML`/`eval`; the git history has no key-shaped strings |
| Signed-out requests to the production build | `/dashboard`, `/programmes…`, `/compare`, `/documents`, `/tasks`, `/deadlines`, `/adviser`, `/settings` and all `/api/export/*` (GET and POST) redirect to `/login`; `/reset-password` redirects to `/forgot-password`; `/auth/callback` with no or a bogus code → `/login?error=link-invalid`; an unknown URL → 404 |
| Public/auth pages in the browser (production build, 375px) | One `h1`, one `main`, every input labelled, no duplicate ids, no unnamed buttons or links, no horizontal overflow; console shows only the expected 404 on an unknown URL |

Earlier phases recorded the same four commands passing on Node 22.13.0 (desktop). Database tests are **not** a hosted Supabase run.

## Student-reported (hosted project)

Phase 1 verification scripts (`rls_coverage.sql` zero rows; `hosted_authz_check.sql` all PASS), `npm run check:api-isolation` all PASS, Phase 3 checks (15), Phase 4, 5, 6 and 7 manual checks all passed, including account deletion with a disposable account. Details and dates are in the tasklist change log.

## Core workflow (the short student test)

On the live site, signed in with a test account:

1. Load fictional examples; open **Compare** with two or three programmes — differences are marked and unknown tuition reads "Unknown".
2. Open a programme, add a required **transcript** requirement, link a **Ready** document to it, then link the same document to a second programme. **Shortlist** the programmes first (the Adviser preview lists only shortlisted ones). Readiness then reads the same on the programme page, Compare, Dashboard and Adviser preview.
3. Change the document to **Draft** — readiness drops everywhere. Set it back to **Ready**, confirm readiness recovers, then set an expiry date in the past — it no longer counts.
4. Add a task that needs another task first: it shows **Blocked** and cannot be completed until the prerequisite is done.
5. Add a deadline for today and one 20 days out: today appears under *Due soon* as "Due today"; the Dashboard counts update after reload.
6. Download the CSV and JSON from **Settings** and open the CSV in a spreadsheet; a programme named `=1+1` must appear as text.
7. Sign out; the private pages and downloads must now send you to sign-in.

## Not verified (remaining)

- **Sign-up confirmation and password-reset emails** (`M3.03`, `M3.04`, `M3.07`, `M3.08`, `M3.12`). The test accounts were created and auto-confirmed manually, so they are **not** evidence that sign-up or email confirmation works. Supabase's built-in sender only reaches project-team addresses at about 2 per hour, so outside users cannot be assumed to receive mail. **Outstanding release configuration:** custom SMTP (or another deliberate arrangement) must be set up before outside users can sign up or reset passwords. See README "Email and sign-up".
- Login failure text identical for unknown email vs wrong password (`M3.05`); sign-out followed by Back button (`M3.06`); time-zone sync on first sign-in (`M3.10`).
- **The live deployment** (`M6.16`): deployed at https://mktg4150-asm1.vercel.app; signed-out behaviour was agent-observed (above), and the student reported the deployment setup passed. A signed-in smoke test on production (sample load, export) has not been recorded with results, and sign-up for outside users depends on custom SMTP.
- Re-run on the final schema of `rls_coverage.sql`, `hosted_authz_check.sql` and `npm run check:api-isolation` (`M6.11`): migrations are unchanged since the student-reported runs, but the agent did not run them (it does not sign in to the hosted project), and the isolation script gained one check (another user cannot change a profile's simulated plan).
- Print preview of the **Compare** page (`M4.07`); the adviser print preview was reported fine.
- Automated accessibility scanning of rendered pages (no Chrome was available to the detector); no claim of WCAG conformance is made.
- Real-data loading, error and offline states were not forced (no safe way to do so without damaging data).

## Later improvements (not built)

Private file storage and versioning; real payments and entitlements; adviser invitations and cohort views; email or calendar reminders; CSV import and programme templates; calendar view; currency conversion with cited rates; multi-season support; timestamped notes log; consented analytics; localisation; automated browser tests and CI accessibility scans.
