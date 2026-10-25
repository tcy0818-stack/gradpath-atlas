import type { Metadata } from "next";
import Link from "next/link";
import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader } from "@/components/page-header";
import { textLink } from "@/components/ui";
import { createDocumentAction } from "@/lib/documents/actions";

export const metadata: Metadata = { title: "Add document" };

export default function NewDocumentPage() {
  return (
    <>
      <PageHeader back={<Link href="/documents" className={textLink}>Back to documents</Link>} title="Add a document" lede="Records the details only. No file is uploaded; keep the file itself wherever you store it today." />
      <div className="mt-8 max-w-3xl rounded-xl border border-line bg-surface p-5 shadow-panel sm:p-6"><DocumentForm mode="create" action={createDocumentAction} /></div>
    </>
  );
}
