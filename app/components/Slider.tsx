"use client";

import { cn } from "@/app/lib/utils";

interface SliderProps {
  value: number[];
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number[]) => void;
  className?: string;
  accent?: "up" | "down" | "neutral";
  /** Accessible name — every slider must pass one. */
  ariaLabel?: string;
}

export function Slider({
  value,
  min,
  max,
  step,
  onValueChange,
  className,
  accent = "neutral",
  ariaLabel = "Slider",
}: SliderProps) {
  const current = value[0] ?? min;
  const percent = ((current - min) / (max - min)) * 100;
  const fill = accent === "up" ? "bg-up" : accent === "down" ? "bg-down" : "bg-foreground";

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <div className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("absolute h-full rounded-full", fill)}
          style={{ width: `${percent}%` }}
          aria-hidden
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onValueChange([Number(e.target.value)])}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-foreground"
        aria-label={ariaLabel}
      />
    </div>
  );
}
