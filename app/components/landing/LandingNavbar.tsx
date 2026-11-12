import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/app/components/Button";

export function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-3 flex h-14 max-w-5xl items-center justify-between rounded-2xl px-4 md:mt-4 md:px-6">
        <div className="absolute inset-0 -z-10 rounded-2xl border border-white/[0.06] bg-[#05070d]/70 backdrop-blur-xl" aria-hidden />
        <Link
          href="/"
          className="relative flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow-brand">
            <ArrowLeftRight className="h-4 w-4" aria-hidden />
          </span>
          OneShare
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Landing">
          {[
            { href: "/#how", label: "How it works" },
            { href: "/#features", label: "Features" },
            { href: "/#nft", label: "Position NFT" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" href="/buy" className="hidden md:inline-flex">
            Open app
          </Button>
          <Button size="sm" href="/buy" className="h-9">
            Buy NVDAx
          </Button>
        </div>
      </div>
    </header>
  );
}
