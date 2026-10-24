// The one readiness implementation (PRD 5.5, RDY-01/02). Pure: nothing is stored, `today` is passed in.
// Programme detail, comparison (and later the dashboard, adviser preview and exports) all call this.
import { DOC_TYPE_LABELS, PREP_LABELS, type DocFacts, type DocType } from "@/lib/documents/types";
import { formatIsoDate } from "@/lib/dates";
import { REQUIREMENT_LABELS, type Requirement, type RequirementType } from "@/lib/programmes/types";

/** Which document type can satisfy which requirement. `academic` is self-checked and takes no documents. */
export const REQUIRED_DOC_TYPE: Record<RequirementType, DocType | null> = {
  academic: null,
  language: "language_certificate",
  references: "reference_letter",
  statement: "statement",
  transcript: "transcript",
  cv: "cv",
  test_score: "test_report",
  portfolio: "portfolio",
  other: "other",
};

export type DocIssue = "wrong_type" | "expired" | "not_started" | "draft";

/**
 * Why a linked document does not count, or null when it does. A document counts only if it is the matching type,
 * not expired and marked Ready. Expiry convention: `expiry_date` is the LAST valid day, so a document expiring today
 * still counts and one that expired yesterday does not (expired when expiry_date < today).
 */
export function docIssue(doc: DocFacts, reqType: RequirementType, today: string): DocIssue | null {
  if (REQUIRED_DOC_TYPE[reqType] !== doc.doc_type) return "wrong_type";
  if (doc.expiry_date != null && doc.expiry_date < today) return "expired";
  if (doc.prep_status === "not_started") return "not_started";
  if (doc.prep_status === "draft") return "draft";
  return null;
}

export const isExpired = (doc: Pick<DocFacts, "expiry_date">, today: string) => doc.expiry_date != null && doc.expiry_date < today;

export type LinkedDoc = { doc: DocFacts; issue: DocIssue | null; why: string | null };
export type ReqState = "satisfied" | "missing" | "optional" | "unknown" | "not_applicable";
export type ReqReadiness = {
  requirement: Requirement;
  state: ReqState;
  /** Documents that count / documents needed. For the self-checked type: 1 or 0 of 1. */
  have: number;
  need: number;
  selfChecked: boolean;
  linked: LinkedDoc[];
  /** One sentence for an unsatisfied required item; null otherwise. */
  missing: string | null;
};
export type Readiness = {
  items: ReqReadiness[];
  required: number;
  satisfied: number;
  /** Requirements whose level is still Unknown: listed as "needs checking", never counted either way. */
  unknown: number;
  /** True only when at least one required item exists and all are satisfied. */
  complete: boolean;
  /** "3 of 5 required satisfied" or "No required requirements recorded". */
  label: string;
};

function why(doc: DocFacts, issue: DocIssue, reqType: RequirementType): string {
  switch (issue) {
    case "wrong_type": {
      const want = REQUIRED_DOC_TYPE[reqType];
      return `${DOC_TYPE_LABELS[doc.doc_type]}, but ${REQUIREMENT_LABELS[reqType]} needs ${want ? DOC_TYPE_LABELS[want] : "no documents"}`;
    }
    case "expired":
      return `Expired on ${formatIsoDate(doc.expiry_date as string)}`;
    default:
      return `${PREP_LABELS[doc.prep_status]}, not Ready yet`;
  }
}

export function computeReadiness(requirements: Requirement[], linkedDocs: ReadonlyMap<string, DocFacts[]>, today: string): Readiness {
  const items = requirements.map((r): ReqReadiness => {
    const selfChecked = REQUIRED_DOC_TYPE[r.requirement_type] === null;
    const linked: LinkedDoc[] = selfChecked
      ? []
      : (linkedDocs.get(r.id) ?? []).map((doc) => {
          const issue = docIssue(doc, r.requirement_type, today);
          return { doc, issue, why: issue ? why(doc, issue, r.requirement_type) : null };
        });
    const need = selfChecked ? 1 : r.quantity;
    const have = selfChecked ? (r.self_confirmed ? 1 : 0) : linked.filter((l) => !l.issue).length;
    const label = REQUIREMENT_LABELS[r.requirement_type];
    let state: ReqState;
    let missing: string | null = null;
    if (r.level === "not_applicable") state = "not_applicable";
    else if (r.level === "unknown") state = "unknown";
    else if (r.level === "optional") state = "optional";
    else if (have >= need) state = "satisfied";
    else {
      state = "missing";
      missing = selfChecked
        ? `${label}: not confirmed yet.`
        : `${label}: ${have} of ${need} ready ${need === 1 ? "document" : "documents"}${linked.some((l) => l.issue) ? "; some linked documents do not count" : linked.length ? "" : "; none linked"}.`;
    }
    return { requirement: r, state, have, need, selfChecked, linked, missing };
  });
  const required = items.filter((i) => i.requirement.level === "required").length;
  const satisfied = items.filter((i) => i.state === "satisfied").length;
  const unknown = items.filter((i) => i.state === "unknown").length;
  return {
    items,
    required,
    satisfied,
    unknown,
    complete: required > 0 && satisfied === required,
    label: required === 0 ? "No required requirements recorded" : `${satisfied} of ${required} required satisfied`,
  };
}
