import { getUser } from "@/lib/auth/dal";
import { actionsCsv, programmesCsv, workspaceJson } from "@/lib/export";
import { loadWorkspace } from "@/lib/workspace";

// Downloads of the signed-in student's own records (EXP-01, EXP-02). The session is checked here as well as in the proxy;
// the data is read with the user's own session, so Row Level Security means no other account's rows can appear.
const KINDS = {
  programmes: { type: "text/csv; charset=utf-8", ext: "csv" },
  actions: { type: "text/csv; charset=utf-8", ext: "csv" },
  workspace: { type: "application/json; charset=utf-8", ext: "json" },
} as const;

export async function GET(_req: Request, ctx: RouteContext<"/api/export/[kind]">) {
  const { kind } = await ctx.params;
  if (!(kind in KINDS)) return new Response("Not found", { status: 404 });
  if (!(await getUser())) return new Response("Sign in to download your data.", { status: 401 });

  const { workspace, documents } = await loadWorkspace();
  const k = kind as keyof typeof KINDS;
  const body = k === "programmes" ? programmesCsv(workspace) : k === "actions" ? actionsCsv(workspace) : workspaceJson(workspace, documents);
  return new Response(body, {
    headers: {
      "Content-Type": KINDS[k].type,
      "Content-Disposition": `attachment; filename="gradpath-${k}-${workspace.today}.${KINDS[k].ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
