import { Button } from "@/app/components/Button";
import { KeyRound, ShieldCheck, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-16 md:px-6 md:pb-24 md:pt-24">
        {/* Eyebrow */}
        <p className="eyebrow animate-fade-up text-center">NEAR Intents · Chain Signatures · NEP-171</p>

        {/* Headline */}
        <h1 className="animate-fade-up delay-75 mx-auto mt-4 max-w-3xl text-balance text-center text-[40px] font-semibold leading-[1.04] tracking-tight text-foreground md:text-6xl">
          Own $10 of NVIDIA.
          <br />
          <span className="text-muted-foreground">In 60 seconds.</span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-up delay-150 mx-auto mt-5 max-w-xl text-balance text-center text-[15px] leading-relaxed text-muted-foreground">
          Pay with any token on any chain. Receive a real tokenized equity as a NEAR NFT that
          manages itself — stop-loss, take-profit, and DCA enforced onchain.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-200 mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Button size="lg" href="/buy" className="w-full sm:w-auto">
            Start with $10
          </Button>
          <Button size="lg" variant="secondary" href="#how" className="w-full sm:w-auto">
            See how it works
          </Button>
        </div>

        {/* Trust row */}
        <div className="animate-fade-up delay-300 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { icon: KeyRound, label: "No one holds your keys" },
            { icon: ShieldCheck, label: "Keeper bounded by policy" },
            { icon: Zap, label: "Settled by 1Click solvers" },
          ].map((t) => (
            <span
              key={t.label}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <t.icon className="h-3.5 w-3.5 text-faint" aria-hidden />
              {t.label}
            </span>
          ))}
        </div>

        {/* Product window */}
        <div className="animate-fade-up delay-300 mx-auto mt-14 max-w-2xl">
          <PositionWindow />
        </div>
      </div>
    </section>
  );
}

function PositionWindow() {
  const bars = [35, 42, 38, 50, 46, 58, 52, 64, 60, 72, 68, 78, 74, 86, 82, 94];
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#2e2e2e]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2e2e2e]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2e2e2e]" aria-hidden />
        <span className="num ml-2 text-[11px] text-muted-foreground">
          oneshare.near / positions / 7
        </span>
      </div>

      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold text-foreground">NVDAx · NVIDIA xStock</p>
            <p className="num mt-1 text-2xl font-semibold text-foreground">$11.84</p>
            <p className="num mt-0.5 text-xs text-up">+18.40% all time</p>
          </div>
          <span className="rounded-md border border-up/25 bg-up-soft px-2 py-0.5 text-[11px] font-medium text-up">
            Active
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
          <Cell label="Stop-loss" value="−9.0%" tone="down" sub="armed at $12.22" />
          <Cell label="Take-profit" value="+25.0%" tone="up" sub="sell 50%" />
          <Cell label="Custody" value="MPC" sub="via Chain Sig" />
        </div>

        <div className="mt-4 flex h-20 items-end gap-1 rounded-lg border border-border bg-input px-3 py-2.5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-up/60"
              style={{ height: `${h}%` }}
              aria-hidden
            />
          ))}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Position NFT #7 · priya.near · enforced by vault.oneshare.near
        </p>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="bg-card px-3 py-2.5">
      <p className="eyebrow">{label}</p>
      <p
        className={`num mt-1 text-sm font-semibold ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
