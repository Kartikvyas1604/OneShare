"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/app/lib/utils";
import { Button } from "@/app/components/Button";
import { useWallet } from "@/app/components/wallet/WalletProvider";
import { Landmark, Menu, X } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/create", label: "Create" },
  { href: "/positions", label: "Positions" },
];

/**
 * Single sticky top header for every app page — no sidebar, no dock.
 * Desktop: inline nav + wallet state + CTA. Mobile: hamburger drawer that
 * closes on route change and Escape, with body scroll locked while open.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { accountId, connecting, showConnect, signOut } = useWallet();

  // Close the drawer on route change; defer out of the effect body.
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Escape closes; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-3 px-4 md:px-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Landmark className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="display text-lg text-foreground">Floorline</span>
        </Link>

        {/* Desktop nav — real working pages */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Real wallet connection through the Wallet Selector modal */}
          {connecting ? (
            <span className="num hidden rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground lg:inline-flex">
              wallet…
            </span>
          ) : accountId ? (
            <>
              <span
                className="num hidden max-w-44 truncate rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-foreground lg:inline-flex"
                title={`Connected: ${accountId}`}
              >
                {accountId}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="hidden lg:inline-flex"
                onClick={() => void signOut()}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={showConnect}>
              Connect
            </Button>
          )}
          <Button size="sm" href="/create" className="hidden sm:inline-flex">
            New position
          </Button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="animate-fade-in border-t border-border bg-background md:hidden"
        >
          <div className="flex flex-col gap-1 px-4 py-4">
            {/* Real wallet connection in the drawer */}
            <div className="px-1 pb-2">
              {connecting ? (
                <p className="num text-[11px] text-faint">wallet…</p>
              ) : accountId ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
                  <span className="num truncate text-[11px] text-foreground">{accountId}</span>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" className="w-full" onClick={showConnect}>
                  Connect wallet
                </Button>
              )}
            </div>
            {NAV.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/create"
              className="mt-2 inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              New position
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
