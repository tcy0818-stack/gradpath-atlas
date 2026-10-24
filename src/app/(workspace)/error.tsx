"use client";

import { quietButton } from "@/components/ui";

// Recoverable failure (for example a failed read): say so plainly and offer a retry. Details stay in the server log.
export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger bg-danger-tint p-6 text-danger">
      <h1 className="text-lg font-semibold">This page could not be loaded</h1>
      <p className="mt-2 text-ink-2">Your data is unchanged. Check your connection and try again.</p>
      <button type="button" onClick={reset} className={`${quietButton} mt-4`}>Try again</button>
    </div>
  );
}
