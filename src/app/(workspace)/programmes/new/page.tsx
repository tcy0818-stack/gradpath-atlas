import type { Metadata } from "next";
import Link from "next/link";
import { ProgrammeForm } from "@/components/programmes/programme-form";
import { textLink } from "@/components/ui";
import { createProgrammeAction } from "@/lib/programmes/actions";

export const metadata: Metadata = { title: "Add programme" };

export default function NewProgrammePage() {
  return (
    <>
      <p className="text-sm"><Link href="/programmes" className={textLink}>Back to programmes</Link></p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add programme</h1>
      <p className="mt-2 max-w-[65ch] text-ink-2">Only the university and programme name are required. Anything you don&apos;t know yet can stay blank or be marked unknown.</p>
      <div className="mt-6 max-w-3xl"><ProgrammeForm mode="create" action={createProgrammeAction} /></div>
    </>
  );
}
