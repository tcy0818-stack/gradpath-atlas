"use client";

import { quietButton } from "@/components/ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={`${quietButton} print:hidden`}>
      Print this summary
    </button>
  );
}
