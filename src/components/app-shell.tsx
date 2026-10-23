"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  FolderKanban,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const primaryNav = [
  { href: "/", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_0_24px_rgba(198,242,106,0.22)]">
        <Sparkles className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold tracking-tight text-foreground">
          PRD Forge
        </span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-muted">
          Blueprint studio
        </span>
      </span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5">
        <Brand />
      </div>

      <div className="px-3">
        <Link
          href="/projects/new"
          onClick={onNavigate}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-xs font-semibold text-accent-foreground transition-colors hover:bg-[#d4f77f]"
        >
          <Plus className="h-3.5 w-3.5" />
          New project
        </Link>
      </div>

      <nav className="mt-6 space-y-1 px-3">
        {primaryNav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" || pathname.startsWith("/projects") : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex h-9 items-center gap-2.5 rounded-lg px-3 text-xs font-medium transition-colors",
                active
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              <item.icon
                className={cn("h-4 w-4", active ? "text-accent" : "text-muted group-hover:text-muted-strong")}
              />
              {item.label}
              {active ? <span className="ml-auto h-1 w-1 rounded-full bg-accent" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <div className="rounded-xl border border-border bg-surface-raised/60 p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Local workspace
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            No account, no cloud sync. Projects and encrypted AI keys stay on this machine.
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted">
            <span>Embedded Postgres</span>
            <Link href="/settings" onClick={onNavigate} className="inline-flex items-center gap-0.5 text-accent hover:underline">
              Manage <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-background/70 lg:block">
        <SidebarContent />
      </aside>

      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 animate-fade-in border-r border-border bg-background">
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-4"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </Button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="min-h-screen pt-14 lg:pl-64 lg:pt-0">{children}</main>
    </div>
  );
}
