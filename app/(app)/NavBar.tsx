"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { Home, PieChart, Sparkles, Brain, ArrowLeftRight, ArrowRightLeft, Wallet } from "lucide-react";
import { Button } from "@/app/components/Button";

const navItems = [
  { href: "/dashboard", label: "Home", icon: PieChart },
  { href: "/buy", label: "Buy", icon: Home },
  { href: "/positions", label: "Stocks", icon: ArrowRightLeft },
  { href: "/sim", label: "Sim", icon: Sparkles },
  { href: "/explain", label: "AI", icon: Brain },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4 md:max-w-2xl md:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow-brand">
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
            </span>
            OneShare
          </Link>
          <Button size="sm" className="h-9">
            <Wallet className="h-3.5 w-3.5" aria-hidden />
            Connect
          </Button>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#070b14]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[10px] font-semibold transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isActive ? "text-brand-200" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-100",
                    isActive ? "bg-brand-500/15" : "bg-transparent"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
