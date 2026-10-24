import { Suspense, type ReactNode } from "react";
import { Brand } from "@/components/brand";
import { MobileMenu } from "./mobile-menu";
import { Nav, NavView } from "./nav";

/** Presentational frame: navy rail (top header with a Menu on small screens), account bar, main column. */
export function WorkspaceShell({ account, children }: { account: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-10 rounded-lg bg-surface px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="on-dark bg-rail px-3 py-1 lg:hidden">
        <div className="flex items-center justify-between">
          <Brand onDark href="/dashboard" />
          <Suspense fallback={<span className="flex min-h-11 items-center px-3 text-sm font-semibold text-rail-ink">Menu</span>}>
            <MobileMenu />
          </Suspense>
        </div>
      </header>

      <aside className="on-dark hidden bg-rail px-3 py-4 lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto">
        <div className="mb-6 px-1">
          <Brand onDark href="/dashboard" />
        </div>
        <Suspense fallback={<NavView />}>
          <Nav />
        </Suspense>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <div className="flex min-h-12 items-center justify-end border-b border-line bg-surface px-4 py-1 sm:px-8 lg:min-h-14">
          {account}
        </div>
        <main id="main" tabIndex={-1} className="flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-[68rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
