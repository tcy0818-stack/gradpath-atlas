"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth/actions";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { todayInZone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { dbErrorMessage } from "./db-error";
import { idSchema, notesSchema, parseForm, programmeSchema, requirementSchema, statusSchema } from "./schemas";

// Every action re-checks the session and writes with the user's own session: ownership is enforced by Row Level
// Security and the (owner_id, id) foreign keys, never by a privileged key (SEC-02). Errors become fixed sentences.
const text = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");
const bad = (message: string, fd?: FormData): FormState => ({ status: "error", message, values: fd ? echo(fd) : undefined });
const echo = (fd: FormData) => Object.fromEntries([...fd.entries()].filter((e): e is [string, string] => typeof e[1] === "string"));
const saved = (message = "Saved."): FormState => ({ status: "success", message });
const refresh = (id?: string) => {
  revalidatePath("/programmes");
  revalidatePath("/compare");
  if (id) revalidatePath(`/programmes/${id}`);
};

async function ctx() {
  await requireUser();
  return createClient();
}

/** Keeps the single submission-deadline row in step with the form: blank removes it, a date sets it. */
async function syncDeadline(supabase: Awaited<ReturnType<typeof createClient>>, programmeId: string, date: string | null) {
  if (date == null) return supabase.from("deadlines").delete().eq("programme_id", programmeId).eq("deadline_type", "submission");
  const existing = await supabase.from("deadlines").select("id").eq("programme_id", programmeId).eq("deadline_type", "submission").maybeSingle();
  if (existing.error) return existing;
  return existing.data
    ? supabase.from("deadlines").update({ due_date: date }).eq("id", existing.data.id)
    : supabase.from("deadlines").insert({ programme_id: programmeId, deadline_type: "submission", title: "Application deadline", due_date: date });
}

export async function createProgrammeAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseForm(programmeSchema, fd);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: "Check the highlighted fields.", values: echo(fd) };
  const { submission_deadline, ...row } = parsed.data;
  const supabase = await ctx();
  const ins = await supabase.from("programmes").insert({ ...row, status: row.status ?? "researching" }).select("id").single();
  if (ins.error || !ins.data) return bad(dbErrorMessage(ins.error), fd);
  const id = ins.data.id as string;
  const dl = submission_deadline ? await syncDeadline(supabase, id, submission_deadline) : null;
  refresh();
  redirect(`/programmes/${id}${dl?.error ? "?notice=deadline-failed" : ""}`);
}

export async function updateProgrammeAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) return bad("That programme could not be found.");
  const parsed = parseForm(programmeSchema, fd);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: "Check the highlighted fields.", values: echo(fd) };
  const { submission_deadline, status: _s, notes: _n, ...row } = parsed.data;
  void _s;
  void _n;
  const supabase = await ctx();
  const upd = await supabase.from("programmes").update(row).eq("id", id.data).select("id");
  if (upd.error) return bad(dbErrorMessage(upd.error), fd);
  if (!upd.data?.length) return bad("That programme could not be found.", fd);
  const dl = await syncDeadline(supabase, id.data, submission_deadline);
  if (dl.error) return bad(dbErrorMessage(dl.error), fd);
  refresh(id.data);
  return saved("Details saved.");
}

export async function setShortlistAction(fd: FormData): Promise<void> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) return;
  const supabase = await ctx();
  await supabase.from("programmes").update({ is_shortlisted: text(fd, "value") === "1" }).eq("id", id.data);
  refresh(id.data);
}

export async function setStatusAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = idSchema.safeParse(text(fd, "id"));
  const status = statusSchema.safeParse(text(fd, "status"));
  if (!id.success || !status.success) return bad("Choose a valid status.");
  const supabase = await ctx();
  const upd = await supabase.from("programmes").update({ status: status.data }).eq("id", id.data).select("id");
  if (upd.error) return bad(dbErrorMessage(upd.error));
  if (!upd.data?.length) return bad("That programme could not be found.");
  refresh(id.data);
  return saved("Status updated.");
}

export async function saveNotesAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = idSchema.safeParse(text(fd, "id"));
  const notes = notesSchema.safeParse(text(fd, "notes"));
  if (!id.success) return bad("That programme could not be found.");
  if (!notes.success) return { status: "error", message: notes.error.issues[0]?.message ?? "Check the notes.", values: echo(fd) };
  const supabase = await ctx();
  const upd = await supabase.from("programmes").update({ notes: notes.data }).eq("id", id.data).select("id");
  if (upd.error) return bad(dbErrorMessage(upd.error), fd);
  if (!upd.data?.length) return bad("That programme could not be found.", fd);
  refresh(id.data);
  return saved("Notes saved.");
}

export async function deleteProgrammeAction(fd: FormData): Promise<void> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) redirect("/programmes");
  const supabase = await ctx();
  const del = await supabase.from("programmes").delete().eq("id", id.data).select("id");
  if (del.error) redirect(`/programmes/${id.data}?notice=delete-failed`);
  refresh();
  redirect("/programmes?notice=deleted");
}

export async function addRequirementAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const programmeId = idSchema.safeParse(text(fd, "programme_id"));
  const parsed = parseForm(requirementSchema, fd);
  if (!programmeId.success) return bad("That programme could not be found.");
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: Object.values(parsed.errors)[0], values: echo(fd) };
  const supabase = await ctx();
  const ins = await supabase.from("requirements").insert({ ...parsed.data, programme_id: programmeId.data });
  if (ins.error) return bad(dbErrorMessage(ins.error), fd);
  refresh(programmeId.data);
  return saved("Requirement added.");
}

export async function updateRequirementAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = idSchema.safeParse(text(fd, "id"));
  const parsed = parseForm(requirementSchema, fd);
  if (!id.success) return bad("That requirement could not be found.");
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: Object.values(parsed.errors)[0], values: echo(fd) };
  const { requirement_type: _t, ...rest } = parsed.data; // the type of an existing requirement does not change
  void _t;
  const supabase = await ctx();
  const upd = await supabase.from("requirements").update(rest).eq("id", id.data).select("id, programme_id");
  if (upd.error) return bad(dbErrorMessage(upd.error));
  if (!upd.data?.length) return bad("That requirement could not be found.");
  refresh(upd.data[0].programme_id as string);
  return saved();
}

export async function deleteRequirementAction(fd: FormData): Promise<void> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) return;
  const supabase = await ctx();
  const del = await supabase.from("requirements").delete().eq("id", id.data).select("programme_id");
  refresh(del.data?.[0]?.programme_id as string | undefined);
}

/** Loads the fictional examples through the existing per-user seed function (idempotent; Phase 1 migration 0009). */
export async function loadExamplesAction(): Promise<void> {
  const profile = await getProfile();
  const supabase = await ctx();
  const { error } = await supabase.rpc("seed_demo_data", { p_seed_date: todayInZone(profile.timeZone) });
  refresh();
  redirect(error ? "/programmes?notice=seed-failed" : "/programmes?notice=seeded");
}
