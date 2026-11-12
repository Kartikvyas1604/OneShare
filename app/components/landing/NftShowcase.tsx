import { Button } from "@/app/components/Button";
import { ArrowRight, Check } from "lucide-react";

const facts = [
  "Transfer the NFT — settle pays whoever holds it",
  "The reserve and risk budget ride with the token",
  "Open source, plainly not audited",
];

export function NftShowcase() {
  return (
    <section id="nft" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:gap-16">
        <div className="animate-fade-up">
          <p className="eyebrow">Position NFT</p>
          <h2 className="display mt-2 max-w-md text-4xl text-foreground md:text-5xl">
            The position is the product.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            The position mints as an NEP-171 NFT on NEAR. Whoever holds the NFT owns the floor, the
            risk budget, and the de-risk rule — so it can be moved, gifted, or sold without
            unwinding a single position.
          </p>
          <ul className="mt-6 space-y-2.5">
            {facts.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[14px] text-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-up-soft text-up">
                  <Check className="h-2.5 w-2.5" aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button href="/create">
              Mint your first position
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* NFT panel */}
        <div className="animate-fade-up delay-150 mx-auto w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="eyebrow">NEP-171</span>
              <span className="num rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                token #1
              </span>
            </div>
            <div className="px-4 py-5">
              <p className="eyebrow text-center">Floorline position</p>
              <p className="mt-2 text-center">
                <span className="num text-3xl font-semibold text-foreground">$1,007.54</span>{" "}
                <span className="num text-sm text-muted-foreground">NAV</span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
                <div className="bg-card px-3 py-2.5">
                  <p className="eyebrow">Reserve</p>
                  <p className="num mt-1 text-[13px] font-semibold text-foreground">$900.00</p>
                </div>
                <div className="bg-card px-3 py-2.5">
                  <p className="eyebrow">De-risk</p>
                  <p className="num mt-1 text-[13px] font-semibold text-down">−50% armed</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="num text-[11px] text-muted-foreground">floorline-demo.near</span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Reserve at the escrow contract
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
