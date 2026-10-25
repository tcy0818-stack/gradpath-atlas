import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LicenceEnquiry, PlanDialog } from "@/components/public/plan-dialogs";
import { Icon } from "@/components/icons";
import { Alert, quietButton, standaloneLink } from "@/components/ui";
import { getProfile, getUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Pricing", description: "Hypothetical prototype pricing for GradPath Atlas. Nothing is charged." };

const tier = "flex flex-col rounded-xl border border-line bg-surface p-6 shadow-panel";

type Row = { icon: "check" | "clock" | "circle" | "dash"; text: string };
const ICON_TONE = { check: "text-ok", clock: "text-signal", circle: "text-signal", dash: "text-muted" } as const;

/** One group of plan features. The icon repeats what the heading says; the heading is the accessible meaning. */
function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <>
      <h3 className="mt-5 text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-ink-2">
        {rows.map((r) => (
          <li key={r.text} className="flex gap-2.5">
            <Icon name={r.icon} size={18} className={`mt-0.5 ${ICON_TONE[r.icon]}`} />
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** What the visitor can do for one tier: sign in, or change their simulated plan. Reads the session, so it streams. */
async function PlanAction({ plan }: { plan: "free" | "season_pass" }) {
  const user = await getUser();
  if (!user) {
    return plan === "free"
      ? <Link href="/signup" className={quietButton}>Start free</Link>
      : <Link href="/login?next=/pricing" className={quietButton}>Sign in to try the simulated upgrade</Link>;
  }
  const { demoPlan } = await getProfile();
  if (demoPlan === plan) return <p className="text-sm font-semibold text-ok" role="status">Your current simulated plan</p>;
  return plan === "season_pass" ? (
    <PlanDialog plan="season_pass" buttonLabel="Simulate the season pass" title="Simulate the season pass" primary>
      <p>This stores only the label &ldquo;Season pass&rdquo; on your profile. No card details are asked for, nothing is charged, and no feature changes: every feature stays available to everyone while this is a prototype.</p>
    </PlanDialog>
  ) : (
    <PlanDialog plan="free" buttonLabel="Switch back to Free" title="Switch back to Free (simulation)">
      <p>This only changes the label stored on your profile. Your records are not touched.</p>
    </PlanDialog>
  );
}

const Action = ({ plan }: { plan: "free" | "season_pass" }) => (
  <Suspense fallback={<span className="text-sm text-muted">Checking your session…</span>}>
    <PlanAction plan={plan} />
  </Suspense>
);

export default function PricingPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden="true" className="graticule absolute inset-0" />
        <div className="relative mx-auto w-full max-w-[70rem] px-4 py-10 sm:px-8 sm:py-14">
          <h1 className="text-4xl leading-tight sm:text-5xl">Pricing</h1>
          <p className="mt-3 max-w-[60ch] text-lg text-ink-2">
            While this is a prototype <strong>every feature is available to every account</strong>, so it can be tested. The limits listed under each plan describe a possible future product and are not enforced.
          </p>
          <div className="mt-5 max-w-[65ch]">
            <Alert tone="info">
              <strong>Hypothetical prototype pricing.</strong> Nothing is charged: there are no card fields and no payment processor, and choosing a plan only stores a label. All prices are in US dollars (US$) and are placeholders to be tested, not evidence of what students would pay.
            </Alert>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[70rem] px-4 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-5 lg:grid-cols-3">
          <article aria-labelledby="t-free" className={tier}>
            <h2 id="t-free" className="text-2xl">Free</h2>
            <p className="mt-2 font-display text-4xl font-semibold">US$0 <span className="font-sans text-base font-normal text-ink-2">no time limit</span></p>
            <Group title="Available now" rows={[
              { icon: "check", text: "Programmes, requirements and side-by-side comparison" },
              { icon: "check", text: "Document records, readiness, tasks and deadlines" },
              { icon: "check", text: "Dashboard and the read-only adviser-review preview of your own workspace" },
              { icon: "check", text: "CSV and JSON export, print summary, account deletion" },
            ]} />
            <Group title="Possible future limit (not enforced)" rows={[{ icon: "clock", text: "Up to 3 programmes, comparing up to 3" }]} />
            <div className="mt-auto pt-6"><Action plan="free" /></div>
          </article>

          <article aria-labelledby="t-pass" className={tier}>
            <h2 id="t-pass" className="text-2xl">Season pass</h2>
            <p className="mt-2 font-display text-4xl font-semibold">US$19 <span className="font-sans text-base font-normal text-ink-2">one-off, not a subscription</span></p>
            <p className="mt-2 text-sm text-ink-2">Would cover one application season: 9 months from activation (a September to May cycle is assumed).</p>
            <Group title="Available now" rows={[{ icon: "check", text: "Everything in Free. The prototype gives all accounts the same features." }]} />
            <Group title="Possible future difference (not enforced)" rows={[{ icon: "clock", text: "Unlimited programmes, comparing up to 6" }]} />
            <div className="mt-auto pt-6"><Action plan="season_pass" /></div>
          </article>

          <article aria-labelledby="t-licence" className={tier}>
            <h2 id="t-licence" className="text-2xl">Adviser / university licence</h2>
            <p className="mt-2 font-display text-4xl font-semibold">Enquiry only</p>
            <p className="mt-2 text-sm text-ink-2">Planning figure, not an offer: about US$400 per season for up to 50 student seats (roughly US$8 a seat). One season per licence.</p>
            <Group title="Available now" rows={[{ icon: "dash", text: "Nothing. The licence is not for sale and has no accounts, seats or admin tools." }]} />
            <Group title="Planned, not built" rows={[{ icon: "circle", text: "Cohort support, adviser invitations and shared access to a student's workspace" }]} />
            <p className="mt-4 text-sm text-ink-2">The adviser-review preview inside the workspace is different: it is a read-only view of your own data for any account, not shared access.</p>
            <div className="mt-auto pt-6"><LicenceEnquiry /></div>
          </article>
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-2">
          <span className="inline-flex items-center gap-1.5"><Icon name="check" size={16} className="text-ok" /> Available now</span>
          <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={16} className="text-signal" /> Possible future limit</span>
          <span className="inline-flex items-center gap-1.5"><Icon name="circle" size={16} className="text-signal" /> Planned, not built</span>
          <span className="inline-flex items-center gap-1.5"><Icon name="dash" size={16} className="text-muted" /> Not offered</span>
        </p>

        <p className="mt-6 max-w-[65ch] text-sm text-ink-2">
          Questions about what is stored when you choose a plan: only the plan label and the time you chose it, on your own profile. See <Link href="/privacy" className={standaloneLink}>privacy and cookies</Link>.
        </p>
      </div>
    </div>
  );
}
