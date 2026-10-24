import Link from "next/link";
import { textLink } from "@/components/ui";

export default function ProgrammeNotFound() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Programme not found</h1>
      <p className="mt-2 text-ink-2">It may have been deleted, or it is not in your account.</p>
      <p className="mt-4"><Link href="/programmes" className={textLink}>Back to programmes</Link></p>
    </>
  );
}
