import Link from "next/link";
import type { Cell, Column, MatrixRow } from "@/lib/programmes/compare";
import { ExampleBadge } from "./status-badge";

function CellView({ c }: { c: Cell }) {
  const muted = c.kind !== "value";
  return (
    <>
      <span className={muted ? "text-muted" : ""}>
        {c.kind === "missing" ? <span className="italic">{c.text}</span> : c.text}
      </span>
      {c.lowest && <span className="ml-2 rounded-full border border-accent bg-accent-tint px-2 py-0.5 text-xs font-semibold text-accent-strong">Lowest</span>}
    </>
  );
}

/**
 * Programmes as columns, attributes and requirements as rows. The first column stays visible while the table scrolls
 * sideways inside its own region, so the page itself never scrolls horizontally (CMP-04).
 */
export function CompareMatrix({ columns, rows }: { columns: Column[]; rows: MatrixRow[] }) {
  const groups: { title: string; rows: MatrixRow[] }[] = [
    { title: "Overview", rows: rows.filter((r) => r.group === "overview") },
    { title: "Requirements", rows: rows.filter((r) => r.group === "requirements") },
  ];
  return (
    <div role="region" aria-label="Programme comparison, scrolls sideways on small screens" tabIndex={0} className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth: `${12 + columns.length * 13}rem` }}>
        <caption className="sr-only">Side-by-side comparison of {columns.length} programmes</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="sticky left-0 z-10 w-44 border-r border-line bg-bg px-3 py-3 font-semibold">
              <span className="sr-only">Attribute</span>
            </th>
            {columns.map(({ programme: p }) => (
              <th key={p.id} scope="col" className="min-w-[12rem] bg-bg px-3 py-3 align-top font-semibold">
                <Link href={`/programmes/${p.id}`} className="inline-flex min-h-11 items-center text-accent underline underline-offset-4 hover:text-accent-strong">{p.programme_name}</Link>
                <div className="font-normal text-ink-2">{p.university_name}</div>
                {p.sample_key && <div className="mt-1 font-normal"><ExampleBadge /></div>}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((g) => g.rows.length > 0 && (
          <tbody key={g.title}>
            <tr>
              <th colSpan={columns.length + 1} scope="colgroup" className="sticky left-0 border-b border-line bg-info-tint px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-2">
                {g.title}
              </th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.key} className="border-b border-line last:border-0">
                <th scope="row" className="sticky left-0 z-10 border-r border-line bg-surface px-3 py-3 align-top font-semibold">
                  {r.label}
                  {r.differs && (
                    <span className="mt-1 block text-xs font-semibold text-accent-strong">Differs</span>
                  )}
                  {r.note && <span className="mt-1 block text-xs font-normal text-ink-2">{r.note}</span>}
                </th>
                {r.cells.map((c, i) => (
                  <td key={columns[i].programme.id} className="px-3 py-3 align-top"><CellView c={c} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
