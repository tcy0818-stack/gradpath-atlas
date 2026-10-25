"use client";

import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ReadinessMeter } from "./readiness-meter";
import { DocBadges } from "@/components/documents/doc-badges";
import { Field, StatusIcon, standaloneLink } from "@/components/ui";
import { linkDocumentAction, unlinkDocumentAction } from "@/lib/documents/actions";
import { DOC_TYPE_LABELS, type DocFacts } from "@/lib/documents/types";
import { setSelfConfirmedAction } from "@/lib/programmes/actions";
import { LEVEL_LABELS, REQUIREMENT_LABELS } from "@/lib/programmes/types";
import { REQUIRED_DOC_TYPE, type ReqReadiness, type ReqState, type Readiness } from "@/lib/readiness";

const STATE_TEXT: Record<ReqState, string> = {
  satisfied: "Satisfied",
  missing: "Missing",
  optional: "Optional",
  unknown: "Needs checking",
  not_applicable: "Not applicable",
};

function StateLabel({ state }: { state: ReqState }) {
  const tone = state === "satisfied" ? "success" : state === "missing" ? "error" : "info";
  const color = state === "satisfied" ? "text-ok" : state === "missing" ? "text-danger" : "text-ink-2";
  return <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${color}`}><StatusIcon tone={tone} />{STATE_TEXT[state]}</span>;
}

function Item({ item, documents, today }: { item: ReqReadiness; documents: DocFacts[]; today: string }) {
  const r = item.requirement;
  const label = REQUIREMENT_LABELS[r.requirement_type];
  const wanted = REQUIRED_DOC_TYPE[r.requirement_type];
  const linkedIds = new Set(item.linked.map((l) => l.doc.id));
  const candidates = documents.filter((d) => d.doc_type === wanted && !linkedIds.has(d.id));
  const counts = r.level === "required" || r.level === "optional";

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{label} <span className="font-normal text-ink-2">· {LEVEL_LABELS[r.level]}{r.detail ? ` · ${r.detail}` : ""}</span></h3>
        <StateLabel state={item.state} />
      </div>
      {counts && <p className="mt-1 text-sm text-ink-2">{item.selfChecked ? (r.self_confirmed ? "You have confirmed this is met." : "You have not confirmed this yet.") : `${item.have} of ${item.need} ready ${item.need === 1 ? "document" : "documents"} counted.`}</p>}
      {r.level === "unknown" && <p className="mt-1 text-sm text-ink-2">Check whether this programme asks for it, then set its level under Requirements. It is not counted until then.</p>}
      {r.level === "not_applicable" && <p className="mt-1 text-sm text-ink-2">This programme does not ask for it, so it is left out of readiness.</p>}

      {item.selfChecked ? (
        counts && (
          <ActionForm action={setSelfConfirmedAction} submitLabel={r.self_confirmed ? "Mark as not met" : "Mark as met"} className="mt-3 space-y-2">
            {() => (
              <>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="value" value={r.self_confirmed ? "0" : "1"} />
              </>
            )}
          </ActionForm>
        )
      ) : (
        <>
          {item.linked.length > 0 && (
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
              {item.linked.map((l) => (
                <li key={l.doc.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1">
                  <div className="py-2">
                    <Link href={`/documents/${l.doc.id}`} className="font-medium text-accent underline underline-offset-4 hover:text-accent-strong">{l.doc.title}</Link>
                    <span className="ml-2"><DocBadges doc={l.doc} today={today} /></span>
                    <p className="text-sm text-ink-2">{l.issue ? `Does not count: ${l.why}.` : "Counts toward this requirement."}</p>
                  </div>
                  <ActionForm
                    action={unlinkDocumentAction}
                    submitLabel={<>Unlink<span className="sr-only"> {l.doc.title} from {label}</span></>}
                    className="space-y-2"
                  >
                    {() => (
                      <>
                        <input type="hidden" name="requirement_id" value={r.id} />
                        <input type="hidden" name="document_id" value={l.doc.id} />
                      </>
                    )}
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
          {wanted && (
            <div className="mt-3">
              {candidates.length === 0 ? (
                <p className="text-sm text-ink-2">
                  {item.linked.length ? `No other ${DOC_TYPE_LABELS[wanted]} documents to link.` : `You have no ${DOC_TYPE_LABELS[wanted]} documents to link yet.`}{" "}
                  <Link href="/documents/new" className={standaloneLink}>Add a document</Link>
                </p>
              ) : (
                <ActionForm action={linkDocumentAction} submitLabel={<>Link<span className="sr-only"> document to {label}</span></>} className="flex flex-wrap items-end gap-3">
                  {(state) => (
                    <>
                      <input type="hidden" name="requirement_id" value={r.id} />
                      <div className="min-w-[16rem]">
                        <Field id={`link-${r.id}`} name="document_id" label={`Link a ${DOC_TYPE_LABELS[wanted]}`} options={candidates.map((d) => ({ value: d.id, label: `${d.title}` }))} defaultValue={state.status === "error" ? state.values?.document_id : undefined} error={state.fieldErrors?.document_id} />
                      </div>
                    </>
                  )}
                </ActionForm>
              )}
            </div>
          )}
        </>
      )}
    </li>
  );
}

/** Per-requirement readiness for one programme: what counts, what is missing, and where to link or unlink documents. */
export function ReadinessPanel({ readiness, documents, today }: { readiness: Readiness; documents: DocFacts[]; today: string }) {
  const missing = readiness.items.filter((i) => i.missing);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-info-tint p-4 sm:p-5">
        <div aria-live="polite"><ReadinessMeter readiness={readiness} size="lg" /></div>
        <p className="mt-1 max-w-[65ch] text-sm text-ink-2">
          Readiness is calculated from your requirements and linked documents. A document counts only when it is the right type, marked Ready and not past its expiry date. Optional, not applicable and unknown requirements are not counted.
          {readiness.unknown > 0 && ` ${readiness.unknown} ${readiness.unknown === 1 ? "requirement needs" : "requirements need"} checking.`}
        </p>
        <p className="mt-1 max-w-[65ch] text-sm text-ink-2">This is separate from the application status and from task progress.</p>
      </div>
      {readiness.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-control p-4 text-ink-2">No requirements recorded yet, so there is nothing to be ready for. Add the programme&apos;s requirements above first.</p>
      ) : (
        <>
          {missing.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">Still missing</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-2">{missing.map((i) => <li key={i.requirement.id}>{i.missing}</li>)}</ul>
            </div>
          )}
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface shadow-panel">{readiness.items.map((i) => <Item key={i.requirement.id} item={i} documents={documents} today={today} />)}</ul>
        </>
      )}
    </div>
  );
}
