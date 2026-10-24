import type { Metadata } from "next";
import { getProfile, requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser(); // pages verify the session themselves; layouts do not re-run on navigation
  const profile = await getProfile();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <section aria-labelledby="empty-heading" className="mt-6 rounded-lg border border-line bg-surface p-6">
        <h2 id="empty-heading" className="text-lg font-semibold">Nothing is tracked yet</h2>
        <p className="mt-2 max-w-[65ch] text-ink-2">
          Programmes, documents, tasks and deadlines will appear here as those areas become available. No figures are
          shown because nothing has been recorded.
        </p>
      </section>

      <section aria-labelledby="account-heading" className="mt-8">
        <h2 id="account-heading" className="text-lg font-semibold">Your account</h2>
        <dl className="mt-3 grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Email</dt>
          <dd className="min-w-0 break-words font-medium">{user.email ?? "Not available"}</dd>
          <dt className="text-muted">Display name</dt>
          <dd className="font-medium">{profile.displayName ?? "Not set"}</dd>
          <dt className="text-muted">Time zone</dt>
          <dd className="font-medium">{profile.timeZone}</dd>
        </dl>
      </section>
    </>
  );
}
