"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Every area is built as of Phase 6. Add a route here when a new one ships.
const ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Programmes", href: "/programmes" },
  { label: "Compare", href: "/compare" },
  { label: "Documents", href: "/documents" },
  { label: "Tasks", href: "/tasks" },
  { label: "Deadlines", href: "/deadlines" },
  { label: "Adviser preview", href: "/adviser" },
  { label: "Settings", href: "/settings" },
] as const;

const row = "flex min-h-11 items-center rounded-lg px-3 text-base";

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
            <Link
              href={item.href}
              aria-current={pathname === item.href || pathname.startsWith(item.href + "/") ? "page" : undefined}
              className={`${row} font-medium text-rail-ink hover:bg-rail-hover aria-[current=page]:bg-rail-active aria-[current=page]:font-semibold`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
