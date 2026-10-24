"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Nav } from "./nav";

/** The rail's menu on small screens: a native disclosure that also closes on Escape, outside click and navigation. */
export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = () => {
      if (ref.current) ref.current.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current?.open && e.target instanceof Node && !ref.current.contains(e.target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return (
    <details ref={ref} className="relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg px-3 text-sm font-semibold text-rail-ink hover:bg-rail-hover">
        Menu
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-rail-line bg-rail p-2 shadow-lg shadow-black/25">
        <Nav />
      </div>
    </details>
  );
}
