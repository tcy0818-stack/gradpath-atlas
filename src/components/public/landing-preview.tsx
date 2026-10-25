import { DueLabel, Pill } from "@/components/planning/due-label";
import { CompareMatrix } from "@/components/programmes/compare-matrix";
import { formatIsoDate } from "@/lib/dates";
import { EXAMPLE_TODAY, exampleColumns, exampleReusedDocument, exampleRows, exampleWorkspace } from "@/lib/landing-example";

const panel = "rounded-lg border border-line bg-surface p-4";

/**
 * An illustrative preview, not a screenshot: the app's own comparison table and calculations run on invented example
 * data. It is inert (nothing inside can be focused or clicked) and described once in the figure label.
 */
export function LandingPreview() {
  const actions = exampleWorkspace.nextActions.slice(0, 3);
  return (
    <figure aria-label="Illustrative preview of the planner using invented example data: two programmes compared side by side, the next actions in order, and one transcript reused for both programmes." className="m-0">
      <div inert className="space-y-4 rounded-xl border border-line bg-bg p-3 sm:p-4">
        <div>
          <p className="mb-2 text-sm font-semibold">Compare programmes side by side</p>
          <CompareMatrix columns={exampleColumns} rows={exampleRows} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={panel}>
            <p className="text-sm font-semibold">Next actions</p>
            <ol className="mt-2 divide-y divide-line text-sm">
              {actions.map((a) => (
                <li key={a.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
                  <span>
                    <span className="font-semibold">{a.title}</span>
                    <span className="block text-ink-2">{a.context}</span>
                  </span>
                  {a.date ? <DueLabel date={a.date} due={a.due} /> : null}
                </li>
              ))}
            </ol>
          </div>
          <div className={panel}>
            <p className="text-sm font-semibold">One document, reused</p>
            <p className="mt-2 text-sm">
              <span className="font-semibold">{exampleReusedDocument.title}</span> <Pill tone="ok">Ready</Pill>
            </p>
            <p className="mt-1 text-sm text-ink-2">Counts toward a required item in both {exampleReusedDocument.usedBy.join(" and ")}.</p>
            <ul className="mt-3 space-y-1 text-sm">
              {exampleWorkspace.programmes.map((s) => <li key={s.programme.id}>{s.programme.programme_name}: {s.readiness.label}</li>)}
            </ul>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-sm text-muted">
        Illustrative preview with invented example data as of {formatIsoDate(EXAMPLE_TODAY)}. Not a screenshot of any real account.
      </figcaption>
    </figure>
  );
}
