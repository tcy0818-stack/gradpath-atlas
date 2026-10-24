---
name: GradPath Atlas
description: A calm, working academic planner: navy rail, pale ground, one teal accent.
colors:
  ground: "#f8fafc"
  surface: "#ffffff"
  ink: "#0f2a43"
  ink-2: "#334155"
  muted: "#475569"
  line: "#d5dde6"
  control: "#64748b"
  teal: "#0f766e"
  teal-strong: "#115e59"
  teal-tint: "#e6f4f1"
  teal-on-dark: "#5eead4"
  selection: "#b7e0d9"
  rail: "#0f2a43"
  rail-ink: "#e2e8f0"
  rail-muted: "#a9b8c9"
  rail-line: "#2a4560"
  rail-hover: "#17375a"
  rail-active: "#1f4570"
  danger: "#b42318"
  danger-tint: "#fef3f2"
  ok: "#166534"
  ok-tint: "#ecfdf3"
  info-tint: "#eef4fa"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
rounded:
  sm: "6px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.teal-strong}"
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.teal-tint}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "44px"
  nav-item:
    textColor: "{colors.rail-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  nav-item-hover:
    backgroundColor: "{colors.rail-hover}"
  nav-item-current:
    backgroundColor: "{colors.rail-active}"
  nav-item-soon:
    textColor: "{colors.rail-muted}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: GradPath Atlas

## Overview

**Creative North Star: "The Working Planner"**

A calm, private academic planner. The look is pinned by PRD section 3.2 (standard app shell, rail plus top bar), not rolled: a navy rail, a pale ground, white surfaces, one teal accent. It refuses the grey-screen-with-one-accent default by committing to the navy rail as the only dark mass and teal as the only chroma. Density is moderate and plain; empty states say so honestly, and unbuilt areas are shown as unavailable rather than faked.

Auth pages split at 1024px: a navy brand panel (wordmark, one promise, privacy facts, no imagery) beside a white form region with a single 24rem column. The workspace is a 15rem sticky navy rail, a thin white account bar, and a content column up to 68rem.

**Key Characteristics:**
- Navy rail (#0f2a43) is the only dark surface; everything else is pale ground and white.
- Teal is used for primary actions, links, and the focus ring only.
- System font stack, tabular numerals on body.
- 8px radius throughout; 1px hairlines instead of shadows.
- Status is always icon plus text. 44px minimum targets.

## Colors

A cool, desaturated navy-and-slate palette with a single teal voice.

### Primary
- **Working Teal** (#0f766e): primary button fill, in-sentence links, the 2px focus ring. White text on it is 5.5:1.
- **Deep Teal** (#115e59): hover state of the primary button and links.
- **Teal Mist** (#e6f4f1): hover fill of quiet buttons.
- **Lit Teal** (#5eead4): focus ring on navy (`.on-dark`) and the top bar of the brand mark. Dark surfaces only.

### Neutral
- **Pale Ground** (#f8fafc): page background.
- **Paper** (#ffffff): panels, fields, account bar.
- **Navy Ink** (#0f2a43): body text and headings; also the rail fill.
- **Slate Ink** (#334155): secondary text, info messages.
- **Slate Muted** (#475569): hints, labels of definitions, placeholders (7.2:1).
- **Hairline** (#d5dde6): panel and bar borders.
- **Control Edge** (#64748b): input and quiet-button borders, kept darker than the hairline so controls read as controls.
- **Selection Mint** (#b7e0d9): text selection background.

### Rail
- **Rail Ink** (#e2e8f0) text, **Rail Muted** (#a9b8c9) for unavailable items and secondary copy, **Rail Line** (#2a4560) chip border, **Rail Hover** (#17375a), **Rail Active** (#1f4570) current page.

### Status
- **Danger** (#b42318) on **Danger Tint** (#fef3f2); **Ok** (#166534) on **Ok Tint** (#ecfdf3); info uses **Info Tint** (#eef4fa) with Slate Ink and a Hairline border.

### Named Rules
**The One Voice Rule.** Teal is the only accent. Status colors appear only inside Alert and field errors, never as decoration.

**The Icon-Plus-Text Rule.** Status is never colour alone: every Alert and field error carries a 16px stroke icon and a sentence.

## Typography

**Display Font:** system UI stack (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial)
**Body Font:** same stack
**Label/Mono Font:** none

**Character:** Plain, native, and legible. One family, hierarchy by size and weight (600 for headings and labels, 400 for body); tight tracking on large sizes only.

### Hierarchy
- **Display** (600, 1.875rem, 1.25, -0.025em): the auth brand-panel promise only.
- **Headline** (600, 1.5rem, tracking-tight): page h1 (Dashboard, Sign in).
- **Title** (600, 1.125rem): panel and section h2.
- **Body** (400, 1rem, 1.5): paragraphs, inputs, primary button; prose capped at 65ch. Tabular numerals on.
- **Label** (600, 0.875rem): field labels, quiet buttons; 0.9375rem medium for nav rows; 0.875rem for hints, definition lists, footers.

### Named Rules
**The Tabular Rule.** Numerals are tabular on body so dates and counts align as they arrive.

## Layout

Standard app shell. At 1024px and up: grid of a 15rem sticky full-height rail and a fluid column; the column holds a 48-56px account bar (right-aligned) and a main region with content centered to 68rem, padded 16px (32px from 640px). Below 1024px the rail becomes a navy header with the wordmark and a native-disclosure Menu; the account bar sits beneath it. Auth: 5fr/6fr grid from 1024px; below it, a stacked page with the form in a 24rem column.

Rhythm uses the 4px Tailwind scale: 20px between form fields, 24px panel padding, 24-32px between page sections. Every page has a skip link and one h1 in the content.

## Elevation & Depth

Flat. Depth comes from tone (navy rail against pale ground, white panels) and 1px hairlines. The only shadow is the mobile menu popover (`shadow-lg shadow-black/25`), a soft one that lifts it off the page. No hard offset shadows.

## Shapes

One 8px radius for buttons, fields, alerts, panels, nav rows, and the menu popover. Smaller 6px on the focus-ring-bearing wordmark link; the "Soon" chip is a full pill. The brand mark is a 28px navy square (rx 7) with three staggered bars.

## Components

### Buttons
- **Shape:** 8px radius, 44px minimum height.
- **Primary:** teal fill, white 600 text at 1rem, full width, 10px 16px padding; hover Deep Teal; disabled is 70% opacity with wait cursor, label switches to a pending label.
- **Quiet:** white fill, Control Edge border, navy 600 text at 0.875rem, hover Teal Mist. Used for Sign out and menu-level actions.
- **Focus:** 2px teal outline offset 2px (Lit Teal on navy).

### Links
- In a sentence: teal, medium weight, underlined with 4px offset. Standing alone on a line: the same, with a 44px tall hit area.

### Inputs / Fields
- Label above (600, 0.875rem), optional muted hint, then a white 44px field with Control Edge border and 8px radius. Error turns the border Danger and adds an icon-plus-text message linked by aria-describedby; the first invalid field takes focus.

### Alert
- 8px radius, 1px border, tint fill, icon plus text. Errors use role=alert; success and info use role=status.

### Navigation
- Rail rows are 44px, 8px radius, 0.9375rem. Built areas are links (Rail Ink, medium); hover is Rail Hover. Current page is a Rail Active fill with semibold weight and `aria-current="page"`; no side stripe. Unbuilt areas (Programmes, Compare, Documents, Tasks, Deadlines, Adviser preview, Settings) are non-link rows in Rail Muted with a "Soon" pill and a screen-reader "not available yet". On small screens the same list opens in a popover from the Menu disclosure; Escape, outside click and navigation close it.

### Panel
- White, 1px Hairline border, 8px radius, 24px padding. Used for the dashboard empty state ("Nothing is tracked yet"): no invented figures.

## Do's and Don'ts

### Do:
- **Do** keep teal as the sole accent and the navy rail as the only dark surface.
- **Do** mark every current page with the Rail Active fill plus semibold, and every unbuilt area as a non-link with "Soon".
- **Do** pair every status color with an icon and text.
- **Do** keep targets at 44px minimum and the 2px teal focus ring on everything focusable.
- **Do** state empty states plainly; show no figures that were not recorded.

### Don't:
- **Don't** use side-stripe borders for current or status state.
- **Don't** link to routes that do not exist yet.
- **Don't** add shadows for hierarchy; use tone and hairlines.
- **Don't** introduce a second accent hue or a display typeface.

## Known gaps (finish review, verdict: fix; 5 of 8 resolved, 3 partial)

- Active nav state is built and styled but not yet seen in a browser on /dashboard, which needs a signed-in session (`.impeccable/review/active-nav.png` exists but is not confirmed as that state).
- Below 1024px the navy header and the white account bar still stack as two bars; unresolved.
- Standalone-link overlap was fixed by the 44px `standaloneLink` hit area; recheck on the next review.
- The auth brand panel's "Coursework prototype" line and the workspace shell are Phase 2 only; Phase 7 redoes public pages.
