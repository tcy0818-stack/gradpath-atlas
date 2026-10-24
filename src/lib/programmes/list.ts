import { STATUSES, type Programme, type Status } from "./types";

export const SORTS = {
  deadline: "Submission deadline (soonest first)",
  name: "Programme name (A to Z)",
  university: "University (A to Z)",
  tuition: "Tuition (lowest first, within each currency)",
} as const;
export type SortKey = keyof typeof SORTS;

export type ListParams = { q: string; status: Status | ""; country: string; subject: string; shortlisted: boolean; sort: SortKey };
export type ListRow = Programme & { deadline: string | null };

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Reads list filters from the URL. Unknown values fall back to "no filter" / default sort. */
export function parseListParams(sp: SearchParams): ListParams {
  const status = one(sp.status);
  const sort = one(sp.sort);
  return {
    q: one(sp.q).trim().slice(0, 100),
    status: (STATUSES as readonly string[]).includes(status) ? (status as Status) : "",
    country: one(sp.country).slice(0, 80),
    subject: one(sp.subject).slice(0, 80),
    shortlisted: one(sp.shortlisted) === "1",
    sort: sort in SORTS ? (sort as SortKey) : "deadline",
  };
}

const text = (s: string) => s.toLocaleLowerCase();
const byText = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

export function filterSort(rows: ListRow[], p: ListParams): ListRow[] {
  const q = text(p.q);
  const out = rows.filter((r) => {
    if (p.status && r.status !== p.status) return false;
    if (p.country && r.country_region !== p.country) return false;
    if (p.subject && r.subject !== p.subject) return false;
    if (p.shortlisted && !r.is_shortlisted) return false;
    if (q && ![r.university_name, r.programme_name, r.country_region ?? "", r.subject ?? ""].some((f) => text(f).includes(q))) return false;
    return true;
  });
  const tie = (a: ListRow, b: ListRow) => byText(a.programme_name, b.programme_name) || byText(a.university_name, b.university_name);
  const nullsLast = <T,>(a: T | null, b: T | null, cmp: (x: T, y: T) => number) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : cmp(a, b));
  return out.sort((a, b) => {
    switch (p.sort) {
      case "name":
        return tie(a, b);
      case "university":
        return byText(a.university_name, b.university_name) || byText(a.programme_name, b.programme_name);
      case "tuition": {
        // Never convert currencies: group by currency, then amount. Unknown / not applicable go last.
        const ka = a.tuition_state === "known" ? a : null;
        const kb = b.tuition_state === "known" ? b : null;
        return nullsLast(ka, kb, (x, y) => byText(x.tuition_currency ?? "", y.tuition_currency ?? "") || (x.tuition_amount ?? 0) - (y.tuition_amount ?? 0)) || tie(a, b);
      }
      default:
        return nullsLast(a.deadline, b.deadline, (x, y) => (x < y ? -1 : x > y ? 1 : 0)) || tie(a, b);
    }
  });
}

export function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))].sort(byText);
}
