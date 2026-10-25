import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProgrammeForm } from "@/components/programmes/programme-form";
import { textLink } from "@/components/ui";
import { createProgrammeAction } from "@/lib/programmes/actions";

export const metadata: Metadata = { title: "Add programme" };

export default function NewProgrammePage() {
  return (
    <>
      <PageHeader
        back={<Link href="/programmes" className={textLink}>Back to programmes</Link>}
        title="Add programme"
        lede="Only the university and programme name are required. Anything you don't know yet can stay blank or be marked unknown."
      />
      <div className="mt-8 max-w-3xl rounded-xl border border-line bg-surface p-5 shadow-panel sm:p-6"><ProgrammeForm mode="create" action={createProgrammeAction} /></div>
    </>
  );
}
