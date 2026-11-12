import { ArrowLeftRight } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Buy NVDAx", href: "/buy" },
      { label: "Positions", href: "/positions" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Simulator", href: "/sim" },
    ],
  },
  {
    title: "Built on",
    links: [
      { label: "NEAR Intents", href: "https://docs.near-intents.org" },
      { label: "Chain Signatures", href: "https://docs.near.org/chain-abstraction/chain-signatures" },
      { label: "xStocks", href: "https://xstocks.com" },
      { label: "NEAR AI Cloud", href: "https://cloud-api.near.ai" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Not a brokerage", href: "#" },
      { label: "Non-US only", href: "#" },
      { label: "Not audited", href: "#" },
      { label: "No advice", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#05070d]">
      <div className="mx-auto max-w-5xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-white">
                <ArrowLeftRight className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">OneShare</span>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Own $10 of NVIDIA in 60 seconds — any token, any chain, a position that manages itself.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/[0.06] pt-6">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            OneShare is not a brokerage, exchange, or investment advisor. Tokenized equities carry
            issuer, custody, oracle, and smart-contract risks. Available to non-US persons only. Not
            audited. We do not promise returns; we publish the simulation and the rules.
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            © 2026 OneShare · Built at NEAR Hackathon 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
