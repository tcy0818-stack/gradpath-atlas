"use client";

import { useFormStatus } from "react-dom";
import { quietButton } from "@/components/ui";
import { loadExamplesAction } from "@/lib/programmes/actions";

function Button() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${quietButton} disabled:cursor-wait disabled:opacity-70`}>
      {pending ? "Loading examples…" : "Load fictional examples"}
    </button>
  );
}

/** Adds the invented example programmes next to any you entered; safe to click twice (the seed function is idempotent). */
export function LoadExamples() {
  return (
    <form action={loadExamplesAction}>
      <Button />
    </form>
  );
}
