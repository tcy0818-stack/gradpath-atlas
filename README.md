# GradPath Atlas

A master's-application planning workspace (MKTG 4150 NPM, Assignment 1, hypothetical business 5). Students compare programmes, record requirements, link reusable documents, track tasks and deadlines, and see what is still missing. **Coursework prototype:** demo data is fictional, prices are hypothetical, no payment is ever taken, and documents are records only (no file upload).

Specification: [PRD.md](PRD.md). Build plan and evidence: [tasklist.md](tasklist.md). Test checklist and what is verified: [TESTING.md](TESTING.md).

**Status:** Phases 0–8 and the redesign are built and deployed at <https://gradpath-atlas-26.vercel.app>. Local checks pass (agent-run). The student reports every remaining manual check done and the project ready to submit (see TESTING.md for which results are agent-run and which are student-reported). Only the submission steps below remain.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth + Row Level Security) · Vitest. No payment processor, analytics or file storage.

## Node version

- **Deploy and develop on Node 22.x.** `package.json` pins `engines.node` to `22.x`; Vercel currently offers 24.x (default) and 22.x, so 22.x is a supported choice ([Vercel docs](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), checked 2026-10-25). Vercel lists Node 20 as being deprecated on 1 Oct 2026, so avoid 20.
- Checks passed on Node 22.23.4 (final review) and 22.13.0 (desktop), and also on Node 26.12.1, which Vercel does **not** offer; `npm ci` on 26 prints an engine warning only. Always confirm the Vercel project's Node version is 22.x.

## Local setup

```bash
npm ci                      # uses package-lock.json; do not run npm install
cp .env.example .env.local  # then fill in the values (see below)
npm run dev                 # http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `npm run lint` · `npm run typecheck` | ESLint · `next typegen` + `tsc --noEmit` |
| `npm test` | Vitest: unit tests plus database tests on in-process PostgreSQL (PGlite; **not** a Supabase run) |
| `npm run build` | Production build. Stop `npm run dev` first. |
| `npm run check:api-isolation` | Two-real-user isolation check against your Supabase project (needs `TEST_USER_*`). Creates and removes its own test rows. |

## Environment variables (names only; never commit values)

| Name | Where it is used | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Browser-safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public API key; data is protected by Row Level Security | Browser-safe |
| `NEXT_PUBLIC_SITE_URL` | Base of email-link redirects. `http://localhost:3000` locally; the production URL when deployed. It is baked in at build time, so **redeploy after changing it**. | Browser-safe |
| `SUPABASE_SECRET_KEY` | Account deletion only (`src/lib/supabase/admin.ts`) | **Server only.** Never `NEXT_PUBLIC_`. |
| `TEST_USER_A_EMAIL/_PASSWORD`, `TEST_USER_B_EMAIL/_PASSWORD` | `check:api-isolation` only; two throw-away confirmed accounts | Local only; do **not** set on Vercel |

`.env.local` is git-ignored. If `SUPABASE_SECRET_KEY` is still the placeholder, account deletion reports "not set up" and deletes nothing.

## Database (existing Supabase project)

Migrations are in `supabase/migrations/` and were applied by pasting each file into the Supabase **SQL Editor**, in order, on an empty project. Do not mix with `supabase db push` unless migration history is repaired.

1. `0001_foundation` → `0009_seed_functions` (schema, row-level security, seed and reset functions)
2. `0010_seed_planning` (fictional tasks and milestones; adds a function only)

Check that `0010` is applied: run `select proname from pg_proc where proname = 'seed_demo_planning';` — one row means yes. Do not re-run applied migrations. Verification scripts (paste into the SQL Editor; every returned line must start with `PASS`, or zero rows for coverage): `supabase/tests/rls_coverage.sql`, `supabase/tests/hosted_authz_check.sql`.

**Sample data:** in the app, **Load fictional examples** (Programmes page or empty dashboard) creates six invented programmes, tasks and deadlines relative to today's date; repeating it adds nothing. **Settings → Remove fictional examples** deletes them, *including any tasks, deadlines and requirements you added inside an example programme*; standalone records of your own are kept.

## Email and sign-up (important before going public)

Supabase's **built-in email sender** only delivers to addresses of your project's organisation team, at about **2 emails per hour**, with no delivery guarantee ([Supabase docs](https://supabase.com/docs/guides/auth/auth-smtp), checked 2026-10-25). So on the live site, sign-up confirmation and password-reset emails **will not reach a marker or other outsider**. **Custom SMTP is required for outside users, not an optional extra:** without it, they cannot receive sign-up or reset emails. The student reports the email checks done; which option was used (custom SMTP, a private demo account, or another arrangement) is for the student to state in the submission. The alternatives below are fallbacks.

1. **Custom SMTP** (enable it on the dashboard's Authentication settings page). Supabase lists Resend, AWS SES, Postmark, SendGrid, ZeptoMail and Brevo as examples; use a free tier you already control. After saving, mail goes to all addresses (starting limit 30 per hour).
2. **Hand over a pre-confirmed demo account** privately (see Submission) and leave sign-up as is. Marker sign-up will not work, and the page should not claim otherwise.
3. *Not recommended:* turn off email confirmation (the Auth Providers page in the dashboard; the menu names change, so check the current docs). That removes address verification for every account; do it only knowingly, for a short demo, and record it.

**Redirect and template settings** (dashboard Authentication section: URL Configuration and Email Templates):

- **Site URL** = `https://gradpath-atlas-26.vercel.app` (no trailing slash: the email templates below append `/auth/callback` to it). If the address changes, update `NEXT_PUBLIC_SITE_URL` in Vercel and redeploy, and update Supabase's Site URL and Redirect URLs to match.
- **Redirect URLs:** add `http://localhost:3000/**` and the production URL with `/**` ([docs](https://supabase.com/docs/guides/auth/redirect-urls)). Vercel preview URLs need a separate pattern if you use them.
- The app's `/auth/callback` accepts both `?code=` (same browser only) and `?token_hash=&type=` links. For links that work on any device, edit the **Confirm signup** template to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` and the **Reset password** template to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`.

## Manual deployment (Vercel)

You perform these steps; nothing here is automated.

1. Push the repository to GitHub (private is fine; see Submission for marker access).
2. Vercel → **Add New → Project** → import the GitHub repository. Framework preset: Next.js. Build command and output: defaults.
3. **Settings → Build and Deployment → Node.js Version: 22.x.**
4. **Settings → Environment Variables** (Production, and Preview if used): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (the final production URL), `SUPABASE_SECRET_KEY` (mark it sensitive). Do **not** add the `TEST_USER_*` variables.
5. Deploy. If the production URL is only known after the first deploy, set `NEXT_PUBLIC_SITE_URL`, then **redeploy**.
6. In Supabase, set Site URL and Redirect URLs to the production URL, and configure email (above).
7. **Settings → Deployment Protection:** confirm the production deployment is publicly reachable (no Vercel login) — check by opening it in a private window or another device.
8. The Hobby plan is for personal, non-commercial use ([Vercel docs](https://vercel.com/docs/plans/hobby)), which fits coursework.

### Verify the deployed site

- **Signed out, another browser or device:** `/`, `/pricing`, `/privacy`, `/login`, `/signup` load; `/dashboard`, `/settings` and `/api/export/workspace` redirect to `/login`.
- **Signed in:** run the workflow in TESTING.md ("Core workflow") on the live URL, then Settings → export.
- Confirm no browser console errors on the landing page and that a sign-in survives a reload.

## Keeping it online

The brief requires the site to remain accessible for at least **30 days after the Blackboard deadline** (Brief p.3); you may take it down after final grades are released. A free Supabase project is **paused after about a week of low activity** and can be resumed from its dashboard ([Supabase docs](https://supabase.com/docs/guides/platform/free-project-pausing)); a paused project makes the live site fail on sign-in. Open the site or the dashboard at least a few times a week, and check before marking. Vercel Hobby deployments are not paused for inactivity by anything in the pages checked, but verify the site again before submission.

## Submission checklist (from the supplied brief; fill in yourself)

- [ ] **Deadline.** The brief prints 11:00 p.m. HK time, 18 October 2026, and calls it both Sunday and Monday (pp.1). The late penalty is 100% after 30 minutes. Confirm the active deadline or any extension with the instructor *in writing* before relying on it (PRD A-02).
- [ ] **Repository link** (version control, 25%). If private, invite the instructor's address printed on Brief p.4 as a collaborator, after pushing. Never put credentials in the repo.
- [ ] **Live web app link** (25%), publicly reachable, kept up for 30+ days after the deadline.
- [ ] **PRD.md and tasklist.md** in the repository root and copies in the PDF, in alphabetical order by surname (Brief p.2). Each teammate also uploads their own PRD and task list to VeriGuide.
- [ ] **One PDF per team** (named after one representative) with a cover page: full names in alphabetical order by surname with student ID numbers; repository link(s); live-site link(s); the AI declaration: "We declare that ___% of the work involves AI assistance…" — **you supply the percentage**. Omitting it costs 2–12% (Brief p.3).
- [ ] **Blackboard and VeriGuide** both (VeriGuide closes 25 hours after Blackboard). Every teammate builds and links their own app.
- [ ] No real personal data in the submitted app or documents (Brief p.3); the demo data here is invented. Student ID numbers belong on the PDF cover page only; keep them out of the repository documents.
- [ ] Private marker access (a demo account, if sign-up email is not set up) goes in the Blackboard submission or an email to the instructor, **never** in the repository.

## Known limitations

See TESTING.md ("Not verified" and "Later improvements"). In short: email flows unverified for outside users; prices and limits are hypothetical and not enforced; documents are metadata only; the adviser view is a read-only preview of your own data, not shared access; no automated browser tests; Compare print preview unchecked.
