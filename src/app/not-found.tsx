import Link from "next/link";
import { Brand } from "@/components/brand";
import { primaryButton, quietButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <Brand />
      <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="text-ink-2">It may have been moved or deleted, or it may belong to another account. Check the address, or go back.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className={`${primaryButton} !w-auto`}>Go to your dashboard</Link>
        <Link href="/" className={quietButton}>Home</Link>
      </div>
    </main>
  );
}
