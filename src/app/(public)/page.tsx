import type { Metadata } from "next";
import Link from "next/link";
import { LandingPreview } from "@/components/public/landing-preview";
import { primaryButton, quietButton, standaloneLink } from "@/components/ui";

export const metadata: Metadata = {
  title: { absolute: "GradPath Atlas — compare master's applications and see what to do next" },
  description: "A private planner for students applying to several master's programmes: compare requirements, reuse documents, track deadlines and see what is still missing.",
};

const WHAT = [
  { h: "Compare programmes side by side", p: "Tuition, deadlines and every requirement in one table. Unknown and not-applicable stay visible as words, never as zero or a blank, and currencies are never converted." },
  { h: "Reuse documents across programmes", p: "Record each transcript, statement or reference once and link it wherever it is needed. A draft, expired or wrong-type document never counts as ready." },
  { h: "See every deadline and dependency", p: "Deadlines group into overdue, due soon and later. A task that needs another task first stays blocked until that one is done." },
  { h: "Know what to do next", p: "The dashboard lists what you can act on now, in order, and shows what is still missing for each programme." },
] as const;

export default function Home() {
  return (
    <>
      <section className="mx-auto w-full max-w-[68rem] px-4 pb-10 pt-10 sm:px-8 sm:pt-16" aria-labelledby="hero-h">
        <h1 id="hero-h" className="max-w-[24ch] text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Compare your master&apos;s applications and see what to do next.
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg text-ink-2">
          One private workspace for the programmes you are considering: what each one requires, which documents you can reuse, what is still missing and which deadline comes first.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup" className={`${primaryButton} !w-auto`}>Start planning, free</Link>
          <Link href="/login" className={quietButton}>Sign in</Link>
        </div>
        <p className="mt-3 text-sm text-muted">Coursework prototype. Load invented example programmes in one click to try it.</p>
      </section>

      <section className="mx-auto w-full max-w-[68rem] px-4 pb-12 sm:px-8" aria-label="Preview">
        <LandingPreview />
      </section>

      <section className="border-y border-line bg-surface" aria-labelledby="problem-h">
        <div className="mx-auto w-full max-w-[68rem] px-4 py-10 sm:px-8">
          <h2 id="problem-h" className="text-2xl font-semibold tracking-tight">Applications live in too many places</h2>
          <p className="mt-3 max-w-[65ch] text-ink-2">
            Applying to three or more programmes, often in different countries, usually means a spreadsheet, an email folder and a notes app. Each university asks for slightly different things, deadlines differ, and it is hard to tell which requirement is still unmet. A spreadsheet can store the rows but cannot tell you what is missing.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[68rem] px-4 py-10 sm:px-8" aria-labelledby="what-h">
        <h2 id="what-h" className="text-2xl font-semibold tracking-tight">What it does</h2>
        <dl className="mt-5 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {WHAT.map((w) => (
            <div key={w.h}>
              <dt className="font-semibold">{w.h}</dt>
              <dd className="mt-1 max-w-[55ch] text-ink-2">{w.p}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-line bg-surface" aria-labelledby="limits-h">
        <div className="mx-auto w-full max-w-[68rem] px-4 py-10 sm:px-8">
          <h2 id="limits-h" className="text-2xl font-semibold tracking-tight">What it does not do</h2>
          <ul className="mt-3 max-w-[65ch] list-disc space-y-1 pl-5 text-ink-2">
            <li>It does not predict admission or rank programmes for you.</li>
            <li>It does not submit applications or contact universities.</li>
            <li>It does not store your files: documents are records of status and expiry only.</li>
            <li>It takes no payments. The <Link href="/pricing" className={standaloneLink}>pricing page</Link> is a labelled simulation.</li>
          </ul>
          <p className="mt-4 max-w-[65ch] text-ink-2">
            Your data is yours: export it any time and delete your account from Settings. See <Link href="/privacy" className={standaloneLink}>what is stored and why</Link>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className={`${primaryButton} !w-auto`}>Start planning, free</Link>
            <Link href="/login" className={quietButton}>Sign in</Link>
          </div>
        </div>
      </section>
    </>
  );
}
