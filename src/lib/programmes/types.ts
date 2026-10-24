// Row types for the tables Phase 3 reads and writes. HAND-WRITTEN to match supabase/migrations/0001-0009
// (not generated: the Supabase CLI is not used). If a migration changes a column, change it here too.
export const STATUSES = ["researching", "preparing", "submitted", "decision_received", "withdrawn"] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABELS: Record<Status, string> = {
  researching: "Researching",
  preparing: "Preparing",
  submitted: "Submitted",
  decision_received: "Decision received",
  withdrawn: "Withdrawn",
};

export const TUITION_STATES = ["known", "unknown", "not_applicable"] as const;
export type TuitionState = (typeof TUITION_STATES)[number];
export const TUITION_STATE_LABELS: Record<TuitionState, string> = {
  known: "Known",
  unknown: "Unknown",
  not_applicable: "Not applicable",
};

export const REQUIREMENT_TYPES = ["academic", "language", "references", "statement", "transcript", "cv", "test_score", "portfolio", "other"] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];
export const REQUIREMENT_LABELS: Record<RequirementType, string> = {
  academic: "Minimum academic requirement",
  language: "Language requirement",
  references: "References",
  statement: "Statement",
  transcript: "Transcript",
  cv: "CV",
  test_score: "Test score",
  portfolio: "Portfolio",
  other: "Other",
};

export const LEVELS = ["required", "optional", "not_applicable", "unknown"] as const;
export type Level = (typeof LEVELS)[number];
export const LEVEL_LABELS: Record<Level, string> = {
  required: "Required",
  optional: "Optional",
  not_applicable: "Not applicable",
  unknown: "Unknown",
};

export type Programme = {
  id: string;
  owner_id: string;
  university_name: string;
  programme_name: string;
  country_region: string | null;
  subject: string | null;
  intake_label: string | null;
  duration_months: number | null;
  tuition_state: TuitionState;
  tuition_amount: number | null;
  tuition_currency: string | null;
  status: Status;
  is_shortlisted: boolean;
  notes: string | null;
  sample_key: string | null;
  created_at: string;
  updated_at: string;
};

export type Requirement = {
  id: string;
  owner_id: string;
  programme_id: string;
  requirement_type: RequirementType;
  level: Level;
  detail: string | null;
  quantity: number;
  self_confirmed: boolean;
  created_at: string;
  updated_at: string;
};

export type StatusHistoryRow = {
  id: string;
  programme_id: string;
  from_status: Status | null;
  to_status: Status;
  changed_at: string;
};

/** Only the submission deadline is shown in Phase 3; the full deadline table arrives in Phase 5. */
export type SubmissionDeadline = { id: string; programme_id: string; due_date: string };
