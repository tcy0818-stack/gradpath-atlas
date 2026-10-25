import { z } from "zod";

const knownZone = (z0: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: z0 });
    return true;
  } catch {
    return false;
  }
};

/** Settings profile (SET-01). A blank display name clears it; the time zone must be a real IANA zone (it drives "today"). */
export const profileSchema = z.object({
  display_name: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(80, "Use at most 80 characters.").nullable(),
  ),
  time_zone: z.string({ error: "Choose a time zone." }).trim().min(1, "Choose a time zone.").max(64, "That time zone name is too long.").refine(knownZone, "Choose a time zone from the list."),
});
