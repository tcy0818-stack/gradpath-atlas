import type { Metadata } from "next";
import Link from "next/link";
import { CompareMatrix } from "@/components/programmes/compare-matrix";
import { Alert, quietButton, textLink } from "@/components/ui";
import { buildMatrix } from "@/lib/programmes/compare";
import { getCompareColumns, listProgrammeRows } from "@/lib/programmes/queries";

export const metadata: Metadata = { title: "Compare programmes" };

const MAX = 6;

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams;
  const requested = (Array.isArray(sp.ids) ? sp.ids : [sp.ids ?? ""]).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  const all = await listProgrammeRows();

  // With nothing chosen, compare the shortlist.
  const ids = requested.length ? requested : all.filter((r) => r.is_shortlisted).map((r) => r.id);
  const tooMany = ids.length > MAX;
  const columns = await getCompareColumns(ids.slice(0, MAX));
  const rows = columns.length >= 2 ? buildMatrix(columns) : [];
  const selected = new Set(columns.map((c) => c.programme.id));

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Compare programmes</h1>
      <p className="mt-2 max-w-[65ch] text-ink-2">
        {requested.length ? "Comparing the programmes you chose." : "Comparing your shortlist."} <strong>Unknown</strong> means not yet known; <strong>Not recorded</strong> means no requirement was entered. Tuition in different currencies is shown as entered and never converted.
      </p>

      {tooMany && <div className="mt-4"><Alert tone="info">Only the first {MAX} programmes are shown.</Alert></div>}

      {all.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-control p-6 text-ink-2">
          You have no programmes yet. <Link href="/programmes" className={textLink}>Add or load some programmes</Link> first.
        </p>
      ) : (
        <>
          <details open={columns.length < 2} className="mt-6 rounded-lg border border-line bg-surface">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 font-semibold">Choose programmes to compare</summary>
            <form method="get" action="/compare" className="border-t border-line p-4">
              <fieldset>
                <legend className="text-sm text-ink-2">Pick 2 to {MAX} programmes.</legend>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {all.map((r) => (
                    <li key={r.id}>
                      <label className="flex min-h-11 items-center gap-2">
                        <input type="checkbox" name="ids" value={r.id} defaultChecked={selected.has(r.id)} className="size-5 accent-[var(--accent)]" />
                        <span>{r.programme_name}<span className="text-ink-2">, {r.university_name}</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
              <button type="submit" className={`${quietButton} mt-3`}>Update comparison</button>
            </form>
          </details>

          <div className="mt-6">
            {columns.length < 2 ? (
              <div className="rounded-lg border border-dashed border-control p-6">
                <p className="font-semibold">Choose at least two programmes.</p>
                <p className="mt-1 text-ink-2">Tick programmes above, or shortlist some on the <Link href="/programmes" className={textLink}>Programmes page</Link>.</p>
              </div>
            ) : (
              <CompareMatrix columns={columns} rows={rows} />
            )}
          </div>
        </>
      )}
    </>
  );
}
