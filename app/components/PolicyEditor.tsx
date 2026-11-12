"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { Policy } from "@/app/lib/data";
import { Slider } from "./Slider";
import { Shield } from "lucide-react";

export function PolicyEditor({
  initialPolicy,
  onChange,
}: {
  initialPolicy: Policy;
  onChange?: (policy: Policy) => void;
}) {
  const [policy, setPolicy] = useState<Policy>(initialPolicy);

  const update = (patch: Partial<Policy>) => {
    const next = { ...policy, ...patch };
    setPolicy(next);
    onChange?.(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-brand-400" aria-hidden />
          Policy rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Stop loss</label>
            <span className="font-mono text-xs font-semibold text-destructive">
              −{(policy.stop_loss_bps / 100).toFixed(1)}%
            </span>
          </div>
          <Slider
            value={[policy.stop_loss_bps]}
            min={100}
            max={3000}
            step={50}
            onValueChange={(v) => update({ stop_loss_bps: v[0] })}
          />
          <p className="text-xs text-muted-foreground">
            Sell everything if price drops this far below your entry.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Take profit</label>
            <span className="font-mono text-xs font-semibold text-success">
              +{(policy.take_profit_bps / 100).toFixed(1)}%
            </span>
          </div>
          <Slider
            value={[policy.take_profit_bps]}
            min={500}
            max={10000}
            step={100}
            onValueChange={(v) => update({ take_profit_bps: v[0] })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="TP sell %"
            type="number"
            value={policy.tp_sell_bps / 100}
            onChange={(e) => update({ tp_sell_bps: Number(e.target.value) * 100 })}
          />
          <Input
            label="Max slippage (bps)"
            type="number"
            value={policy.max_slippage_bps}
            onChange={(e) => update({ max_slippage_bps: Number(e.target.value) })}
          />
        </div>

        <Button className="w-full" onClick={() => onChange?.(policy)}>
          Update policy
        </Button>
      </CardContent>
    </Card>
  );
}
