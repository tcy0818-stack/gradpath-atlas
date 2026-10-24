import Link from "next/link";
import { quietButton, standaloneLink, textLink } from "@/components/ui";
import { formatIsoDate } from "@/lib/dates";
import { tuitionLabel } from "@/lib/programmes/compare";
import { SORTS, type ListParams, type ListRow } from "@/lib/programmes/list";
import { setShortlistAction } from "@/lib/programmes/actions";
import { STATUSES, STATUS_LABELS } from "@/lib/programmes/types";
import { ExampleBadge, StatusBadge } from "./status-badge";

const selectClass = "mt-1 block min-h-11 w-full rounded-lg border border-control bg-surface px-3 py-2 text-base text-ink";
const label = "block text-sm font-semibold";

function FilterForm({ params, countries, subjects }: { params: ListParams; countries: string[]; subjects: string[] }) {
  const active = params.q || params.status || params.country || params.subject || params.shortlisted || params.sort !== "deadline";
  return (
    <form method="get" role="search" aria-label="Search and filter programmes" className="rounded-lg border border-line bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <label htmlFor="q" className={label}>Search</label>
          <input id="q" name="q" type="search" defaultValue={params.q} maxLength={100} placeholder="University, programme, country or subject" className={selectClass} />
        </div>
        <div>
          <label htmlFor="status" className={label}>Status</label>
          <select id="status" name="status" defaultValue={params.status} className={selectClass}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="country" className={label}>Country or region</label>
          <select id="country" name="country" defaultValue={params.country} className={selectClass}>
            <option value="">All</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="subject" className={label}>Subject</label>
          <select id="subject" name="subject" defaultValue={params.subject} className={selectClass}>
            <option value="">All</option>
            {subjects.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className={label}>Sort by</label>
          <select id="sort" name="sort" defaultValue={params.sort} className={selectClass}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex min-h-11 items-center gap-2 text-base">
            <input type="checkbox" name="shortlisted" value="1" defaultChecked={params.shortlisted} className="size-5 accent-[var(--accent)]" />
            Shortlisted only
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className={quietButton}>Apply</button>
        {active && <Link href="/programmes" className={textLink}>Clear filters</Link>}
      </div>
    </form>
  );
}

/** Programme table with search/filter/sort controls, shortlist toggles and checkboxes that feed /compare. */
export function ProgrammeList({ rows, total, params, countries, subjects }: { rows: ListRow[]; total: number; params: ListParams; countries: string[]; subjects: string[] }) {
  return (
    <div className="space-y-4">
      <FilterForm params={params} countries={countries} subjects={subjects} />
      <p className="text-sm text-ink-2" aria-live="polite">
        Showing {rows.length} of {total} {total === 1 ? "programme" : "programmes"}.
        {params.sort === "tuition" && " Tuition is sorted within each currency; currencies are not converted."}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-control p-6">
          <p className="font-semibold">No programmes match these filters.</p>
          <p className="mt-1 text-ink-2">Try a different search, or <Link href="/programmes" className={textLink}>clear the filters</Link>.</p>
        </div>
      ) : (
        <>
          <form id="compare-form" method="get" action="/compare" className="flex flex-wrap items-center gap-3">
            <button type="submit" className={quietButton}>Compare selected</button>
            <span className="text-sm text-muted">Tick 2 to 6 programmes. With none ticked, your shortlist is compared.</span>
          </form>
          <div role="region" aria-label="Programmes" tabIndex={0} className="overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
              <caption className="sr-only">Your programmes</caption>
              <thead className="border-b border-line bg-bg">
                <tr>
                  <th scope="col" className="w-12 px-3 py-2"><span className="sr-only">Select to compare</span></th>
                  <th scope="col" className="px-3 py-2 font-semibold">Programme</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Country or region</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Tuition</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Deadline</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Shortlist</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-1">
                      <input type="checkbox" form="compare-form" name="ids" value={r.id} aria-label={`Compare ${r.university_name}, ${r.programme_name}`} className="size-5 accent-[var(--accent)]" />
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/programmes/${r.id}`} className={`${standaloneLink} !font-semibold`}>{r.programme_name}</Link>
                      <div className="text-ink-2">{r.university_name}</div>
                      {r.sample_key && <div className="mt-1"><ExampleBadge /></div>}
                    </td>
                    <td className="px-3 py-3">{r.country_region ?? <span className="text-muted">Unknown</span>}</td>
                    <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-3">{tuitionLabel(r)}</td>
                    <td className="px-3 py-3">{r.deadline ? formatIsoDate(r.deadline) : <span className="text-muted">Unknown</span>}</td>
                    <td className="px-3 py-1">
                      <form action={setShortlistAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="value" value={r.is_shortlisted ? "0" : "1"} />
                        <button type="submit" aria-pressed={r.is_shortlisted} aria-label={`${r.is_shortlisted ? "Remove from shortlist" : "Shortlist"}: ${r.programme_name}`} className={`${quietButton} ${r.is_shortlisted ? "!border-accent !bg-accent-tint" : ""}`}>
                          {r.is_shortlisted ? "Shortlisted" : "Shortlist"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
