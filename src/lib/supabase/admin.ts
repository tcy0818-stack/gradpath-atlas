import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Deletes one auth user with the secret key. This is the ONLY use of the privileged key: it never reads or writes
 * application tables (those always use the user's own session), and it is not importable from browser code.
 * Deleting the auth user cascades to every row the user owns (owner_id ... on delete cascade) and ends their sessions.
 */
export async function adminDeleteUser(userId: string, secretKey: string) {
  const admin = createClient(publicEnv().supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return admin.auth.admin.deleteUser(userId);
}
