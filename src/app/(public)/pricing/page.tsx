import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LicenceEnquiry, PlanDialog } from "@/components/public/plan-dialogs";
import { Alert, quietButton, standaloneLink } from "@/components/ui";
import { getProfile, getUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Pricing", description: "Hypothetical prototype pricing for GradPath Atlas. Nothing is charged." };

const tier = "flex flex-col rounded-lg border border-line bg-surface p-5";
const list = "mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2";

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
    <div className="mx-auto w-full max-w-[68rem] px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <div className="mt-4 max-w-[65ch]">
        <Alert tone="info">
          <strong>Hypothetical prototype pricing.</strong> Nothing is charged: there are no card fields and no payment processor, and choosing a plan only stores a label. All prices are in US dollars (US$) and are placeholders to be tested, not evidence of what students would pay.
        </Alert>
      </div>
      <p className="mt-4 max-w-[65ch] text-ink-2">
        While this is a prototype <strong>every feature is available to every account</strong>, so it can be tested. The limits listed under each plan describe a possible future product and are not enforced.
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article aria-labelledby="t-free" className={tier}>
          <h2 id="t-free" className="text-xl font-semibold">Free</h2>
          <p className="mt-1 text-2xl font-semibold">US$0 <span className="text-base font-normal text-ink-2">no time limit</span></p>
          <h3 className="mt-4 text-sm font-semibold">Available now</h3>
          <ul className={list}>
            <li>Programmes, requirements and side-by-side comparison</li>
            <li>Document records, readiness, tasks and deadlines</li>
            <li>Dashboard and the read-only adviser-review preview of your own workspace</li>
            <li>CSV and JSON export, print summary, account deletion</li>
          </ul>
          <h3 className="mt-4 text-sm font-semibold">Possible future limit (not enforced)</h3>
          <ul className={list}><li>Up to 3 programmes, comparing up to 3</li></ul>
          <div className="mt-auto pt-5"><Action plan="free" /></div>
        </article>

        <article aria-labelledby="t-pass" className={tier}>
          <h2 id="t-pass" className="text-xl font-semibold">Season pass</h2>
          <p className="mt-1 text-2xl font-semibold">US$19 <span className="text-base font-normal text-ink-2">one-off, not a subscription</span></p>
          <p className="mt-1 text-sm text-ink-2">Would cover one application season: 9 months from activation (a September to May cycle is assumed).</p>
          <h3 className="mt-4 text-sm font-semibold">Available now</h3>
          <ul className={list}><li>Everything in Free. The prototype gives all accounts the same features.</li></ul>
          <h3 className="mt-4 text-sm font-semibold">Possible future difference (not enforced)</h3>
          <ul className={list}><li>Unlimited programmes, comparing up to 6</li></ul>
          <div className="mt-auto pt-5"><Action plan="season_pass" /></div>
        </article>

        <article aria-labelledby="t-licence" className={tier}>
          <h2 id="t-licence" className="text-xl font-semibold">Adviser / university licence</h2>
          <p className="mt-1 text-2xl font-semibold">Enquiry only</p>
          <p className="mt-1 text-sm text-ink-2">Planning figure, not an offer: about US$400 per season for up to 50 student seats (roughly US$8 a seat). One season per licence.</p>
          <h3 className="mt-4 text-sm font-semibold">Available now</h3>
          <ul className={list}><li>Nothing. The licence is not for sale and has no accounts, seats or admin tools.</li></ul>
          <h3 className="mt-4 text-sm font-semibold">Planned, not built</h3>
          <ul className={list}><li>Cohort support, adviser invitations and shared access to a student&apos;s workspace</li></ul>
          <p className="mt-3 text-sm text-ink-2">The adviser-review preview inside the workspace is different: it is a read-only view of your own data for any account, not shared access.</p>
          <div className="mt-auto pt-5"><LicenceEnquiry /></div>
        </article>
      </div>

      <p className="mt-8 max-w-[65ch] text-sm text-ink-2">
        Questions about what is stored when you choose a plan: only the plan label and the time you chose it, on your own profile. See <Link href="/privacy" className={standaloneLink}>privacy and cookies</Link>.
      </p>
    </div>
  );
}
