"use server";

import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./dal";
import { authErrorMessage, MESSAGES } from "./error-map";
import { safeNextPath } from "./safe-path";
import { fieldErrors, forgotSchema, resetSchema, signInSchema, signUpSchema } from "./schemas";

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so the email field survives a failed submit. Passwords are never echoed. */
  email?: string;
};

const text = (fd: FormData, key: string) => (typeof fd.get(key) === "string" ? (fd.get(key) as string) : "");
const callbackUrl = (next?: string) =>
  `${publicEnv().siteUrl.replace(/\/$/, "")}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;

export async function signInAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").trim();
  const parsed = signInSchema.safeParse({ email, password: text(fd, "password") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    const message = authErrorMessage(error, "sign-in");
    return { status: "error", message: message === "treat-as-success" ? MESSAGES.generic : message, email };
  }
  redirect(safeNextPath(text(fd, "next")) ?? "/dashboard");
}

export async function signUpAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").trim();
  const parsed = signUpSchema.safeParse({ email, password: text(fd, "password"), confirm: text(fd, "confirm") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: callbackUrl() },
  });
  if (error) {
    const message = authErrorMessage(error, "sign-up");
    if (message !== "treat-as-success") return { status: "error", message, email };
    return { status: "success", message: MESSAGES.signUpCheckEmail, email };
  }
  if (data.session) redirect("/dashboard"); // project has email confirmation switched off
  return { status: "success", message: MESSAGES.signUpCheckEmail, email };
}

export async function forgotPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").trim();
  const parsed = forgotSchema.safeParse({ email });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/reset-password"),
  });
  // Rate limits are the only error worth showing; everything else looks like success so nothing leaks.
  if (error && authErrorMessage(error, "reset-request") !== "treat-as-success") {
    return { status: "error", message: MESSAGES.generic, email };
  }
  return { status: "success", message: MESSAGES.resetCheckEmail, email };
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({ password: text(fd, "password"), confirm: text(fd, "confirm") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  await requireUser(); // a recovery or normal session must exist
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: String(authErrorMessage(error, "reset-update")) };

  await supabase.auth.signOut({ scope: "local" }); // make the new password prove itself
  redirect("/login?notice=password-updated");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

/** Stores the browser's IANA time zone once, so "today" is the user's calendar day (PRD 5.5). */
export async function saveTimeZoneAction(timeZone: string) {
  const user = await requireUser();
  try {
    new Intl.DateTimeFormat("en", { timeZone });
  } catch {
    return;
  }
  if (timeZone.length > 64) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ time_zone: timeZone }).eq("id", user.id);
}
