import { Button } from "@/app/components/Button";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/app/components/motion/Reveal";
import { STAGGER } from "@/app/components/motion/timing";

export function FinalCta() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-20 text-center md:px-6 md:py-28">
        <Reveal>
          <h2 className="display mx-auto max-w-2xl text-balance text-4xl text-foreground md:text-6xl">
            Pick your loss limit. Own the floor.
          </h2>
        </Reveal>
        <Reveal delay={STAGGER.dense}>
          <p className="mx-auto mt-5 max-w-md text-balance text-[15px] leading-relaxed text-muted-foreground">
            Deposit USDC you already hold, from any chain. The worst case is in dollars before you
            send — the contract keeps the rest of the discipline for you.
          </p>
        </Reveal>
        <Reveal delay={STAGGER.dense * 2} className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Button size="lg" href="/create" className="w-full sm:w-auto">
            Create a position
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button size="lg" variant="secondary" href="/crash" className="w-full sm:w-auto">
            Watch the crash test
          </Button>
        </Reveal>
        <Reveal delay={STAGGER.dense * 3}>
          <p className="mt-8 text-[11px] leading-relaxed text-muted-foreground">
            Not available to US persons. Not investment advice. Not audited. The demo runs a verified
            fallback asset — the tokenized-equity route is disclosed in the README, not implied.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
