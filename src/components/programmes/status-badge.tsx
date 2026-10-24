import { STATUS_LABELS, type Status } from "@/lib/programmes/types";

/** Status as text on a bordered pill (never colour alone). Submitted and decided applications read as settled. */
export function StatusBadge({ status }: { status: Status }) {
  const settled = status === "submitted" || status === "decision_received" || status === "withdrawn";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${settled ? "border-line bg-bg text-ink-2" : "border-accent bg-accent-tint text-accent-strong"}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ExampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-control px-2 py-0.5 text-xs font-medium text-ink-2" title="Invented for demonstration; not a real university or programme">
      Fictional example
    </span>
  );
}
