import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { DeadlineForm } from "@/components/planning/deadline-form";
import { textLink } from "@/components/ui";
import { createDeadlineAction } from "@/lib/planning/actions";
import { listProgrammeRefs } from "@/lib/planning/queries";

export const metadata: Metadata = { title: "Add deadline" };

export default async function NewDeadlinePage({ searchParams }: PageProps<"/deadlines/new">) {
  const sp = await searchParams;
  const programme = Array.isArray(sp.programme) ? sp.programme[0] : sp.programme;
  const programmes = await listProgrammeRefs();
  return (
    <>
      <PageHeader back={<Link href="/deadlines" className={textLink}>Back to deadlines</Link>} title="Add a deadline" />
      <div className="mt-8 max-w-3xl rounded-xl border border-line bg-surface p-5 shadow-panel sm:p-6">
        <DeadlineForm mode="create" action={createDeadlineAction} programmes={programmes} defaults={{ programme_id: programmes.some((p) => p.id === programme) ? programme : null }} />
      </div>
    </>
  );
}
