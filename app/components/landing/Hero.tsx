import { Button } from "@/app/components/Button";
import { FloorToggleWindow } from "@/app/components/landing/FloorToggleWindow";

/** Integration status — the honest rails strip (obligor-style). */
const RAILS = [
  { name: "1Click funding", status: "live", note: "30+ chains" },
  { name: "Chain Signatures", status: "live", note: "derived accounts" },
  { name: "NEP-171 positions", status: "live", note: "transferable" },
  { name: "TEE attestation", status: "pending", note: "local rule meanwhile" },
  { name: "Equity route", status: "gated", note: "G-2 · verified fallback" },
] as const;

const statusStyle: Record<string, string> = {
  live: "text-up",
  pending: "text-warning",
  gated: "text-faint",
};

export function Hero() {
  return (
    <section className="relative border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-16 md:px-6 md:pb-20 md:pt-24">
        <div className="animate-fade-up inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground">
          Self-managing tokenized-equity positions on NEAR
        </div>

        {/* Serif headline — the identity statement */}
        <h1 className="display animate-fade-up delay-75 mt-5 max-w-3xl text-balance text-[44px] leading-[1.02] text-foreground md:text-[72px]">
          Your losses should{" "}
          <span className="italic text-muted-foreground">never be uncapped.</span>
        </h1>

        <p className="animate-fade-up delay-150 mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Deposit USDC from any of 30+ chains, pick a loss limit, and own a self-managing slice of
          NVIDIA as a NEAR NFT. The reserve leaves your trade path at deposit — the worst case is a
          number you set, not one the market sets.
        </p>

        <div className="animate-fade-up delay-200 mt-8 flex flex-col gap-2.5 sm:flex-row">
          <Button size="lg" href="/create" className="w-full sm:w-auto">
            Create a position
          </Button>
          <Button size="lg" variant="secondary" href="/crash" className="w-full sm:w-auto">
            Run the crash test
          </Button>
        </div>

        {/* Rails strip */}
        <div className="animate-fade-up delay-300 mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="eyebrow">Rails</span>
          {RAILS.map((r) => (
            <span
              key={r.name}
              className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">{r.name}</span>
              <span className={`num text-[10px] font-medium uppercase tracking-wide ${statusStyle[r.status]}`}>
                {r.status}
              </span>
              <span className="text-faint">· {r.note}</span>
            </span>
          ))}
        </div>

        {/* Session panel */}
        <div className="animate-fade-up delay-300 mt-12 max-w-3xl">
          <FloorToggleWindow />
        </div>
      </div>
    </section>
  );
}
