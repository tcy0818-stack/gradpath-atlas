import "server-only";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

// Every query runs with the signed-in user's own session, so Row Level Security decides what is visible.
export async function db() {
  await requireUser();
  return createClient();
}
export type Db = Awaited<ReturnType<typeof db>>;

/** A failed read throws; (workspace)/error.tsx shows a recoverable message. */
export const must = <T,>(r: { data: T | null; error: unknown }, what: string): T => {
  if (r.error || r.data == null) throw new Error(`Could not load ${what}.`);
  return r.data;
};
