import type { Metadata } from "next";
import Link from "next/link";
import { DeleteDocument } from "@/components/documents/delete-document";
import { DocBadges } from "@/components/documents/doc-badges";
import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader, Section } from "@/components/page-header";
import { Alert, standaloneLink, textLink } from "@/components/ui";
import { getProfile } from "@/lib/auth/dal";
import { todayInZone } from "@/lib/dates";
import { updateDocumentAction } from "@/lib/documents/actions";
import { getDocument } from "@/lib/documents/queries";
import { DOC_TYPE_LABELS } from "@/lib/documents/types";
import { LEVEL_LABELS, REQUIREMENT_LABELS } from "@/lib/programmes/types";

export const metadata: Metadata = { title: "Document" };

const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  created: { tone: "success", text: "Document added. Link it to a requirement from a programme page." },
  "delete-failed": { tone: "error", text: "The document could not be deleted. Nothing was removed; try again." },
};

export default async function DocumentPage({ params, searchParams }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [doc, profile] = await Promise.all([getDocument(id), getProfile()]);
  const today = todayInZone(profile.timeZone);
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];

  return (
    <div className="space-y-8">
      <PageHeader
        back={<Link href="/documents" className={textLink}>Back to documents</Link>}
        title={doc.title}
        lede={<span className="flex flex-wrap items-center gap-x-3 gap-y-1">{DOC_TYPE_LABELS[doc.doc_type]}<DocBadges doc={doc} today={today} /></span>}
      />
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <div className="max-w-3xl space-y-10">
        <Section id="details-h" title="Details" hint="Metadata only; no file is uploaded. Changing the type, status or expiry date changes readiness everywhere this document is linked. A document counts only while it is Ready, of the right type, and not past its expiry date (the expiry date is the last valid day).">
          <DocumentForm mode="edit" action={updateDocumentAction} defaults={doc} />
        </Section>

        <Section id="used-h" title="Where it is used">
          {doc.usage.length === 0 ? (
            <p className="rounded-lg border border-dashed border-control p-4 text-ink-2">Not linked to any requirement yet. Open a programme, go to its Readiness section and link this document to a requirement.</p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface shadow-panel">
              {doc.usage.map((u) => (
                <li key={u.requirementId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-1">
                  <Link href={`/programmes/${u.programmeId}`} className={standaloneLink}>{u.programmeName}, {u.universityName}</Link>
                  <span className="text-sm text-ink-2">{REQUIREMENT_LABELS[u.requirementType]} · {LEVEL_LABELS[u.level]}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-sm text-ink-2">Unlink it from a single requirement on that programme&apos;s page; the document and its other links stay.</p>
        </Section>

        <Section id="danger-h" title="Delete document" hint="Removes this record and its links to requirements. Programmes are kept.">
          <DeleteDocument id={doc.id} title={doc.title} usage={doc.usage.map((u) => ({ programmeName: u.programmeName, requirementLabel: REQUIREMENT_LABELS[u.requirementType] }))} />
        </Section>
      </div>
    </div>
  );
}
