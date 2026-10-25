// Small authored stroke icons (24-unit grid, 1.75 stroke, currentColor). Always decorative: the label next to them carries the meaning.
const PATHS = {
  dashboard: "M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z",
  programmes: "M3 9l9-4 9 4-9 4zM7 11.5V16c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-4.5M21 9v5",
  compare: "M4 5h6v14H4zM14 5h6v14h-6zM7 9h0M17 9h0",
  documents: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  tasks: "M5 5h14v14H5zM8.5 12.5l2.5 2.5 4.5-5",
  deadlines: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  adviser: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  settings: "M4 7h9M17 7h3M4 17h3M11 17h9M13 5v4M7 15v4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  clock: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4.5l3 1.5",
  dash: "M6 12h12",
  circle: "M12 5a7 7 0 100 14 7 7 0 000-14z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM16.5 16.5L21 21",
  alert: "M12 4l9 16H3zM12 10v4M12 17v.1",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className, filled = false }: { name: IconName; size?: number; className?: string; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`shrink-0 ${className ?? ""}`}>
      <path d={PATHS[name]} strokeDasharray={name === "circle" ? "2 3" : undefined} />
    </svg>
  );
}
