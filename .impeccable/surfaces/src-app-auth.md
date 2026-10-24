---
version: 1
slug: "src-app-auth"
primary_target: "src/app/auth"
related_targets: ["src/app/(auth)","src/app/(workspace)","src/components"]
---

## Scope and mode

Operate. Surfaces: sign-up, sign-in, forgot/reset password pages and the empty authenticated workspace shell (Phase 2). Task: get into the workspace quickly and trust that it is private; then see an honest empty state. Constraints: PRD 3.2 pins the look; no invented metrics; later-phase features are shown as unavailable, never faked.

## Direction contract

THESIS: A calm, working academic planner. The shell commits to a navy rail with a teal accent on a pale ground and refuses the grey-screen-with-one-accent default. The sign-in page keeps a quiet navy brand panel that states the promise and the privacy facts, with no marketing imagery.
OWN-WORLD: Navy rail #0F2A43 with pale slate text and a lighter navy fill (#1F4570) for the current page; ground #F8FAFC; white surfaces; 1px #D5DDE6 rules; teal #0F766E for primary actions and focus; system sans with tabular numerals; 8px radius; 2px teal focus ring with offset; status always icon + text; no side stripes.
STORY: The visitor sees a private planning tool, signs in or creates an account in under a minute, reaches a workspace that says plainly nothing is tracked yet, and knows which areas are not available yet.
FIRST VIEWPORT: Auth pages: navy brand panel (from 1024px) with wordmark and the value proposition; white form region with one 24rem column, primary button full width under the last field, recovery links below. Workspace: 15rem navy rail (wordmark, nav, unavailable items marked "Soon"), top bar with the account name and Sign out (the page title is the h1 in the content), content column up to 68rem.
FORM: Standard app shell (rail + top bar), pinned by PRD 3.2, not rolled; position n/a; seed: none (brief-pinned, no roll).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Phase 7 will redo the landing page and public pages; this brief covers only Phase 2 surfaces.
