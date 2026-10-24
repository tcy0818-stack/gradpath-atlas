import { z } from "zod";
import { isValidIsoDate } from "@/lib/dates";
import { DOC_TYPES, PREP_STATUSES } from "./types";

const blankToNull = (v: unknown) => (v == null || (typeof v === "string" && v.trim() === "") ? null : v);

/** Document metadata (DOC-01). A blank expiry or notes means none; nothing here ever carries a file. */
export const documentSchema = z.object({
  title: z.string({ error: "Enter a title." }).trim().min(1, "Enter a title.").max(160, "Use at most 160 characters."),
  doc_type: z.enum(DOC_TYPES, { error: "Choose a document type." }),
  prep_status: z.enum(PREP_STATUSES, { error: "Choose a preparation status." }),
  expiry_date: z.preprocess(blankToNull, z.string().refine(isValidIsoDate, "Enter a valid date.").nullable()),
  notes: z.preprocess(blankToNull, z.string().trim().max(2000, "Notes must be at most 2000 characters.").nullable()),
});
export type DocumentInput = z.output<typeof documentSchema>;
