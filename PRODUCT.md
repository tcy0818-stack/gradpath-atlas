# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a final-year undergraduate applying to three or more master's programmes at once, usually across more than one country, working at a laptop or desktop in the weeks before several deadlines. Their job is to know, for each programme, what is required, what is still missing, which document they can reuse, and what to do next. Secondary, and only as potential buyers or reviewers: education advisers and university careers teams. These personas are hypotheses drawn from the approved PRD, not research findings. Confirmed by the student on 2026-10-25.

## Product Purpose

GradPath Atlas replaces the spreadsheet, email folder and notes a student uses to track master's applications with one planning workspace: programme records, a side-by-side comparison of requirements and deadlines, reusable document records linked to requirements, tasks with prerequisites, and a computed view of what is missing. Value proposition: "Compare your master's applications and see what to do next in one workspace." It plans; it never predicts admission, scrapes universities, submits applications or takes payments.

## Positioning

The planner that shows what is missing, not just what is listed: readiness is computed from linked, valid documents (draft, expired or wrong-type documents never count), and one document can be reused across programmes. A spreadsheet can store the same rows but cannot say which requirement is unsatisfied.

## Operating Context

Used at a desktop or laptop while reading university pages and email in other tabs. Data is entered by hand. Deadlines are calendar dates in the user's own time zone. All demo data is fictional and labelled. Files are never uploaded; documents are metadata only.

## Capabilities and Constraints

Stack is fixed by the repository: Next.js App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth) with Row Level Security. Documents are metadata only. The upgrade flow is a labelled simulation and no card details are ever collected. The adviser view is a read-only preview of the student's own workspace, not shared access. Phase 2 builds sign-up, sign-in, sign-out, password reset, email verification and the empty workspace shell only; programmes, documents, tasks, deadlines, dashboard metrics and exports are later phases and must not be faked.

## Brand Commitments

Name: GradPath Atlas. Calm, trustworthy and academic; plain English; no urgency tricks, fake scarcity, testimonials, adoption figures or partner logos. Look is pinned by the approved PRD section 3.2: light neutral background, navy/slate text, one restrained teal accent, system font stack (no third-party font requests), generous spacing, no gradients, stock photos or decorative charts, status never conveyed by colour alone.

## Evidence on Hand

None from customers: no interviews, surveys, competitor research or pricing evidence exist, and none may be invented. The only real assets are the project documents (PRD.md, tasklist.md) and the working codebase. Prices on the future pricing page are assumptions.

## Product Principles

1. Show what is missing before showing what is complete.
2. Unknown and not-applicable are real answers, never blanks or zeros.
3. Never imply something is done, paid for or guaranteed when it is not.
4. Keep the student in control of their data: export, reset and delete are first-class.
5. Quiet by default: one accent, one primary action per screen.

## Accessibility & Inclusion

Target WCAG 2.2 Level AA: text contrast of at least 4.5:1, a visible 2px focus ring, labelled inputs with linked error text, full keyboard operation, 44px touch targets on touch viewports, reduced-motion respected. No claim of full conformance from a single automated scan.
