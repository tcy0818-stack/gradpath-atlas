import { DueLabel, Pill } from "@/components/planning/due-label";
import { CompareMatrix } from "@/components/programmes/compare-matrix";
import { formatIsoDate } from "@/lib/dates";
import { EXAMPLE_TODAY, exampleColumns, exampleReusedDocument, exampleRows, exampleWorkspace } from "@/lib/landing-example";

const panel = "rounded-lg border border-line bg-surface p-4";

/**
 * An illustrative preview, not a screenshot: the app's own comparison table and calculations run on invented example
 * data. Nothing in it links anywhere. The table region still scrolls sideways (touch and keyboard); `inert` would block that.
 */
export function LandingPreview() {
  return (
    <figure aria-label="Illustrative preview of the planner using invented example data: two programmes compared side by side, and one transcript reused for both programmes." className="m-0">
      <div className="overflow-hidden rounded-xl border border-line bg-bg shadow-lift">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5">
          <p className="font-display text-base font-semibold">Application season, at a glance</p>
          <Pill tone="accent">Example data</Pill>
        </div>
        <div className="space-y-4 p-3 sm:p-5">
          <div>
            <p className="mb-2 text-sm font-semibold">Compare programmes side by side</p>
            <p className="mb-2 text-sm text-muted md:hidden">Swipe the table sideways to compare →</p>
            <CompareMatrix columns={exampleColumns} rows={exampleRows} linkNames={false} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={panel}>
              <p className="text-sm font-semibold">One document, reused</p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">{exampleReusedDocument.title}</span> <Pill tone="ok">Ready</Pill>
              </p>
              <p className="mt-1 text-sm text-ink-2">Counts toward a required item in both {exampleReusedDocument.usedBy.join(" and ")}.</p>
            </div>
            <div className={panel}>
              <p className="text-sm font-semibold">Preparation, per programme</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {exampleWorkspace.programmes.map((s) => <li key={s.programme.id}><span className="font-semibold">{s.programme.programme_name}</span>: {s.readiness.label}</li>)}
              </ul>
              <p className="mt-2 text-sm text-ink-2">Counted from required items met by a Ready, unexpired document of the right type.</p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Illustrative preview with invented example data as of {formatIsoDate(EXAMPLE_TODAY)}. Not a screenshot of any real account.
      </figcaption>
    </figure>
  );
}

/** The first next actions from the same invented example, for the landing hero. Plain text and dates; nothing links. */
export function NextActionsExample() {
  const actions = exampleWorkspace.nextActions.slice(0, 3);
  return (
    <figure aria-label="Illustrative next actions using invented example data" className="m-0">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-lift">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg font-semibold">Next actions</p>
          <Pill tone="accent">Example data</Pill>
        </div>
        <ol className="mt-2 divide-y divide-line">
          {actions.map((a) => (
            <li key={a.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 text-sm">
              <span>
                <span className="font-semibold">{a.title}</span>
                <span className="block text-ink-2">{a.context}</span>
              </span>
              {a.date ? <DueLabel date={a.date} due={a.due} /> : null}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-ink-2">Blocked tasks wait here until their prerequisite is done.</p>
      </div>
      <figcaption className="mt-3 text-sm text-muted">Invented example data as of {formatIsoDate(EXAMPLE_TODAY)}.</figcaption>
    </figure>
  );
}
