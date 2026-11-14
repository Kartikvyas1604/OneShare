import Link from "next/link";
import { Landmark } from "lucide-react";

const REPO_URL = "https://github.com/Kartikvyas1604/OneShare";

const links = [
  { label: "Create", href: "/create" },
  { label: "Positions", href: "/positions" },
  { label: "Legal", href: "/legal" },
  { label: "GitHub", href: REPO_URL },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      {/* Obligor-style minimal footer */}
      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-6">
        {/* Row 1 — brand + capability line */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Landmark className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="display text-lg text-foreground">Floorline</span>
          </Link>
          <p className="num text-xs text-muted-foreground">
            Loss-limit positions · Escrowed reserves · NEAR Intents · NEP-171 · Attested keeper
          </p>
        </div>

        {/* Row 2 — description + product links */}
        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-center">
          <p className="max-w-3xl">
            Floorline splits every deposit into an escrowed reserve and a bounded risk budget, then
            automates the de-risk rule. Not a brokerage, exchange, or investment advisor; tokenized
            equities carry issuer, custody, oracle, and smart-contract risks. The equity route is a
            documented roadmap item — disclosed rather than implied.
          </p>
          <nav aria-label="Footer" className="num flex shrink-0 gap-5 text-xs">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Row 3 — legal */}
        <div className="mt-6 flex flex-col justify-between gap-2 border-t border-border pt-5 text-[11px] text-faint sm:flex-row sm:items-center">
          <p>© 2026 Floorline Labs</p>
          <p className="num">Not audited · Non-US only · Fees 0% at launch</p>
        </div>
      </div>
    </footer>
  );
}
