"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Badge } from "@/app/components/Badge";
import { Brain, ShieldCheck, Loader2, RefreshCw, KeyRound, Cuboid, TrendingDown } from "lucide-react";

export default function ExplainPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    text: string;
    attestation: string;
    cached: boolean;
  } | null>(null);

  const ask = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setResult({
      text:
        "Your position is an NFT on NEAR. The underlying NVDAx tokens sit at a Solana address derived by NEAR Chain Signatures — no one, including OneShare, holds the private key. Your stop-loss rule is enforced by a keeper that can only act inside the bounds you set, with a 5 NEAR bond at stake. Every action it takes is written to the onchain audit log.",
      attestation: "0x8f3a…b921",
      cached: false,
    });
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-brand-500/15 bg-gradient-to-br from-brand-900/50 via-card to-background p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl animate-pulse-glow" aria-hidden />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-brand-300">
          TEE attested
        </p>
        <h1 className="relative mt-1.5 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Explain my position
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
          Ask a TEE-hosted model on NEAR AI Cloud to break down custody, policy, and recent actions —
          with a verifiable attestation quote.
        </p>
      </section>

      {!result && !loading && (
        <Card className="animate-fade-up delay-100 text-center">
          <CardContent className="pb-8 pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-700/40 text-brand-200 shadow-glow-brand">
              <Brain className="h-8 w-8" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
              What do you want to know?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Example: “How is my position secured?”</p>
            <div className="mx-auto mt-5 grid max-w-sm gap-2 text-left">
              {[
                { icon: KeyRound, text: "Who custodies my NVDAx?" },
                { icon: TrendingDown, text: "Why would my stop-loss fire?" },
                { icon: Cuboid, text: "What does the position NFT control?" },
              ].map((q) => (
                <button
                  key={q.text}
                  type="button"
                  onClick={ask}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left text-xs font-medium text-foreground transition-colors duration-100 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <q.icon className="h-4 w-4 shrink-0 text-brand-300" aria-hidden />
                  {q.text}
                </button>
              ))}
            </div>
            <Button className="mt-5 w-full max-w-sm" onClick={ask}>
              Explain my position
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="animate-fade-in text-center">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-300" aria-hidden />
            <p className="text-sm font-semibold text-foreground">Attesting explanation…</p>
            <p className="text-xs text-muted-foreground">Running inside a TEE on NEAR AI Cloud.</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="animate-fade-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-brand-300" aria-hidden />
                Explanation
              </CardTitle>
              {result.cached ? (
                <Badge variant="neutral">Cached</Badge>
              ) : (
                <Badge variant="up" className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  Attested
                </Badge>
              )}
            </div>
            <CardDescription>
              {result.cached
                ? "Served from cache while the attestation service is unavailable."
                : `Attestation quote ${result.attestation}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-relaxed text-foreground">
              {result.text}
            </p>
            <Button variant="secondary" size="sm" onClick={ask}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Ask again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
