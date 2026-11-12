import { Button } from "@/app/components/Button";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div
        className="absolute left-1/2 top-1/2 h-[380px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/20 blur-[130px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center md:px-6">
        <h2 className="animate-fade-up text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          Your first position takes <span className="gradient-text-brand">60 seconds</span>
        </h2>
        <p className="animate-fade-up delay-100 mx-auto mt-4 max-w-lg text-balance text-sm leading-relaxed text-muted-foreground md:text-base">
          Pay with USDC you already hold. Keep the keys. Set the rules. The stock manages itself from
          there.
        </p>
        <div className="animate-fade-up delay-200 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" href="/buy">
            Buy NVDAx now
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button size="lg" variant="outline" href="/positions">
            View positions
          </Button>
        </div>
      </div>
    </section>
  );
}
