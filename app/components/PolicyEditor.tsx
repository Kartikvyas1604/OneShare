"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Slider } from "./Slider";
import { Policy } from "@/app/lib/data";
import { ShieldCheck } from "lucide-react";

export function PolicyEditor({
  initialPolicy,
  onChange,
}: {
  initialPolicy: Policy;
  onChange?: (policy: Policy) => void;
}) {
  const [policy, setPolicy] = useState<Policy>(initialPolicy);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<Policy>) => {
    setPolicy({ ...policy, ...patch });
    setSaved(false);
  };

  const save = () => {
    onChange?.(policy);
    setSaved(true);
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <ShieldCheck className="h-3.5 w-3.5 text-faint" aria-hidden />
        <h3 className="eyebrow">Policy rules</h3>
        <span className="text-[11px] text-muted-foreground">Enforced onchain · owner only</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground">Stop loss</label>
              <span className="num text-[13px] font-medium text-down">
                −{(policy.stop_loss_bps / 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[policy.stop_loss_bps]}
              min={100}
              max={3000}
              step={50}
              accent="down"
              onValueChange={(v) => update({ stop_loss_bps: v[0] })}
            />
            <p className="text-xs text-muted-foreground">
              Sells the whole position if price falls below your entry by this amount.
            </p>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground">Take profit</label>
              <span className="num text-[13px] font-medium text-up">
                +{(policy.take_profit_bps / 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[policy.take_profit_bps]}
              min={500}
              max={10000}
              step={100}
              accent="up"
              onValueChange={(v) => update({ take_profit_bps: v[0] })}
            />
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground">Sell portion at TP</label>
              <span className="num text-[13px] font-medium text-foreground">
                {(policy.tp_sell_bps / 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[policy.tp_sell_bps]}
              min={1000}
              max={10000}
              step={500}
              onValueChange={(v) => update({ tp_sell_bps: v[0] })}
            />
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Input
              id="slippage"
              label="Max slippage"
              type="number"
              value={policy.max_slippage_bps}
              onChange={(e) => update({ max_slippage_bps: Number(e.target.value) })}
              hint="In basis points (100 = 1%)"
            />
            <Input
              id="dca"
              label="DCA interval (days)"
              type="number"
              value={Math.round(policy.dca_interval_s / 86400)}
              onChange={(e) => update({ dca_interval_s: Number(e.target.value) * 86400 })}
              hint="0 disables scheduled buys"
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-4">
            <p className="text-xs text-muted-foreground">
              Changes apply from the next block. The keeper is bound to these values.
            </p>
            <Button size="sm" onClick={save} className="shrink-0">
              {saved ? "Saved" : "Save policy"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
