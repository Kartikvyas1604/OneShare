import { Button } from "@/app/components/Button";
import { ArrowRight, ShieldCheck, Zap, KeyRound } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-40 md:pb-24">
      {/* Background: grid + orbs */}
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent)]" aria-hidden />
      <div
        className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[140px] animate-pulse-glow"
        aria-hidden
      />
      <div
        className="absolute top-24 left-[12%] h-64 w-64 rounded-full bg-brand-400/10 blur-[100px] animate-float-slow"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 text-center md:px-6">
        {/* Announcement pill */}
        <div className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-200">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
          </span>
          Live on NEAR Intents · Built for NEAR Hackathon 2026
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up delay-100 mx-auto max-w-3xl text-balance text-[40px] font-semibold leading-[1.05] tracking-tight md:text-7xl"
        >
          <span className="gradient-text-brand">Own $10 of NVIDIA</span>
          <br />
          <span className="text-foreground">in 60 seconds</span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-up delay-200 mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          Pay with any token on any chain. Receive a real tokenized equity as a
          NEAR NFT that manages itself — stop-loss, take-profit, and DCA enforced
          onchain.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-300 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" href="/buy" className="w-full sm:w-auto">
            Start with $10
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button size="lg" variant="secondary" href="#how">
            See how it works
          </Button>
        </div>

        {/* Trust row */}
        <div className="animate-fade-up delay-400 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-brand-300" aria-hidden />
            No one holds your keys
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-300" aria-hidden />
            Keeper bounded by policy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-brand-300" aria-hidden />
            Settles via NEAR Intents
          </span>
        </div>

        {/* Product mockup */}
        <div className="animate-fade-up delay-500 relative mx-auto mt-16 max-w-3xl">
          <div
            className="absolute -inset-x-8 -top-8 bottom-10 rounded-[32px] bg-gradient-to-b from-brand-500/15 via-transparent to-transparent blur-2xl"
            aria-hidden
          />
          <PositionMockup />
        </div>
      </div>
    </section>
  );
}

function PositionMockup() {
  return (
    <div className="relative rounded-3xl border border-white/[0.08] bg-[#0b101c]/90 p-4 shadow-float backdrop-blur-xl md:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400/20 to-brand-700/40 text-sm font-bold text-brand-200">
            N
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">NVDAx</p>
            <p className="text-xs text-muted-foreground">NVIDIA xStock</p>
          </div>
        </div>
        <span className="rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
          Active
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Value</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">$11.84</p>
          <p className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-semibold text-success">
            +18.40%
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Stop-loss</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">−9.0%</p>
          <p className="mt-1 text-xs text-muted-foreground">Armed at $12.22</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Custody</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">MPC</p>
          <p className="mt-1 text-xs text-muted-foreground">Derived via Chain Sig</p>
        </div>
      </div>

      {/* Sparkline-ish bar row */}
      <div className="mt-4 flex h-16 items-end gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
        {[35, 42, 38, 50, 46, 58, 52, 64, 60, 72, 68, 78, 74, 86, 82, 94].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-brand-700/50 to-brand-400/80"
            style={{ height: `${h}%` }}
            aria-hidden
          />
        ))}
      </div>

      <p className="mt-3 text-left text-[11px] text-muted-foreground">
        Position NFT #7 · priya.near · policy enforced by vault.oneshare.near
      </p>
    </div>
  );
}
