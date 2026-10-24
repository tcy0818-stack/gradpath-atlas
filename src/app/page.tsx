import Link from "next/link";
import { Brand } from "@/components/brand";
import { primaryButton, quietButton } from "@/components/ui";

// Placeholder only; the real landing page is built in Phase 7 (PUB-01).
export default function Home() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-5 px-4 py-16">
      <Brand />
      <h1 className="text-3xl font-semibold tracking-tight">
        Compare your master&apos;s applications and see what to do next in one workspace.
      </h1>
      <p className="text-ink-2">Planning tools are being added step by step. You can create an account now.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/signup" className={`${primaryButton} !w-auto`}>Create an account</Link>
        <Link href="/login" className={quietButton}>Sign in</Link>
      </div>
    </main>
  );
}
