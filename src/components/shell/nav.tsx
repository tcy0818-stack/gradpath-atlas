"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Only built areas are links. Later areas are listed so the structure is visible, but are marked unavailable
// instead of leading to empty pages. Add a route here when its phase ships.
const ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Programmes", href: "/programmes" },
  { label: "Compare", href: "/compare" },
  { label: "Documents", href: null },
  { label: "Tasks", href: null },
  { label: "Deadlines", href: null },
  { label: "Adviser preview", href: null },
  { label: "Settings", href: null },
] as const;

const row = "flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-base";

/** Reads the URL, which is only known at request time on dynamic routes: render inside <Suspense fallback={<NavView />}>. */
export function Nav() {
  return <NavView pathname={usePathname()} />;
}

export function NavView({ pathname = "" }: { pathname?: string }) {
  return (
    <nav aria-label="Workspace">
      <ul className="space-y-0.5">
        {ITEMS.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                aria-current={pathname === item.href || pathname.startsWith(item.href + "/") ? "page" : undefined}
                className={`${row} font-medium text-rail-ink hover:bg-rail-hover aria-[current=page]:bg-rail-active aria-[current=page]:font-semibold`}
              >
                {item.label}
              </Link>
            ) : (
              <span className={`${row} text-rail-muted`}>
                <span>
                  {item.label}
                  <span className="sr-only">, not available yet</span>
                </span>
                <span aria-hidden="true" className="rounded-full border border-rail-line px-2 py-0.5 text-xs">Soon</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
