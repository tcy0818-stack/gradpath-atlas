import type { Metadata } from "next";
import { DeleteAccount } from "@/components/account/delete-account";
import { ProfileForm } from "@/components/account/profile-form";
import { ConfirmDelete } from "@/components/planning/confirm-delete";
import { LoadExamples } from "@/components/programmes/load-examples";
import { Alert, quietButton } from "@/components/ui";
import { resetExamplesAction } from "@/lib/account/actions";
import { getResetImpact } from "@/lib/account/queries";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { signOutAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Settings" };

const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  reset: { tone: "success", text: "Fictional examples removed. Everything you created yourself was kept, except what sat inside an example programme." },
  "reset-failed": { tone: "error", text: "The examples could not be removed, so nothing was changed. Try again." },
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const user = await requireUser();
  const sp = await searchParams;
  const [profile, impact] = await Promise.all([getProfile(), getResetImpact()]);
  const notice = NOTICES[(Array.isArray(sp.notice) ? sp.notice[0] : sp.notice) ?? ""];
  const zones = Intl.supportedValuesOf("timeZone");
  if (!zones.includes(profile.timeZone)) zones.unshift(profile.timeZone);
  if (!zones.includes("UTC")) zones.unshift("UTC");
  const hasExamples = impact.programmes + impact.documents + impact.tasks + impact.deadlines > 0;
  const section = "mt-8 border-t border-line pt-6";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      {notice && <div className="mt-4"><Alert tone={notice.tone}>{notice.text}</Alert></div>}

      <section aria-labelledby="profile-h" className="mt-6">
        <h2 id="profile-h" className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-ink-2">Signed in as <span className="font-medium">{user.email ?? "your account"}</span>. Your time zone decides what &ldquo;today&rdquo; is for deadlines and overdue tasks.</p>
        <div className="mt-4 max-w-md">
          <ProfileForm displayName={profile.displayName} timeZone={profile.timeZone} zones={zones} />
        </div>
      </section>

      <section aria-labelledby="export-h" className={section}>
        <h2 id="export-h" className="text-lg font-semibold">Export your data</h2>
        <p className="mt-1 max-w-[65ch] text-sm text-ink-2">Downloads contain only your own records: no passwords or sign-in details. Unknown values are written as words, never 0.</p>
        <ul className="mt-3 flex flex-wrap gap-3">
          <li><a className={quietButton} href="/api/export/programmes" download>Programme summary (CSV)</a></li>
          <li><a className={quietButton} href="/api/export/actions" download>Action plan (CSV)</a></li>
          <li><a className={quietButton} href="/api/export/workspace" download>Everything (JSON)</a></li>
        </ul>
      </section>

      <section aria-labelledby="examples-h" className={section}>
        <h2 id="examples-h" className="text-lg font-semibold">Fictional examples</h2>
        <p className="mt-1 max-w-[65ch] text-sm text-ink-2">
          {hasExamples
            ? `You currently have ${plural(impact.programmes, "example programme")}, ${plural(impact.documents, "example document")}, ${plural(impact.tasks, "task")} and ${plural(impact.deadlines, "deadline")} that belong to the fictional examples.`
            : "No fictional examples are loaded."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <LoadExamples />
          {hasExamples && (
            <ConfirmDelete id="reset-examples" title="Remove all fictional examples?" buttonLabel="Remove fictional examples…" keepLabel="Keep them" confirmLabel="Remove examples" action={resetExamplesAction}>
              <p>This removes {plural(impact.programmes, "example programme")} with their requirements, {plural(impact.documents, "example document")}, {plural(impact.tasks, "task")} and {plural(impact.deadlines, "deadline")}. Programmes, documents, tasks and deadlines you created yourself are kept.</p>
              {impact.yourTasksInExamples + impact.yourDeadlinesInExamples > 0 && (
                <p className="font-semibold text-danger">Also removed, because you added them inside an example programme: {plural(impact.yourTasksInExamples, "task")} and {plural(impact.yourDeadlinesInExamples, "deadline")}. Requirements you added inside an example go with it too.</p>
              )}
              {impact.yourLinksToExampleDocuments > 0 && <p>{plural(impact.yourLinksToExampleDocuments, "link")} from your own programmes to example documents will be removed; those programmes stay.</p>}
              {impact.yourTasksUnblocked > 0 && <p>{plural(impact.yourTasksUnblocked, "of your tasks")} waiting on an example task will stay and become unblocked.</p>}
              <p>Export first if you want a copy. This cannot be undone, but you can load the examples again.</p>
            </ConfirmDelete>
          )}
        </div>
      </section>

      <section aria-labelledby="session-h" className={section}>
        <h2 id="session-h" className="text-lg font-semibold">Session</h2>
        <form action={signOutAction} className="mt-3"><button type="submit" className={quietButton}>Sign out</button></form>
      </section>

      <section aria-labelledby="delete-h" className={section}>
        <h2 id="delete-h" className="text-lg font-semibold">Delete account</h2>
        <p className="mt-1 max-w-[65ch] text-sm text-ink-2">Permanently removes your sign-in and all of your records. Export first if you want a copy.</p>
        <div className="mt-3"><DeleteAccount /></div>
      </section>
    </>
  );
}
