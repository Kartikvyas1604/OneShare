"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { Button } from "@/app/components/Button";
import {
  LayoutDashboard,
  Plus,
  ChartCandlestick,
  LineChart,
  MessageSquareText,
  ArrowLeftRight,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/buy", label: "Buy", icon: Plus },
  { href: "/positions", label: "Stocks", icon: ChartCandlestick },
  { href: "/sim", label: "Simulator", icon: LineChart },
  { href: "/explain", label: "Explain", icon: MessageSquareText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </span>
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight text-foreground focus-visible:outline-none"
        >
          OneShare
        </Link>
      </div>

      {/* Nav */}
      <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3 py-4">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-4 w-4", isActive ? "text-foreground" : "text-faint")}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: actions */}
      <div className="space-y-3 border-t border-border p-3">
        <Button className="w-full" href="/buy">
          New position
        </Button>
        <div className="rounded-lg border border-border bg-card px-3 py-2.5">
          <p className="eyebrow">Wallet</p>
          <p className="num mt-1 truncate text-[11px] text-foreground">priya.near</p>
          <p className="text-[10px] text-muted-foreground">Connected · Mainnet</p>
        </div>
        <p className="px-1 text-[10px] leading-relaxed text-faint">
          Not audited. Non-US only.
        </p>
      </div>
    </aside>
  );
}

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-1">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-[18px] w-[18px]", isActive && "text-up")}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground focus-visible:outline-none"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
        </span>
        OneShare
      </Link>
      <Button size="sm" href="/buy" className="h-8">
        Buy
      </Button>
    </header>
  );
}
