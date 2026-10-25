import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Cell, Column, MatrixRow } from "@/lib/programmes/compare";
import { ExampleBadge } from "./status-badge";

function CellView({ c }: { c: Cell }) {
  const muted = c.kind !== "value";
  return (
    <>
      <span className={`inline-flex items-start gap-1.5 ${muted ? "text-muted" : ""}`}>
        {c.kind === "unknown" && <Icon name="circle" size={14} className="mt-1" />}
        {c.kind === "na" && <Icon name="dash" size={14} className="mt-1" />}
        {c.kind === "missing" ? <span className="italic">{c.text}</span> : <span>{c.text}</span>}
      </span>
      {c.lowest && <span className="ml-2 rounded-full border border-accent bg-accent-tint px-2 py-0.5 text-xs font-semibold text-accent-strong">Lowest</span>}
    </>
  );
}

/**
 * Programmes as columns, attributes and requirements as rows. The first column stays visible while the table scrolls
 * sideways inside its own region, so the page itself never scrolls horizontally (CMP-04).
 */
export function CompareMatrix({ columns, rows, linkNames = true }: { columns: Column[]; rows: MatrixRow[]; /** False for the landing-page preview, whose invented programmes have no pages to open. */ linkNames?: boolean }) {
  const groups: { title: string; rows: MatrixRow[] }[] = [
    { title: "Overview", rows: rows.filter((r) => r.group === "overview") },
    { title: "Requirements", rows: rows.filter((r) => r.group === "requirements") },
  ];
  return (
    <div role="region" aria-label="Programme comparison, scrolls sideways on small screens" tabIndex={0} className="relative overflow-x-auto overscroll-x-contain rounded-xl border border-line bg-surface shadow-panel">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth: `${12 + columns.length * 13}rem` }}>
        <caption className="sr-only">Side-by-side comparison of {columns.length} programmes</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="sticky left-0 z-10 w-32 border-r border-line bg-info-tint px-3 py-3 font-semibold sm:w-44">
              <span className="sr-only">Attribute</span>
            </th>
            {columns.map(({ programme: p }) => (
              <th key={p.id} scope="col" className="min-w-[12rem] bg-info-tint px-3 py-3 align-top">
                {linkNames ? (
                  <Link href={`/programmes/${p.id}`} className="inline-flex min-h-11 items-center font-display text-lg font-semibold leading-tight text-accent-strong underline underline-offset-4 hover:text-accent">{p.programme_name}</Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center font-display text-lg font-semibold leading-tight">{p.programme_name}</span>
                )}
                <div className="font-normal text-ink-2">{p.university_name}</div>
                {p.sample_key && <div className="mt-1 font-normal"><ExampleBadge /></div>}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((g) => g.rows.length > 0 && (
          <tbody key={g.title}>
            <tr>
              <th colSpan={columns.length + 1} scope="colgroup" className="sticky left-0 border-b border-t border-line bg-bg px-3 py-2 text-left font-display text-base font-semibold text-ink">
                <span className="sticky left-3 inline-block">{g.title}</span>
              </th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.key} className="group border-b border-line last:border-0">
                <th scope="row" className="sticky left-0 z-10 border-r border-line bg-surface px-3 py-3 align-top font-semibold group-hover:bg-bg">
                  {r.label}
                  {r.differs && (
                    <span className="mt-1 flex w-fit items-center gap-1 rounded-full border border-signal bg-signal-tint px-2 py-0.5 text-xs font-semibold text-signal"><Icon name="compare" size={12} />Differs</span>
                  )}
                  {r.note && <span className="mt-1 block text-xs font-normal text-ink-2">{r.note}</span>}
                </th>
                {r.cells.map((c, i) => (
                  <td key={columns[i].programme.id} className="px-3 py-3 align-top group-hover:bg-bg"><CellView c={c} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
