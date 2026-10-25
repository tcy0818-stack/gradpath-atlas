import type { Metadata } from "next";
import Link from "next/link";
import { standaloneLink } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy and cookies", description: "What GradPath Atlas stores, why, who processes it, and how to export or delete it." };

const h2 = "mt-8 text-xl font-semibold tracking-tight";
const p = "mt-2 text-ink-2";
const ul = "mt-2 list-disc space-y-1 pl-5 text-ink-2";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-[44rem] px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy and cookies</h1>
      <p className="mt-3 text-ink-2">
        GradPath Atlas is a <strong>coursework prototype</strong>, not a commercial service. This page is a plain-English statement of what the app actually does. It is not legal advice, and it makes no claim of certification or compliance with any privacy law or standard; it has not been reviewed by a lawyer.
      </p>

      <h2 className={h2}>What is stored</h2>
      <ul className={ul}>
        <li>Your email address and a password. The app passes the password straight to the sign-in service and never stores it; the service keeps only a hash.</li>
        <li>An optional display name and your time zone.</li>
        <li>What you enter: programmes, requirements, notes, document <em>records</em>, tasks and deadlines.</li>
        <li>A simulated plan label and the time you chose it, if you try the pricing page.</li>
      </ul>
      <p className={p}>
        <strong>Documents are metadata only.</strong> The app has no file upload: it records a title, type, status and expiry date, never the file. Please do not type sensitive personal data (identity numbers, health or financial details) into notes or titles.
      </p>

      <h2 className={h2}>Why</h2>
      <p className={p}>Only to run the planner for you: to sign you in, calculate readiness and deadlines, and show them back. There is no advertising, profiling, analytics or sale of data.</p>

      <h2 className={h2}>Who processes it</h2>
      <ul className={ul}>
        <li><strong>Supabase</strong> stores the database, handles sign-in and sends the confirmation and password-reset emails. Your data is only readable by your own account: every table is restricted to its owner.</li>
        <li><strong>Vercel</strong> hosts the web app.</li>
      </ul>
      <p className={p}>No other third party receives your data. Fonts are served from this site itself (heading font) and your own device (body text), so your browser never contacts a font provider. Supabase&apos;s own backup, log and location practices are outside this app and have not been reviewed here.</p>

      <h2 className={h2}>Your data, your control</h2>
      <ul className={ul}>
        <li><strong>Export:</strong> Settings offers CSV and JSON downloads of your records.</li>
        <li><strong>Delete:</strong> Settings → Delete account permanently removes your sign-in and all of your records. You can also remove only the fictional examples.</li>
        <li><strong>Retention:</strong> your data is kept until you delete it. This prototype does not delete inactive accounts.</li>
        <li><strong>Correct:</strong> everything you entered can be edited in the app.</li>
      </ul>

      <h2 className={h2}>Cookies</h2>
      <p className={p}>
        The app sets only the cookies the sign-in service needs to keep you signed in (their names begin with <code className="rounded bg-bg px-1">sb-</code>). Without them you could not stay signed in. There are no analytics, advertising or tracking cookies, and no third-party scripts.
      </p>
      <p className={p}>
        Because only strictly necessary cookies are used, there is nothing optional to consent to, so no cookie banner is shown. If a non-essential cookie or tracker were ever added, a working consent choice would be added first.
      </p>

      <h2 className={h2}>Limits of this prototype</h2>
      <ul className={ul}>
        <li>Demo programmes, universities and documents are invented. Dates and tuition you enter are not checked against any university.</li>
        <li>Prices are hypothetical and no payment is ever taken.</li>
        <li>No contact address or support mailbox exists for this prototype.</li>
      </ul>

      <p className="mt-8 flex flex-wrap gap-x-6">
        <Link href="/signup" className={standaloneLink}>Create an account</Link>
        <Link href="/" className={standaloneLink}>Back to home</Link>
      </p>
    </div>
  );
}
