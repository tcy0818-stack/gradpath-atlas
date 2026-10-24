import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[5fr_6fr]">
      <a
        href="#main"
        className="sr-only z-10 rounded-lg bg-surface px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <aside className="on-dark hidden bg-rail px-12 py-10 text-rail-ink lg:flex lg:flex-col lg:justify-between">
        <Brand onDark />
        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            Compare your master&apos;s applications and see what to do next in one workspace.
          </p>
          <p className="mt-4 text-base text-rail-muted">
            A private planner for final-year students applying to several programmes. No advertising or analytics
            tracking; cookies only keep you signed in.
          </p>
        </div>
        <p className="text-sm text-rail-muted">Coursework prototype. Demo data is fictional.</p>
      </aside>
      <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:min-h-0">
        <header className="lg:hidden">
          <Brand />
        </header>
        <main id="main" className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center py-8">
          {children}
        </main>
        <p className="text-sm text-muted lg:hidden">Coursework prototype. Demo data is fictional.</p>
      </div>
    </div>
  );
}
