import Link from "next/link";
import { Brand } from "@/components/brand";
import { primaryButton } from "@/components/ui";

const navLink = "inline-flex min-h-11 items-center font-medium text-ink underline-offset-4 hover:underline";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="sr-only z-30 rounded-lg bg-surface px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[70rem] flex-wrap items-center justify-between gap-x-4 px-4 py-1 sm:px-8">
          <Brand />
          <nav aria-label="Site" className="flex flex-wrap items-center gap-x-5">
            <Link href="/pricing" className={navLink}>Pricing</Link>
            <Link href="/login" className={navLink}>Sign in</Link>
            <Link href="/signup" className={`${primaryButton} !w-auto`}>Start planning</Link>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1">{children}</main>
      <footer className="on-dark bg-rail text-rail-ink">
        <div className="mx-auto grid w-full max-w-[70rem] gap-8 px-4 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Brand onDark />
            <p className="mt-2 max-w-[34ch] text-sm text-rail-muted">A planning workspace for master&apos;s applications. Coursework prototype: demo data is fictional and prices are hypothetical.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-col">
            <p className="mb-1 font-display text-lg">Explore</p>
            <Link href="/pricing" className="inline-flex min-h-11 items-center text-rail-muted underline-offset-4 hover:text-rail-ink hover:underline">Pricing</Link>
            <Link href="/privacy" className="inline-flex min-h-11 items-center text-rail-muted underline-offset-4 hover:text-rail-ink hover:underline">Privacy and cookies</Link>
          </nav>
          <nav aria-label="Account" className="flex flex-col">
            <p className="mb-1 font-display text-lg">Your account</p>
            <Link href="/login" className="inline-flex min-h-11 items-center text-rail-muted underline-offset-4 hover:text-rail-ink hover:underline">Sign in</Link>
            <Link href="/signup" className="inline-flex min-h-11 items-center text-rail-muted underline-offset-4 hover:text-rail-ink hover:underline">Create an account</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
