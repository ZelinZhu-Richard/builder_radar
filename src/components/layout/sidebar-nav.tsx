"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, ROUTE_GROUPS } from "@/lib/navigation";
import { cx } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-border bg-[rgba(3,5,8,0.94)] px-5 py-6 lg:flex lg:flex-col">
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted">Private board</p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-strong">
          Trust-first event ranking for AI, quant, builder, and performance signals.
        </p>
      </div>

      <nav className="mt-8 flex-1 space-y-7">
        {ROUTE_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-3 text-[10px] uppercase tracking-[0.26em] text-muted">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cx(
                      "block rounded-xl border px-3 py-3 transition-colors",
                      active
                        ? "border-border-strong bg-accent-soft text-foreground"
                        : "border-transparent bg-transparent text-muted-strong hover:border-border hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{item.label}</span>
                      {active ? (
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                          Live
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-muted">{item.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="rounded-2xl border border-border bg-white/[0.03] px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Refresh policy</p>
        <p className="mt-2 font-mono text-sm text-foreground">Every 2 hours</p>
        <p className="mt-2 text-xs leading-5 text-muted">
          Force a cycle break only when a first-hand event materially changes the board.
        </p>
      </div>
    </aside>
  );
}
