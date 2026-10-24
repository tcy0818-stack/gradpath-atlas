"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { bad, echo, saved, text } from "@/lib/form-helpers";
import { dbErrorMessage } from "@/lib/programmes/db-error";
import { idSchema, parseForm } from "@/lib/programmes/schemas";
import { REQUIREMENT_LABELS, type RequirementType } from "@/lib/programmes/types";
import { REQUIRED_DOC_TYPE } from "@/lib/readiness";
import { createClient } from "@/lib/supabase/server";
import { documentSchema } from "./schemas";
import { DOC_TYPE_LABELS, type DocType } from "./types";

// Same rules as the programme actions: the user's own session only, so RLS and the (owner_id, id) foreign keys decide
// what can be touched. Readiness is calculated on read, so every change just refreshes the pages that show it.
async function ctx() {
  await requireUser();
  return createClient();
}
const refresh = () => {
  revalidatePath("/documents");
  revalidatePath("/documents/[id]", "page");
  revalidatePath("/programmes/[id]", "page");
  revalidatePath("/compare");
};

export async function createDocumentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseForm(documentSchema, fd);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: "Check the highlighted fields.", values: echo(fd) };
  const supabase = await ctx();
  const ins = await supabase.from("documents").insert(parsed.data).select("id").single();
  if (ins.error || !ins.data) return bad(dbErrorMessage(ins.error), fd);
  refresh();
  redirect(`/documents/${ins.data.id}?notice=created`);
}

export async function updateDocumentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) return bad("That document could not be found.");
  const parsed = parseForm(documentSchema, fd);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, message: "Check the highlighted fields.", values: echo(fd) };
  const supabase = await ctx();
  const upd = await supabase.from("documents").update(parsed.data).eq("id", id.data).select("id");
  if (upd.error) return bad(dbErrorMessage(upd.error), fd);
  if (!upd.data?.length) return bad("That document could not be found.", fd);
  refresh();
  return saved("Document saved. Readiness now uses the new status, type and expiry date.");
}

export async function deleteDocumentAction(fd: FormData): Promise<void> {
  const id = idSchema.safeParse(text(fd, "id"));
  if (!id.success) redirect("/documents");
  const supabase = await ctx();
  const del = await supabase.from("documents").delete().eq("id", id.data).select("id");
  if (del.error) redirect(`/documents/${id.data}?notice=delete-failed`);
  refresh();
  redirect("/documents?notice=deleted");
}

/** Links a document to a requirement, but only when its type fits that requirement (DOC-02). */
export async function linkDocumentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const requirementId = idSchema.safeParse(text(fd, "requirement_id"));
  const documentId = idSchema.safeParse(text(fd, "document_id"));
  if (!requirementId.success) return bad("That requirement could not be found.");
  if (!documentId.success) return bad("Choose a document to link.");
  const supabase = await ctx();
  const [req, doc] = await Promise.all([
    supabase.from("requirements").select("requirement_type").eq("id", requirementId.data).maybeSingle(),
    supabase.from("documents").select("doc_type").eq("id", documentId.data).maybeSingle(),
  ]);
  if (req.error || doc.error) return bad(dbErrorMessage(req.error ?? doc.error));
  if (!req.data) return bad("That requirement could not be found.");
  if (!doc.data) return bad("That document could not be found.");
  const reqType = req.data.requirement_type as RequirementType;
  const want = REQUIRED_DOC_TYPE[reqType];
  if (!want) return bad(`${REQUIREMENT_LABELS[reqType]} is confirmed by you and takes no documents.`);
  if (want !== (doc.data.doc_type as DocType)) return bad(`${REQUIREMENT_LABELS[reqType]} needs a ${DOC_TYPE_LABELS[want]}; that document is a ${DOC_TYPE_LABELS[doc.data.doc_type as DocType]}.`);
  const ins = await supabase.from("requirement_documents").insert({ requirement_id: requirementId.data, document_id: documentId.data });
  if (ins.error) return bad(ins.error.code === "23505" ? "That document is already linked here." : dbErrorMessage(ins.error));
  refresh();
  return saved("Document linked.");
}

/** Removes one link only; the document and its other links stay. */
export async function unlinkDocumentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const requirementId = idSchema.safeParse(text(fd, "requirement_id"));
  const documentId = idSchema.safeParse(text(fd, "document_id"));
  if (!requirementId.success || !documentId.success) return bad("That link could not be found.");
  const supabase = await ctx();
  const del = await supabase.from("requirement_documents").delete().eq("requirement_id", requirementId.data).eq("document_id", documentId.data).select("document_id");
  if (del.error) return bad(dbErrorMessage(del.error));
  if (!del.data?.length) return bad("That link was already removed.");
  refresh();
  return saved("Unlinked. The document and its other links are unchanged.");
}
