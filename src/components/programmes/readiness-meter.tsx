import type { Readiness } from "@/lib/readiness";

/**
 * Preparation at a glance: one segment per required requirement (up to 10), filled when satisfied, plus the same
 * words the rest of the app uses. The label is the accessible value; the segments are decoration.
 */
export function ReadinessMeter({ readiness, size = "sm" }: { readiness: Pick<Readiness, "required" | "satisfied" | "label">; size?: "sm" | "lg" }) {
  const { required, satisfied } = readiness;
  const n = Math.min(required, 10);
  const filled = required === 0 ? 0 : Math.round((satisfied / required) * n);
  return (
    <span className="inline-flex flex-col gap-1">
      {n > 0 && (
        <span aria-hidden="true" className="flex gap-0.5">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className={`${size === "lg" ? "h-2 w-6" : "h-1.5 w-4"} rounded-sm ${i < filled ? "bg-accent" : "bg-line"}`} />
          ))}
        </span>
      )}
      <span className={size === "lg" ? "text-base font-semibold" : "text-sm"}>{readiness.label}</span>
    </span>
  );
}
