import "server-only";
import { notFound } from "next/navigation";
import { db, must, type Db } from "@/lib/db";
import { idSchema } from "@/lib/programmes/schemas";
import type { Level, RequirementType } from "@/lib/programmes/types";
import type { DocFacts, DocumentRow } from "./types";

const FACT_COLUMNS = "id, title, doc_type, prep_status, expiry_date";

/** Linked documents per requirement id, for the shared readiness calculation. */
export async function loadLinkedDocs(supabase: Db, requirementIds: string[]): Promise<Map<string, DocFacts[]>> {
  const out = new Map<string, DocFacts[]>();
  if (!requirementIds.length) return out;
  const links = must(await supabase.from("requirement_documents").select("requirement_id, document_id").in("requirement_id", requirementIds), "document links") as { requirement_id: string; document_id: string }[];
  if (!links.length) return out;
  const docs = new Map((must(await supabase.from("documents").select(FACT_COLUMNS).in("id", [...new Set(links.map((l) => l.document_id))]), "documents") as DocFacts[]).map((d) => [d.id, d]));
  for (const l of links) {
    const d = docs.get(l.document_id);
    if (d) out.set(l.requirement_id, [...(out.get(l.requirement_id) ?? []), d]);
  }
  return out;
}

export type DocUsage = { requirementId: string; programmeId: string; programmeName: string; universityName: string; requirementType: RequirementType; level: Level };
export type DocumentWithUsage = DocumentRow & { usage: DocUsage[] };

async function withUsage(supabase: Db, docs: DocumentRow[]): Promise<DocumentWithUsage[]> {
  if (!docs.length) return [];
  const links = must(await supabase.from("requirement_documents").select("requirement_id, document_id").in("document_id", docs.map((d) => d.id)), "document links") as { requirement_id: string; document_id: string }[];
  const reqs = links.length ? (must(await supabase.from("requirements").select("id, programme_id, requirement_type, level").in("id", links.map((l) => l.requirement_id)), "requirements") as { id: string; programme_id: string; requirement_type: RequirementType; level: Level }[]) : [];
  const progs = reqs.length ? (must(await supabase.from("programmes").select("id, programme_name, university_name").in("id", [...new Set(reqs.map((r) => r.programme_id))]), "programmes") as { id: string; programme_name: string; university_name: string }[]) : [];
  const reqById = new Map(reqs.map((r) => [r.id, r]));
  const progById = new Map(progs.map((p) => [p.id, p]));
  return docs.map((d) => ({
    ...d,
    usage: links.filter((l) => l.document_id === d.id).flatMap((l) => {
      const r = reqById.get(l.requirement_id);
      const p = r && progById.get(r.programme_id);
      return r && p ? [{ requirementId: r.id, programmeId: p.id, programmeName: p.programme_name, universityName: p.university_name, requirementType: r.requirement_type, level: r.level }] : [];
    }),
  }));
}

export async function listDocuments(): Promise<DocumentWithUsage[]> {
  const supabase = await db();
  const docs = must(await supabase.from("documents").select("*").order("title"), "documents") as DocumentRow[];
  return withUsage(supabase, docs);
}

export async function getDocument(id: string): Promise<DocumentWithUsage> {
  if (!idSchema.safeParse(id).success) notFound();
  const supabase = await db();
  const r = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (r.error) throw new Error("Could not load the document.");
  if (!r.data) notFound(); // missing, or not yours: RLS makes both look the same
  return (await withUsage(supabase, [r.data as DocumentRow]))[0];
}

/** All of the user's documents, for the link pickers. */
export async function listDocumentFacts(): Promise<DocFacts[]> {
  const supabase = await db();
  return must(await supabase.from("documents").select(FACT_COLUMNS).order("title"), "documents") as DocFacts[];
}
