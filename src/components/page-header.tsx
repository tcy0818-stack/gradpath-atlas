import type { ReactNode } from "react";

/** Page title block shared by the workspace pages: serif title, optional lede, and actions that wrap under it on small screens. */
export function PageHeader({ title, lede, actions, back }: { title: ReactNode; lede?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <header>
      {back && <p className="mb-2 text-sm">{back}</p>}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
          {lede && <div className="mt-2 max-w-[65ch] text-ink-2">{lede}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}

/** A titled run of content separated by a hairline, instead of wrapping every section in its own card. */
export function Section({ id, title, children, hint }: { id: string; title: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-6">
      <h2 id={id} className="text-2xl">{title}</h2>
      {hint && <p className="mt-1 max-w-[65ch] text-sm text-ink-2">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
