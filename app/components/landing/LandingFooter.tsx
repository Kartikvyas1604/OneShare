import { Landmark } from "lucide-react";

const REPO_URL = "https://github.com/Kartikvyas1604/OneShare";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Create a position", href: "/create" },
      { label: "Positions", href: "/positions" },
      { label: "Crash test", href: "/crash" },
      { label: "Explain", href: "/explain" },
    ],
  },
  {
    title: "Built on",
    links: [
      { label: "NEAR Intents", href: "https://docs.near-intents.org" },
      { label: "Chain Signatures", href: "https://docs.near.org/chain-abstraction/chain-signatures" },
      { label: "NEAR AI Cloud", href: "https://docs.near.ai" },
      { label: "1Click API", href: "https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart" },
    ],
  },
  {
    title: "Source",
    links: [
      { label: "GitHub repo", href: REPO_URL },
      { label: "Decision log", href: `${REPO_URL}/blob/main/docs/DECISIONS.md` },
      { label: "MIT licence", href: `${REPO_URL}/blob/main/LICENSE` },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-[1100px] px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Landmark className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="display text-lg text-foreground">Floorline</span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Deposit USDC from any chain, pick a loss limit, and own a self-managing slice of
              NVIDIA as a NEAR NFT.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Floorline is not a brokerage, exchange, or investment advisor. Tokenized equities carry
            issuer, custody, oracle, and smart-contract risks. Available to non-US persons only.
            Not audited. We do not promise returns; we publish the simulation and the rules. The
            demo runs a verified fallback asset — the equity route is gated and disclosed, not
            implied.
          </p>
          <p className="mt-3 text-[11px] text-faint">
            © 2026 Floorline · Built at NEAR Hackathon 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
