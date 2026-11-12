"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { Home, PieChart, Sparkles, Brain, ArrowLeftRight } from "lucide-react";

const navItems = [
  { href: "/buy", label: "Buy", icon: Home },
  { href: "/positions", label: "Positions", icon: PieChart },
  { href: "/sim", label: "Sim", icon: Sparkles },
  { href: "/explain", label: "Explain", icon: Brain },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4 md:max-w-2xl">
          <Link
            href="/buy"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow-brand">
              <ArrowLeftRight className="h-4 w-4" aria-hidden />
            </span>
            OneShare
          </Link>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Connect
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-md px-4 pb-28 pt-5 md:max-w-2xl md:pb-8 md:pt-8">
          {children}
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop side nav placeholder — pages remain mobile-first */}
      <aside className="hidden" />
    </div>
  );
}
