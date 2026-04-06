import type { ReactNode } from "react";
import { LaneTabs } from "./lane-tabs";
import { SidebarNav } from "./sidebar-nav";
import { TopHeader } from "./top-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-shell">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <SidebarNav />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30">
            <TopHeader />
            <LaneTabs />
          </div>

          <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
