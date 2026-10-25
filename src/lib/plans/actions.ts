"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/auth/actions";
import { getUser } from "@/lib/auth/dal";
import { bad, saved, text } from "@/lib/form-helpers";
import { createClient } from "@/lib/supabase/server";
import { isSelectablePlan, PLAN_LABELS } from "./plans";

/**
 * Simulated upgrade (PUB-03): stores only the plan label on the caller's own profile row. No payment, no entitlement.
 * The user id comes from the verified session; Row Level Security limits the update to that row. The licence tier is
 * enquiry-only and is never stored.
 */
export async function selectPlanAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return bad("Sign in to try the simulated upgrade.");
  const plan = text(fd, "plan");
  if (!isSelectablePlan(plan)) return bad("Choose the Free plan or the Season pass.");
  const supabase = await createClient();
  const upd = await supabase.from("profiles").update({ demo_plan: plan, demo_plan_selected_at: plan === "free" ? null : new Date().toISOString() }).eq("id", user.id).select("id");
  if (upd.error || !upd.data?.length) return bad("Your plan could not be changed. Try again.");
  revalidatePath("/pricing");
  revalidatePath("/settings");
  return saved(`${PLAN_LABELS[plan]} selected as a simulation. No payment was taken.`);
}
