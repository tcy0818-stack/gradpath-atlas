import type { Metadata } from "next";
import Link from "next/link";
import { DocBadges } from "@/components/documents/doc-badges";
import { PageHeader } from "@/components/page-header";
import { Alert, primaryButton, standaloneLink } from "@/components/ui";
import { getProfile } from "@/lib/auth/dal";
import { formatIsoDate, todayInZone } from "@/lib/dates";
import { listDocuments } from "@/lib/documents/queries";
import { DOC_TYPE_LABELS } from "@/lib/documents/types";

export const metadata: Metadata = { title: "Documents" };

const NOTICES: Record<string, string> = { deleted: "Document deleted. The programmes it was linked to are unchanged." };

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const sp = await searchParams;
  const [docs, profile] = await Promise.all([listDocuments(), getProfile()]);
  const today = todayInZone(profile.timeZone);
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];

  return (
    <>
      <PageHeader
        title="Documents"
        lede="This page tracks your documents, not the files. Nothing is uploaded or stored here; you record each document's type, how far along it is and when it expires, then link it to the requirements it satisfies. One document can serve several programmes."
        actions={<Link href="/documents/new" className={`${primaryButton} !w-auto`}>Add document</Link>}
      />
      {notice && <div className="mt-4"><Alert tone="success">{notice}</Alert></div>}

      <div className="mt-8">
        {docs.length === 0 ? (
          <section aria-labelledby="empty-h" className="rounded-xl border border-line bg-surface p-6 shadow-panel sm:p-8">
            <h2 id="empty-h" className="text-2xl">No documents yet</h2>
            <p className="mt-2 max-w-[65ch] text-ink-2">Add a transcript, CV or statement once, then link it to every programme that asks for it. Only a document marked Ready, not expired and of the right type counts toward a programme&apos;s readiness.</p>
            <div className="mt-4"><Link href="/documents/new" className={`${primaryButton} !w-auto`}>Add your first document</Link></div>
          </section>
        ) : (
          <div role="region" aria-label="Documents" tabIndex={0} className="relative overflow-x-auto rounded-xl border border-line bg-surface shadow-panel">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">Your documents</caption>
              <thead className="border-b border-line bg-info-tint">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Document</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Type</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Expires</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Used in</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-line last:border-0 hover:bg-bg">
                    <td className="px-3 py-1"><Link href={`/documents/${d.id}`} className={`${standaloneLink} !font-semibold`}>{d.title}</Link></td>
                    <td className="px-3 py-3">{DOC_TYPE_LABELS[d.doc_type]}</td>
                    <td className="px-3 py-3"><DocBadges doc={d} today={today} /></td>
                    <td className="px-3 py-3">{d.expiry_date ? formatIsoDate(d.expiry_date) : <span className="text-muted">No expiry</span>}</td>
                    <td className="px-3 py-3">{d.usage.length === 0 ? <span className="text-muted">Not linked</span> : `${d.usage.length} ${d.usage.length === 1 ? "requirement" : "requirements"}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
