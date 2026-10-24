"use client";

import { useEffect } from "react";
import { saveTimeZoneAction } from "@/lib/auth/actions";

/** Saves the browser's time zone once, while the profile still has the default 'UTC' (SET-01, PRD 5.5). */
export function TimeZoneSync({ current }: { current: string }) {
  useEffect(() => {
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (current === "UTC" && browser && browser !== "UTC") void saveTimeZoneAction(browser);
  }, [current]);
  return null;
}
