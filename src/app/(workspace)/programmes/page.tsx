import type { Metadata } from "next";
import Link from "next/link";
import { LoadExamples } from "@/components/programmes/load-examples";
import { ProgrammeList } from "@/components/programmes/programme-list";
import { Alert, primaryButton } from "@/components/ui";
import { distinct, filterSort, parseListParams } from "@/lib/programmes/list";
import { listProgrammeRows } from "@/lib/programmes/queries";

export const metadata: Metadata = { title: "Programmes" };

const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  deleted: { tone: "success", text: "Programme deleted. Your reusable documents were kept." },
  seeded: { tone: "success", text: "Fictional example programmes are loaded next to your own. They are invented for demonstration and labelled as such; loading them again adds nothing." },
  "seeded-no-planning": { tone: "error", text: "The example programmes are loaded, but the sample tasks and milestones were not. Apply migration 0010_seed_planning.sql in Supabase, then load the examples again." },
  "seed-failed": { tone: "error", text: "Couldn't load the examples. Try again in a moment." },
};

export default async function ProgrammesPage({ searchParams }: PageProps<"/programmes">) {
  const sp = await searchParams;
  const params = parseListParams(sp);
  const all = await listProgrammeRows();
  const rows = filterSort(all, params);
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Programmes</h1>
        <div className="flex flex-wrap items-center gap-3">
          {all.length > 0 && <LoadExamples />}
          <Link href="/programmes/new" className={`${primaryButton} !w-auto`}>Add programme</Link>
        </div>
      </div>

      {notice && <div className="mt-4"><Alert tone={notice.tone}>{notice.text}</Alert></div>}

      <div className="mt-6">
        {all.length === 0 ? (
          <section aria-labelledby="empty-heading" className="rounded-lg border border-line bg-surface p-6">
            <h2 id="empty-heading" className="text-lg font-semibold">No programmes yet</h2>
            <p className="mt-2 max-w-[65ch] text-ink-2">
              Add the master&apos;s programmes you are considering, or load a set of fictional examples to see how comparison works. The examples are invented and labelled, and you can remove them later.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/programmes/new" className={`${primaryButton} !w-auto`}>Add a programme</Link>
              <LoadExamples />
            </div>
          </section>
        ) : (
          <ProgrammeList rows={rows} total={all.length} params={params} countries={distinct(all.map((r) => r.country_region))} subjects={distinct(all.map((r) => r.subject))} />
        )}
      </div>
    </>
  );
}
