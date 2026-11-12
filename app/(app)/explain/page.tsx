"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/Card";
import { Button } from "@/app/components/Button";
import { Badge } from "@/app/components/Badge";
import { Brain, ShieldCheck, Loader2, RefreshCw } from "lucide-react";

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
        "Your position is an NFT on NEAR. The underlying NVDAx tokens sit at a Solana address derived by NEAR Chain Signatures — no one, including OneShare, holds the private key. Your stop-loss rule is enforced by a keeper that can only act inside the bounds you set, with a 5 NEAR bond at stake.",
      attestation: "0x8f3a…b921",
      cached: false,
    });
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Explain my position</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Ask a TEE-attested AI to break down your position, custody, and policy in plain language.
        </p>
      </section>

      {!result && !loading && (
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-950 text-brand-300">
              <Brain className="h-8 w-8" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">What do you want to know?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Example: “How is my position secured?”
            </p>
            <Button className="mt-5" onClick={ask}>
              Explain my position
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="text-center">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-400" aria-hidden />
            <p className="text-sm font-medium text-foreground">Attesting explanation…</p>
            <p className="text-xs text-muted-foreground">Running inside a TEE on NEAR AI Cloud.</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-brand-400" aria-hidden />
                Explanation
              </CardTitle>
              {result.cached ? (
                <Badge variant="secondary">Cached</Badge>
              ) : (
                <Badge variant="success" className="flex items-center gap-1">
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
            <p className="text-sm leading-relaxed text-foreground">{result.text}</p>
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
