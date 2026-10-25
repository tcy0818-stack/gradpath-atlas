"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth/actions";
import { getUser, requireUser } from "@/lib/auth/dal";
import { serverSecretKey } from "@/lib/env";
import { bad, echo, saved, text } from "@/lib/form-helpers";
import { fieldErrors } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";
import { adminDeleteUser } from "@/lib/supabase/admin";
import { performDeletion } from "./delete";
import { profileSchema } from "./schemas";

const everything = () => revalidatePath("/", "layout");

export async function saveProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ display_name: text(fd, "display_name"), time_zone: text(fd, "time_zone") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), message: "Check the highlighted fields.", values: echo(fd) };
  const supabase = await createClient();
  const upd = await supabase.from("profiles").update(parsed.data).eq("id", user.id).select("id");
  if (upd.error || !upd.data?.length) return bad("Your settings could not be saved. Try again.", fd);
  everything(); // "today" changes with the time zone, so every date-based page must refetch
  return saved("Settings saved.");
}

/** Removes the fictional examples (programmes, documents, tasks, deadlines and what depends on them) via reset_demo_data (0009). */
export async function resetExamplesAction(): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_demo_data");
  everything();
  redirect(`/settings?notice=${error ? "reset-failed" : "reset"}`);
}

const DELETE_MESSAGES = {
  unauthenticated: "Your session has ended. Sign in again to delete your account.",
  confirmation: "Type DELETE exactly as shown to confirm.",
  "not-configured": "Account deletion is not set up on this deployment yet (the server-side secret key is missing), so nothing was deleted.",
  failed: "Your account could not be deleted, so nothing was changed. Try again later.",
} as const;

export async function deleteAccountAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser(); // verified from the signed token; the target is never taken from the form
  const outcome = await performDeletion({ userId: user?.id ?? null, typed: text(fd, "confirm"), secretKey: serverSecretKey, deleteUser: adminDeleteUser });
  if (outcome !== "deleted") return bad(DELETE_MESSAGES[outcome]);
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined); // clears this browser's session cookies
  redirect("/login?notice=account-deleted");
}
