import { Button } from "@/app/components/Button";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-20 text-center md:px-6 md:py-28">
        <h2 className="animate-fade-up mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          Your first position takes 60 seconds.
        </h2>
        <p className="animate-fade-up delay-100 mx-auto mt-4 max-w-md text-balance text-[15px] leading-relaxed text-muted-foreground">
          Pay with USDC you already hold. Keep the keys. Set the rules. The stock manages itself
          from there.
        </p>
        <div className="animate-fade-up delay-200 mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Button size="lg" href="/buy" className="w-full sm:w-auto">
            Buy NVDAx now
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button size="lg" variant="secondary" href="/dashboard" className="w-full sm:w-auto">
            Open the app
          </Button>
        </div>
      </div>
    </section>
  );
}
