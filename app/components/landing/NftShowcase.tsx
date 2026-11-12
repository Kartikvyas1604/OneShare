import { Cuboid, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/Button";

export function NftShowcase() {
  return (
    <section id="nft" className="relative scroll-mt-24 overflow-hidden py-20 md:py-28">
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-700/15 blur-[120px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-5xl px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
              Position NFT
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              The position is the product
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Your NVDAx position lives as a NEP-171 NFT on NEAR. Whoever holds the NFT controls the
              underlying Solana account — so you can sell it, gift it, or pledge it as collateral
              without unwinding a single thing.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              {[
                "Transfer the NFT, control moves — verified live on mainnet",
                "No admin withdraw, no upgrade key on your funds",
                "Open source, small attack surface, not audited (we say so plainly)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <ArrowRight className="h-2.5 w-2.5" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="/buy" variant="secondary">
                Mint your first position
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          {/* Visual: NFT card */}
          <div className="animate-fade-up delay-200 relative mx-auto w-full max-w-sm">
            <div
              className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-brand-500/25 via-brand-700/10 to-transparent blur-2xl"
              aria-hidden
            />
            <div className="relative rotate-1 rounded-3xl border border-white/10 bg-gradient-to-br from-[#101b38] via-[#0b101c] to-[#0a0e1a] p-6 shadow-float">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-200">
                  <Cuboid className="h-4 w-4" aria-hidden />
                  NEP-171
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                  pos-7
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/30 p-5">
                <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  OneShare position
                </p>
                <p className="mt-1 text-center font-mono text-3xl font-semibold tabular-nums text-foreground">
                  0.745 <span className="text-lg text-muted-foreground">NVDAx</span>
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Stop-loss
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-semibold text-destructive">−9.0%</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Take-profit
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-semibold text-success">+25.0%</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground">7xKX…kLm</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-300">
                  Solana custody
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
