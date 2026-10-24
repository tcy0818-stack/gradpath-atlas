import type { Metadata } from "next";
import Link from "next/link";
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
      <p className="text-sm"><Link href="/deadlines" className={textLink}>Back to deadlines</Link></p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add a deadline</h1>
      <div className="mt-6 max-w-3xl">
        <DeadlineForm mode="create" action={createDeadlineAction} programmes={programmes} defaults={{ programme_id: programmes.some((p) => p.id === programme) ? programme : null }} />
      </div>
    </>
  );
}
