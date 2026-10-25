import Link from "next/link";

/** Wordmark with an authored mark: three staggered bars, like rows of a comparison table. */
export function Brand({ onDark = false, href = "/" }: { onDark?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2.5 rounded-md font-semibold tracking-tight">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill={onDark ? "#17375a" : "#0f2a43"} />
        <rect x="6" y="8" width="16" height="3" rx="1.5" fill="#5eead4" />
        <rect x="6" y="13" width="11" height="3" rx="1.5" fill="#e2e8f0" />
        <rect x="6" y="18" width="14" height="3" rx="1.5" fill="#e2e8f0" />
      </svg>
      <span className={`font-display text-lg ${onDark ? "text-rail-ink" : "text-ink"}`}>GradPath Atlas</span>
    </Link>
  );
}
