"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { bad, echo, saved, text } from "@/lib/form-helpers";
import { dbErrorMessage } from "@/lib/programmes/db-error";
import { idSchema, parseForm } from "@/lib/programmes/schemas";
import { createClient } from "@/lib/supabase/server";
import { taskRuleError, type Task } from "@/lib/tasks";
import { deadlineSchema, taskSchema } from "./schemas";

// The user's own session only: RLS and the (owner_id, id) foreign keys decide what can be touched, and the
// tasks_guard trigger refuses cycles and "done while blocked" even if this code were bypassed.
async function ctx() {
  await requireUser();
  return createClient();
}
type Supabase = Awaited<ReturnType<typeof createClient>>;
const refresh = () => {
  for (const p of ["/tasks", "/deadlines", "/programmes", "/compare"]) revalidatePath(p);
  revalidatePath("/tasks/[id]", "page");
  revalidatePath("/deadlines/[id]", "page");
  revalidatePath("/programmes/[id]", "page");
};
const allTasks = async (s: Supabase) => ((await s.from("tasks").select("id, programme_id, title, due_date, priority, status, prerequisite_task_id, completed_at, sample_key")).data ?? []) as Task[];

// --- tasks ----------------------------------------------------------------------------------------------------------
export async function createTaskAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseForm(taskSchema, fd);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: "Check the highlighted fields.", values: echo(fd) };
  const supabase = await ctx();
  const rule = taskRuleError(await allTasks(supabase), null, parsed.data);
  if (rule) return { status: "error", fieldErrors: { prerequisite_task_id: rule }, message: rule, values: echo(fd) };
  const ins = await supabase.from("tasks").insert(parsed.data).select("id").single();
  if (ins.error || !ins.data) return bad(dbErrorMessage(ins.error), fd);
  refresh();
  redirect("/tasks?notice=created");
}

export async function updateTaskAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) return bad("That task could not be found.");
  const parsed = parseForm(taskSchema, fd);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: "Check the highlighted fields.", values: echo(fd) };
  const supabase = await ctx();
  const rule = taskRuleError(await allTasks(supabase), id.data, parsed.data);
  if (rule) return { status: "error", fieldErrors: { [parsed.data.status === "done" ? "status" : "prerequisite_task_id"]: rule }, message: rule, values: echo(fd) };
  const upd = await supabase.from("tasks").update(parsed.data).eq("id", id.data).select("id");
  if (upd.error) return bad(dbErrorMessage(upd.error), fd);
  if (!upd.data?.length) return bad("That task could not be found.", fd);
  refresh();
  return saved("Task saved.");
}

/** Quick status change from the list. Refused (with a notice) when the prerequisite is not done. */
export async function setTaskStatusAction(fd: FormData): Promise<void> {
  const id = idSchema.safeParse(text(fd, "id"));
  const status = taskSchema.shape.status.safeParse(text(fd, "status"));
  if (!id.success || !status.success) redirect("/tasks?notice=failed");
  const supabase = await ctx();
  const tasks = await allTasks(supabase);
  const current = tasks.find((t) => t.id === id.data);
  if (!current) redirect("/tasks?notice=failed");
  if (taskRuleError(tasks, id.data, { status: status.data, prerequisite_task_id: current.prerequisite_task_id })) redirect("/tasks?notice=blocked");
  const upd = await supabase.from("tasks").update({ status: status.data }).eq("id", id.data).select("id");
  if (upd.error || !upd.data?.length) redirect("/tasks?notice=failed");
  refresh();
  redirect("/tasks");
}

export async function deleteTaskAction(fd: FormData): Promise<void> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) redirect("/tasks");
  const supabase = await ctx();
  const del = await supabase.from("tasks").delete().eq("id", id.data).select("id");
  if (del.error) redirect(`/tasks/${id.data}?notice=delete-failed`);
  refresh();
  redirect("/tasks?notice=deleted");
}

// --- deadlines ------------------------------------------------------------------------------------------------------
const deadlineError = (code?: string) =>
  code === "23505" ? "That programme already has an application deadline. Edit the existing one instead." : dbErrorMessage({ code });

export async function createDeadlineAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseForm(deadlineSchema, fd);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: "Check the highlighted fields.", values: echo(fd) };
  const supabase = await ctx();
  const ins = await supabase.from("deadlines").insert(parsed.data).select("id").single();
  if (ins.error || !ins.data) return bad(deadlineError(ins.error?.code), fd);
  refresh();
  redirect("/deadlines?notice=created");
}

export async function updateDeadlineAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) return bad("That deadline could not be found.");
  const parsed = parseForm(deadlineSchema, fd);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: "Check the highlighted fields.", values: echo(fd) };
  const supabase = await ctx();
  const upd = await supabase.from("deadlines").update(parsed.data).eq("id", id.data).select("id");
  if (upd.error) return bad(deadlineError(upd.error.code), fd);
  if (!upd.data?.length) return bad("That deadline could not be found.", fd);
  refresh();
  return saved("Deadline saved.");
}

/** Done / not done for milestones and other deadlines. Submission deadlines follow the programme's status instead. */
export async function setDeadlineDoneAction(fd: FormData): Promise<void> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) redirect("/deadlines?notice=failed");
  const supabase = await ctx();
  const upd = await supabase.from("deadlines").update({ is_done: text(fd, "value") === "1" }).eq("id", id.data).neq("deadline_type", "submission").select("id");
  if (upd.error || !upd.data?.length) redirect("/deadlines?notice=failed");
  refresh();
  redirect("/deadlines");
}

export async function deleteDeadlineAction(fd: FormData): Promise<void> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) redirect("/deadlines");
  const supabase = await ctx();
  const del = await supabase.from("deadlines").delete().eq("id", id.data).select("id");
  if (del.error) redirect(`/deadlines/${id.data}?notice=delete-failed`);
  refresh();
  redirect("/deadlines?notice=deleted");
}
