import { z } from "zod";

const email = z.string().trim().max(254, "That email address is too long.").pipe(z.email({ error: "Enter a valid email address." }));
// Supabase hashes with bcrypt, which only uses the first 72 bytes, so cap there.
const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .refine((p) => new TextEncoder().encode(p).length <= 72, "Use at most 72 bytes (about 72 characters).");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(256),
});

export const signUpSchema = z
  .object({ email, password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "The two passwords do not match." });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "The two passwords do not match." });

/** First message per field, ready to show beside each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
