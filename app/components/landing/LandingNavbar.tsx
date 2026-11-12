import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/app/components/Button";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground focus-visible:outline-none"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
          </span>
          OneShare
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Landing">
          {[
            { href: "#how", label: "How it works" },
            { href: "#features", label: "Features" },
            { href: "#nft", label: "Position NFT" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" href="/dashboard" className="hidden sm:inline-flex">
            Open app
          </Button>
          <Button size="sm" href="/buy">
            Buy NVDAx
          </Button>
        </div>
      </div>
    </header>
  );
}
