import Link from "next/link";
import { Brand } from "@/components/brand";
import { primaryButton, standaloneLink } from "@/components/ui";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="sr-only z-10 rounded-lg bg-surface px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[68rem] flex-wrap items-center justify-between gap-x-4 px-4 py-1 sm:px-8">
          <Brand />
          <nav aria-label="Site" className="flex flex-wrap items-center gap-x-5">
            <Link href="/pricing" className={`${standaloneLink} !text-ink !no-underline hover:!underline`}>Pricing</Link>
            <Link href="/login" className={`${standaloneLink} !text-ink !no-underline hover:!underline`}>Sign in</Link>
            <Link href="/signup" className={`${primaryButton} !w-auto`}>Start planning</Link>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[68rem] flex-wrap items-center justify-between gap-x-6 px-4 py-3 text-sm text-ink-2 sm:px-8">
          <p>Coursework prototype. Demo data is fictional; prices are hypothetical.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5">
            <Link href="/pricing" className={standaloneLink}>Pricing</Link>
            <Link href="/privacy" className={standaloneLink}>Privacy and cookies</Link>
            <Link href="/login" className={standaloneLink}>Sign in</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
