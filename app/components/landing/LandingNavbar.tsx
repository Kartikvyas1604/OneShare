import Link from "next/link";
import { ArrowUpRight, Landmark } from "lucide-react";
import { Button } from "@/app/components/Button";

const LINKS = [
  { href: "/create", label: "Create" },
  { href: "/positions", label: "Positions" },
  { href: "/crash", label: "Crash test" },
  { href: "/explain", label: "Explain" },
] as const;

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Landmark className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="display text-lg text-foreground">Floorline</span>
        </Link>

        {/* Working pages, properly linked */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Landing">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors duration-100 hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" href="/dashboard" className="hidden sm:inline-flex">
            Open app
          </Button>
          <Button size="sm" href="/create">
            Create
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}
