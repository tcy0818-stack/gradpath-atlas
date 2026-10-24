// Row types for documents (metadata only; no files). HAND-WRITTEN to match supabase/migrations/0005_documents.sql.
export const DOC_TYPES = ["transcript", "statement", "reference_letter", "cv", "language_certificate", "test_report", "portfolio", "other"] as const;
export type DocType = (typeof DOC_TYPES)[number];
export const DOC_TYPE_LABELS: Record<DocType, string> = {
  transcript: "Transcript",
  statement: "Statement",
  reference_letter: "Reference letter",
  cv: "CV",
  language_certificate: "Language certificate",
  test_report: "Test report",
  portfolio: "Portfolio",
  other: "Other",
};

export const PREP_STATUSES = ["not_started", "draft", "ready"] as const;
export type PrepStatus = (typeof PREP_STATUSES)[number];
export const PREP_LABELS: Record<PrepStatus, string> = { not_started: "Not started", draft: "Draft", ready: "Ready" };

export type DocumentRow = {
  id: string;
  owner_id: string;
  title: string;
  doc_type: DocType;
  prep_status: PrepStatus;
  expiry_date: string | null;
  notes: string | null;
  sample_key: string | null;
  created_at: string;
  updated_at: string;
};

/** The fields readiness needs from a document. */
export type DocFacts = Pick<DocumentRow, "id" | "title" | "doc_type" | "prep_status" | "expiry_date">;
