import { Suspense } from "react";
import { TimeZoneSync } from "@/components/shell/time-zone-sync";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { quietButton } from "@/components/ui";
import { signOutAction } from "@/lib/auth/actions";
import { getProfile, requireUser } from "@/lib/auth/dal";

// The session is read inside a Suspense boundary (Cache Components), never at the top of the layout.
async function AccountBar() {
  const user = await requireUser();
  const profile = await getProfile();
  return (
    <div className="flex min-w-0 items-center justify-end gap-3">
      <p className="min-w-0 truncate text-sm text-ink-2" title={user.email ?? undefined}>
        <span className="sr-only">Signed in as </span>
        {profile.displayName ?? user.email}
      </p>
      <form action={signOutAction}>
        <button type="submit" className={quietButton}>Sign out</button>
      </form>
      <TimeZoneSync current={profile.timeZone} />
    </div>
  );
}

export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return (
    <WorkspaceShell
      account={
        <Suspense fallback={<span className="text-sm text-muted">Loading account…</span>}>
          <AccountBar />
        </Suspense>
      }
    >
      {children}
    </WorkspaceShell>
  );
}
