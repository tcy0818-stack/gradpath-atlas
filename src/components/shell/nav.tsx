"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

// Every area is built. Add a route here when a new one ships. Grouped by what the student is doing.
const GROUPS: { label: string; items: { label: string; href: string; icon: IconName }[] }[] = [
  {
    label: "Plan",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      { label: "Programmes", href: "/programmes", icon: "programmes" },
      { label: "Compare", href: "/compare", icon: "compare" },
    ],
  },
  {
    label: "Prepare",
    items: [
      { label: "Documents", href: "/documents", icon: "documents" },
      { label: "Tasks", href: "/tasks", icon: "tasks" },
      { label: "Deadlines", href: "/deadlines", icon: "deadlines" },
    ],
  },
  {
    label: "Review",
    items: [
      { label: "Adviser preview", href: "/adviser", icon: "adviser" },
      { label: "Settings", href: "/settings", icon: "settings" },
    ],
  },
];

const row =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-medium text-rail-ink transition-[background-color] hover:bg-rail-hover aria-[current=page]:bg-rail-active aria-[current=page]:font-semibold aria-[current=page]:text-white";

/** Reads the URL, which is only known at request time on dynamic routes: render inside <Suspense fallback={<NavView />}>. */
export function Nav() {
  return <NavView pathname={usePathname()} />;
}

export function NavView({ pathname = "" }: { pathname?: string }) {
  return (
    <nav aria-label="Workspace" className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p aria-hidden="true" className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-rail-muted">{g.label}</p>
          <ul aria-label={g.label} className="space-y-0.5">
            {g.items.map((item) => {
              const current = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={current ? "page" : undefined} className={row}>
                    <Icon name={item.icon} size={18} className={current ? "text-teal-on-dark" : "text-rail-muted"} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
