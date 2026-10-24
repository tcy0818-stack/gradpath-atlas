import { z } from "zod";
import { fieldErrors } from "@/lib/auth/schemas";
import { isValidIsoDate } from "@/lib/dates";
import { LEVELS, REQUIREMENT_TYPES, STATUSES, TUITION_STATES } from "./types";

const blank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
const blankToNull = (v: unknown) => (blank(v) ? null : v);
const toNumberOrNull = (v: unknown) => (blank(v) ? null : Number(v));

const optText = (max: number, label: string) =>
  z.preprocess(blankToNull, z.string().trim().max(max, `${label} must be at most ${max} characters.`).nullable());

const required = (label: string, max: number) =>
  z.string({ error: `Enter ${label}.` }).trim().min(1, `Enter ${label}.`).max(max, `Use at most ${max} characters.`);

/** Programme details (PRG-01, PRG-03). Blank duration/intake/tuition-amount means unknown, never 0. */
export const programmeSchema = z
  .object({
    university_name: required("the university name", 120),
    programme_name: required("the programme name", 160),
    country_region: optText(80, "Country or region"),
    subject: optText(80, "Subject"),
    intake_label: optText(40, "Intake"),
    duration_months: z.preprocess(
      toNumberOrNull,
      z.number({ error: "Enter the duration as a whole number of months." }).int("Enter a whole number of months.").min(1, "Duration must be at least 1 month.").max(120, "Duration must be at most 120 months.").nullable(),
    ),
    tuition_state: z.enum(TUITION_STATES, { error: "Choose whether tuition is known, unknown or not applicable." }),
    tuition_amount: z.preprocess(
      toNumberOrNull,
      z.number({ error: "Enter the tuition as a number." }).min(0, "Tuition cannot be negative.").max(9_999_999_999.99, "That amount is too large.").nullable(),
    ),
    tuition_currency: z.preprocess((v) => (blank(v) ? null : String(v).trim().toUpperCase()), z.string().nullable()),
    submission_deadline: z.preprocess(blankToNull, z.string().refine(isValidIsoDate, "Enter a valid date.").nullable()),
    // Only the create form sends these; edit uses dedicated actions.
    status: z.enum(STATUSES).optional(),
    notes: z.preprocess(blankToNull, z.string().trim().max(5000, "Notes must be at most 5000 characters.").nullable()).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.tuition_state !== "known") return;
    if (v.tuition_amount == null) ctx.addIssue({ code: "custom", path: ["tuition_amount"], message: "Enter the tuition amount, or choose Unknown or Not applicable." });
    if (v.tuition_currency == null || !/^[A-Z]{3}$/.test(v.tuition_currency))
      ctx.addIssue({ code: "custom", path: ["tuition_currency"], message: "Use a 3-letter currency code, for example GBP." });
  })
  .transform((v) => ({
    ...v,
    // Unknown / not applicable can never carry an amount (matches the database constraint).
    tuition_amount: v.tuition_state === "known" && v.tuition_amount != null ? Number(v.tuition_amount.toFixed(2)) : null,
    tuition_currency: v.tuition_state === "known" ? v.tuition_currency : null,
  }));
export type ProgrammeInput = z.output<typeof programmeSchema>;

export const requirementSchema = z.object({
  requirement_type: z.enum(REQUIREMENT_TYPES, { error: "Choose a requirement type." }),
  level: z.enum(LEVELS, { error: "Choose required, optional, unknown or not applicable." }),
  detail: optText(500, "Detail"),
  quantity: z.preprocess(
    (v) => (blank(v) ? 1 : Number(v)),
    z.number({ error: "Enter a whole number from 1 to 10." }).int("Enter a whole number from 1 to 10.").min(1, "Enter a whole number from 1 to 10.").max(10, "Enter a whole number from 1 to 10."),
  ),
});

export const idSchema = z.uuid();
export const statusSchema = z.enum(STATUSES);
export const notesSchema = z.preprocess(blankToNull, z.string().trim().max(5000, "Notes must be at most 5000 characters.").nullable());

/** Parses a FormData against a schema; returns data or per-field messages. */
export function parseForm<T extends z.ZodType>(schema: T, fd: FormData): { ok: true; data: z.output<T> } | { ok: false; errors: Record<string, string> } {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const r = schema.safeParse(raw);
  return r.success ? { ok: true, data: r.data } : { ok: false, errors: fieldErrors(r.error) };
}
