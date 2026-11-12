import { Button } from "@/app/components/Button";
import { Lock, TrendingDown, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-16 md:px-6 md:pb-24 md:pt-24">
        <p className="eyebrow animate-fade-up text-center">
          NEAR Intents · Chain Signatures · NEP-171
        </p>

        {/* Serif headline — the identity statement */}
        <h1 className="display animate-fade-up delay-75 mx-auto mt-5 max-w-3xl text-balance text-center text-[44px] leading-[1.02] text-foreground md:text-[76px]">
          Own NVIDIA.
          <br />
          <span className="italic text-muted-foreground">Lose only what you choose.</span>
        </h1>

        <p className="animate-fade-up delay-150 mx-auto mt-6 max-w-xl text-balance text-center text-[15px] leading-relaxed text-muted-foreground">
          Deposit USDC from any of 30+ chains, pick a loss limit, and own a self-managing slice of
          NVIDIA as a NEAR NFT.
        </p>

        <div className="animate-fade-up delay-200 mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Button size="lg" href="/create" className="w-full sm:w-auto">
            Create a position
          </Button>
          <Button size="lg" variant="secondary" href="/crash" className="w-full sm:w-auto">
            Run the crash test
          </Button>
        </div>

        <div className="animate-fade-up delay-300 mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { icon: Lock, label: "Reserve in a separate contract" },
            { icon: TrendingDown, label: "De-risk rule, automated" },
            { icon: ShieldCheck, label: "No leverage, no liquidation" },
          ].map((t) => (
            <span key={t.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <t.icon className="h-3.5 w-3.5 text-faint" aria-hidden />
              {t.label}
            </span>
          ))}
        </div>

        {/* Product window */}
        <div className="animate-fade-up delay-300 mx-auto mt-16 max-w-2xl">
          <PositionWindow />
        </div>
      </div>
    </section>
  );
}

function PositionWindow() {
  const bars = [78, 74, 80, 72, 76, 70, 74, 68, 72, 66, 70, 90, 88, 92, 90, 94];
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" aria-hidden />
        <span className="num ml-2 text-[11px] text-muted-foreground">
          floorline-demo.near / vault / 8f3a1c42
        </span>
      </div>

      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold text-foreground">wNEAR position · demo asset</p>
            <p className="num mt-1 text-2xl font-semibold text-foreground">$1,007.54</p>
            <p className="num mt-0.5 text-xs text-up">+0.75% since deposit</p>
          </div>
          <span className="rounded-md border border-up/25 bg-up-soft px-2 py-0.5 text-[11px] font-medium text-up">
            Active
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
          <Cell label="Reserve" value="$900.00" sub="escrowed, separate contract" />
          <Cell label="Risk bucket" value="$107.54" sub="27.93 wNEAR @ $3.58" />
          <Cell label="De-risk" value="−50%" tone="down" sub="armed · single-shot" />
        </div>

        <div className="mt-4 flex h-20 items-end gap-1 rounded-lg border border-border bg-input px-3 py-2.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-up/60" style={{ height: `${h}%` }} aria-hidden />
          ))}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Worst case <span className="num text-foreground">$900.00</span> — the reserve plus
          realised proceeds, never less. Position NFT #1 · priya.near · floorline-demo.near
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
