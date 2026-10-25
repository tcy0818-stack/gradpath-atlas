// Account deletion rules, kept free of Next.js and Supabase so they can be tested. The caller supplies the verified
// user id (from the session, never from the form) and the privileged delete function.
export const DELETE_PHRASE = "DELETE";

/** The secret key in .env.example is a placeholder; treat it as "not configured" instead of calling the API with it. */
export const secretKeyReady = (key: string | undefined) => Boolean(key) && !/replace|your[-_]|example|placeholder/i.test(key as string);

export type DeleteOutcome = "deleted" | "unauthenticated" | "confirmation" | "not-configured" | "failed";

export async function performDeletion(args: {
  userId: string | null;
  typed: string;
  secretKey: () => string | undefined;
  deleteUser: (userId: string, secretKey: string) => Promise<{ error: unknown }>;
}): Promise<DeleteOutcome> {
  if (!args.userId) return "unauthenticated";
  if (args.typed.trim() !== DELETE_PHRASE) return "confirmation";
  let key: string | undefined;
  try {
    key = args.secretKey();
  } catch {
    return "not-configured";
  }
  if (!secretKeyReady(key)) return "not-configured";
  const { error } = await args.deleteUser(args.userId, key as string);
  return error ? "failed" : "deleted";
}
