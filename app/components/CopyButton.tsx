"use client";

import { useState } from "react";
import { cn } from "@/app/lib/utils";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  value: string;
  className?: string;
  label?: string;
}

export function CopyButton({ value, className, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-md p-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        copied && "text-up",
        className
      )}
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
