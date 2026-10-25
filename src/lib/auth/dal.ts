import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

/**
 * The signed-in user, verified from the token signature (getClaims) — never from an unverified cookie.
 * Layouts do not re-run on navigation, so every protected page and action must call requireUser() itself.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Profile row created by the database trigger on sign-up; read through the user's own session (RLS). */
export const getProfile = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name, time_zone, demo_plan").eq("id", user.id).maybeSingle();
  return { displayName: (data?.display_name as string | null) ?? null, timeZone: (data?.time_zone as string | null) ?? "UTC", demoPlan: ((data?.demo_plan as string | null) ?? "free") as "free" | "season_pass" | "licence_enquiry" };
});
