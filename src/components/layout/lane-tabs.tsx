"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANE_TABS } from "@/lib/navigation";
import { cx } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function LaneTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-[rgba(2,4,9,0.72)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex gap-2 overflow-x-auto">
        {LANE_TABS.map((tab) => {
          const active = isActive(pathname, tab.href);

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cx(
                "shrink-0 rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors",
                active
                  ? "border-border-strong bg-accent-soft text-foreground"
                  : "border-border bg-white/[0.03] text-muted-strong hover:bg-white/[0.06] hover:text-foreground",
              )}
            >
              {tab.shortLabel}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
