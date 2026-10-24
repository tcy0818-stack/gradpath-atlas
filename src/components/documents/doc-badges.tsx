import { isExpired } from "@/lib/readiness";
import { PREP_LABELS, type DocFacts } from "@/lib/documents/types";

const pill = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";

/** Preparation status and, separately, whether it has expired today. Text always carries the meaning. */
export function DocBadges({ doc, today }: { doc: Pick<DocFacts, "prep_status" | "expiry_date">; today: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`${pill} ${doc.prep_status === "ready" ? "border-ok bg-ok-tint text-ok" : "border-line bg-bg text-ink-2"}`}>{PREP_LABELS[doc.prep_status]}</span>
      {isExpired(doc, today) && <span className={`${pill} border-danger bg-danger-tint text-danger`}>Expired</span>}
    </span>
  );
}
