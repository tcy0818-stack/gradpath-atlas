import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Brand } from "@/components/brand";
import { MobileMenu } from "./mobile-menu";
import { Nav, NavView } from "./nav";

/** Presentational frame: navy rail with grouped navigation (a top header with a Menu on small screens), sticky account bar, main column. */
export function WorkspaceShell({ account, children }: { account: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] print:block">
      <a
        href="#main"
        className="sr-only z-30 rounded-lg bg-surface px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="on-dark relative z-30 bg-rail px-3 py-1 lg:hidden print:hidden">
        <div className="flex items-center justify-between">
          <Brand onDark href="/dashboard" />
          <Suspense fallback={<span className="flex min-h-11 items-center px-3 text-sm font-semibold text-rail-ink">Menu</span>}>
            <MobileMenu />
          </Suspense>
        </div>
      </header>

      <aside className="on-dark hidden bg-rail px-3 py-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto print:hidden">
        <div className="mb-7 px-1">
          <Brand onDark href="/dashboard" />
        </div>
        <Suspense fallback={<NavView />}>
          <Nav />
        </Suspense>
        <div className="mt-auto border-t border-rail-line px-3 pt-4 text-sm text-rail-muted">
          <p>Coursework prototype. Demo data is fictional.</p>
          <Link href="/privacy" className="mt-1 inline-flex min-h-11 items-center underline underline-offset-4 hover:text-rail-ink">Privacy and cookies</Link>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <div className="sticky top-0 z-20 flex min-h-12 items-center justify-end border-b border-line bg-surface/95 px-4 py-1 backdrop-blur-sm sm:px-8 lg:min-h-14 print:hidden">
          {account}
        </div>
        <main id="main" tabIndex={-1} className="flex-1 px-4 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto w-full max-w-[70rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
