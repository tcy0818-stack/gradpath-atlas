import type { Metadata } from "next";
import Link from "next/link";
import { DocumentForm } from "@/components/documents/document-form";
import { textLink } from "@/components/ui";
import { createDocumentAction } from "@/lib/documents/actions";

export const metadata: Metadata = { title: "Add document" };

export default function NewDocumentPage() {
  return (
    <>
      <p className="text-sm"><Link href="/documents" className={textLink}>Back to documents</Link></p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add a document</h1>
      <p className="mt-2 max-w-[65ch] text-ink-2">Records the details only. No file is uploaded; keep the file itself wherever you store it today.</p>
      <div className="mt-6 max-w-3xl"><DocumentForm mode="create" action={createDocumentAction} /></div>
    </>
  );
}
