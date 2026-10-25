import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { LandingPreview, NextActionsExample } from "@/components/public/landing-preview";
import { lightButton, primaryButton, quietButton } from "@/components/ui";

export const metadata: Metadata = {
  title: { absolute: "GradPath Atlas — compare master's applications and see what to do next" },
  description: "A private planner for students applying to several master's programmes: compare requirements, reuse documents, track deadlines and see what is still missing.",
};

const WHAT: { icon: IconName; h: string; p: string }[] = [
  { icon: "compare", h: "Compare programmes side by side", p: "Tuition, deadlines and every requirement in one table. Unknown and not-applicable stay visible as words, never as zero or a blank, and currencies are never converted." },
  { icon: "documents", h: "Reuse documents across programmes", p: "Record each transcript, statement or reference once and link it wherever it is needed. A draft, expired or wrong-type document never counts as ready." },
  { icon: "deadlines", h: "See every deadline and dependency", p: "Deadlines group into overdue, due soon and later. A task that needs another task first stays blocked until that one is done." },
  { icon: "tasks", h: "Know what to do next", p: "The dashboard lists what you can act on now, in order, and shows what is still missing for each programme." },
];

const SCATTERED = ["A spreadsheet of requirements", "An email folder of confirmations", "A notes app of half-finished to-dos"];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden" aria-labelledby="hero-h">
        <div aria-hidden="true" className="graticule absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-[70rem] items-center gap-10 px-4 pb-10 pt-10 sm:px-8 sm:pb-14 sm:pt-20 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
          <div>
          <h1 id="hero-h" className="max-w-[18ch] text-balance text-4xl leading-[1.05] sm:text-6xl">
            Compare your master&apos;s applications and see what to do next.
          </h1>
          <p className="mt-5 max-w-[56ch] text-lg text-ink-2 sm:text-xl">
            One private workspace for the programmes you are considering: what each one requires, which documents you can reuse, what is still missing and which deadline comes first.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signup" className={`${primaryButton} !w-auto`}>Start planning, free</Link>
            <Link href="/login" className={quietButton}>Sign in</Link>
          </div>
          <p className="mt-3 text-sm text-muted">Coursework prototype. Load invented example programmes in one click to try it.</p>
          </div>
          <NextActionsExample />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[70rem] px-4 pb-14 sm:px-8 sm:pb-20" aria-label="Preview">
        <LandingPreview />
      </section>

      <section className="border-y border-line bg-surface" aria-labelledby="problem-h">
        <div className="mx-auto grid w-full max-w-[70rem] gap-8 px-4 py-12 sm:px-8 sm:py-16 md:grid-cols-[1.1fr_1fr] md:gap-14">
          <div>
            <h2 id="problem-h" className="text-3xl leading-tight sm:text-4xl">Applications live in too many places</h2>
            <p className="mt-4 max-w-[52ch] text-ink-2">
              Applying to three or more programmes, often in different countries, usually means a spreadsheet, an email folder and a notes app. Each university asks for slightly different things, deadlines differ, and it is hard to tell which requirement is still unmet. A spreadsheet can store the rows but cannot tell you what is missing.
            </p>
          </div>
          <div className="self-center">
            <p className="text-sm font-semibold text-muted">What students juggle today</p>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {SCATTERED.map((s) => <li key={s} className="py-3 text-ink-2">{s}</li>)}
            </ul>
            <p className="mt-4 flex items-center gap-2 font-display text-xl font-semibold text-accent-strong">
              <Icon name="arrow" size={22} /> One plan that shows what is missing
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[70rem] px-4 py-12 sm:px-8 sm:py-16" aria-labelledby="what-h">
        <div className="grid gap-8 md:grid-cols-[1fr_1.7fr] md:gap-14">
          <h2 id="what-h" className="text-3xl leading-tight sm:text-4xl md:sticky md:top-24 md:self-start">What it does</h2>
          <ul className="divide-y divide-line border-y border-line">
            {WHAT.map((w) => (
              <li key={w.h} className="flex gap-4 py-5">
                <span aria-hidden="true" className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent-strong"><Icon name={w.icon} size={22} /></span>
                <div>
                  <h3 className="font-display text-xl font-semibold">{w.h}</h3>
                  <p className="mt-1 max-w-[55ch] text-ink-2">{w.p}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="on-dark bg-rail text-rail-ink" aria-labelledby="limits-h">
        <div className="mx-auto grid w-full max-w-[70rem] gap-8 px-4 py-12 sm:px-8 sm:py-16 md:grid-cols-[1.2fr_1fr] md:gap-14">
          <div>
            <h2 id="limits-h" className="text-3xl leading-tight sm:text-4xl">What it does not do</h2>
            <ul className="mt-4 max-w-[60ch] list-disc space-y-1.5 pl-5 text-rail-ink">
              <li>It does not predict admission or rank programmes for you.</li>
              <li>It does not submit applications or contact universities.</li>
              <li>It does not store your files: documents are records of status and expiry only.</li>
              <li>It takes no payments. The <Link href="/pricing" className="font-medium underline underline-offset-4 hover:text-white">pricing page</Link> is a labelled simulation.</li>
            </ul>
          </div>
          <div className="self-center">
            <p className="text-rail-ink">
              Your data is yours: export it any time and delete your account from Settings. See <Link href="/privacy" className="font-medium underline underline-offset-4 hover:text-white">what is stored and why</Link>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/signup" className={lightButton}>Start planning, free</Link>
              <Link href="/login" className="inline-flex min-h-11 items-center rounded-lg border border-rail-line px-3.5 py-2 text-sm font-semibold hover:bg-rail-hover">Sign in</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
