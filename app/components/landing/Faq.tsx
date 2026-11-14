"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/app/components/motion/Reveal";
import { STAGGER } from "@/app/components/motion/timing";

const FAQS = [
  {
    q: "Why not just hold 10% back yourself?",
    a: "Because nobody sticks to it. The reserve is escrowed so a 3am panic sell cannot touch it, and the de-risk rule is automated. You are buying discipline, not a floor.",
  },
  {
    q: "Is the floor real or marketing?",
    a: "Custody. The reserve sits in a separate contract whose only door is the vault's settle path. The invariant suite fails if any other path can move it — and there is a deliberately broken build the test catches.",
  },
  {
    q: "What happens if the asset crashes 90%?",
    a: "The de-risk rule fires at −50% from cost and sells the whole risk bucket — once. The proceeds lock until maturity, so the payout is the reserve plus whatever the sale returned. With the default 90% reserve, worst case you keep 90%.",
  },
  {
    q: "Is this a stop-loss product?",
    a: "No. A stop on thin equity liquidity gaps and cannot be promised. The escrowed reserve is the cap instead, and the de-risk rule is the automation — bounded by the reserve, not by an order book.",
  },
  {
    q: "Can I exit before maturity?",
    a: "Yes. Early exit pays NAV minus a 1% fee, computed by the contract. At maturity, settle pays NAV exactly and the position NFT burns.",
  },
  {
    q: "What about the tokenized-equity route?",
    a: "On the roadmap. Tokenized equities are not on 1Click's verified token list yet, so positions today run on the verified fallback asset with the identical mechanism. The gap is disclosed in the README, not implied.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <p className="eyebrow">FAQ</p>
          <h2 className="display mt-2 max-w-xl text-4xl text-foreground md:text-5xl">
            Got questions?
            <br />
            <span className="italic text-muted-foreground">Find answers.</span>
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-border border-y border-border">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} as="li" delay={i * STAGGER.dense}>
                <div>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-[15px] font-medium text-foreground">{f.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    className="grid transition-[grid-template-rows] duration-200 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-5 text-[14px] leading-relaxed text-muted-foreground">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
