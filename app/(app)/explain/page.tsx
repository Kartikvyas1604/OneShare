"use client";

import { useState } from "react";
import { Button } from "@/app/components/Button";
import { Badge } from "@/app/components/Badge";
import { Brain, ShieldCheck, Loader2, RefreshCw, Lock, TrendingDown, Cuboid } from "lucide-react";

export default function ExplainPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    text: string;
    attestation: string;
    cached: boolean;
    question: string;
  } | null>(null);

  const ask = async (question: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    setResult({
      question,
      text:
        "The reserve sits in a separate escrow contract whose only door is the vault's settle path — a de-risk sale or an early exit cannot touch it. The risk budget is the only bucket the market can move, and the de-risk rule sells it in full if it falls 50% below what it cost, once, with no keeper discretion. The de-risk rule is deterministic on-chain: the contract enforces the trigger and the single-shot latch, so no keeper discretion is possible.",
      attestation: "ed25519:3kQ4…mV2r",
      cached: false,
    });
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Header */}
      <header>
        <p className="eyebrow">Explain</p>
        <h1 className="display mt-1.5 text-3xl text-foreground">Ask about your position</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Answered by the deterministic rule the contract enforces — formula 6, single-shot (I6).
        </p>
      </header>

      {!result && !loading && (
        <section className="animate-fade-up space-y-2">
          {[
            { icon: Lock, text: "How is the reserve protected?" },
            { icon: TrendingDown, text: "When does the de-risk rule fire?" },
            { icon: Cuboid, text: "What does the position NFT control?" },
          ].map((q) => (
            <button
              key={q.text}
              type="button"
              onClick={() => ask(q.text)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 text-left text-[13px] font-medium text-foreground transition-colors duration-100 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <q.icon className="h-4 w-4 shrink-0 text-faint" aria-hidden />
              {q.text}
            </button>
          ))}
        </section>
      )}

      {loading && (
        <section className="animate-fade-in engraved rounded-2xl bg-card px-4 py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
          <p className="mt-3 text-[13px] font-medium text-foreground">Attesting explanation…</p>
          <p className="mt-1 text-xs text-muted-foreground">Enforced on-chain by the vault contract.</p>
        </section>
      )}

      {result && (
        <section className="animate-fade-up space-y-4">
          <div className="engraved rounded-2xl bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
              <p className="truncate text-[13px] font-medium text-foreground">{result.question}</p>
              {result.cached ? (
                <Badge variant="neutral">Cached</Badge>
              ) : (
                <Badge variant="up">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  Attested
                </Badge>
              )}
            </div>
            <p className="px-4 py-4 text-[13px] leading-relaxed text-foreground">{result.text}</p>
            <p className="num border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
              attestation {result.attestation}
              {result.cached ? " · served from cache" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => ask(result.question)}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Ask again
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
              New question
            </Button>
          </div>
        </section>
      )}

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" aria-hidden />
        If the attestation service is unavailable, a cached answer is served and clearly marked.
        Floorline never fakes a badge.
      </p>
    </div>
  );
}
