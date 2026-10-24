import { formatIsoDate, type DueClass } from "@/lib/dates";

const pill = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold";

/** A calendar date with its urgency in words (never colour alone). `muted` hides the label for finished items. */
export function DueLabel({ date, due, muted = false }: { date: string | null; due: DueClass; muted?: boolean }) {
  if (!date) return <span className="text-muted">No date</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{formatIsoDate(date)}</span>
      {!muted && due === "overdue" && <span className={`${pill} border-danger bg-danger-tint text-danger`}>Overdue</span>}
      {!muted && due === "today" && <span className={`${pill} border-accent bg-accent-tint text-accent-strong`}>Due today</span>}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "danger" | "ok" | "accent" }) {
  const tones = {
    neutral: "border-line bg-bg text-ink-2",
    danger: "border-danger bg-danger-tint text-danger",
    ok: "border-ok bg-ok-tint text-ok",
    accent: "border-accent bg-accent-tint text-accent-strong",
  } as const;
  return <span className={`${pill} ${tones[tone]}`}>{children}</span>;
}
