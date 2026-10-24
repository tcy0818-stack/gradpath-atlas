import { z } from "zod";
import { isValidIsoDate } from "@/lib/dates";
import { DEADLINE_TYPES } from "@/lib/deadlines";
import { PRIORITIES, TASK_STATUSES } from "@/lib/tasks";

const blankToNull = (v: unknown) => (v == null || (typeof v === "string" && v.trim() === "") ? null : v);
const optId = z.preprocess(blankToNull, z.uuid({ error: "Choose from the list." }).nullable());
const title = z.string({ error: "Enter a title." }).trim().min(1, "Enter a title.").max(160, "Use at most 160 characters.");

/** A blank due date means "no date" (undated tasks sort last); it is never replaced by today. */
export const taskSchema = z.object({
  title,
  programme_id: optId,
  due_date: z.preprocess(blankToNull, z.string().refine(isValidIsoDate, "Enter a valid date.").nullable()),
  priority: z.enum(PRIORITIES, { error: "Choose a priority." }),
  status: z.enum(TASK_STATUSES, { error: "Choose a status." }),
  prerequisite_task_id: optId,
});

export const deadlineSchema = z
  .object({
    deadline_type: z.enum(DEADLINE_TYPES, { error: "Choose a type." }),
    title,
    programme_id: optId,
    due_date: z.string({ error: "Enter a date." }).refine(isValidIsoDate, "Enter a valid date."),
    is_done: z.preprocess((v) => v === "on" || v === "1" || v === "true", z.boolean()),
  })
  .superRefine((v, ctx) => {
    if (v.deadline_type === "submission" && !v.programme_id) ctx.addIssue({ code: "custom", path: ["programme_id"], message: "An application deadline belongs to a programme. Choose one." });
  })
  // The programme's status closes a submission deadline; its own done flag is not used.
  .transform((v) => ({ ...v, is_done: v.deadline_type === "submission" ? false : v.is_done }));
