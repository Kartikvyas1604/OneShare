"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

export interface LiveToken {
  assetId: string;
  symbol: string;
  price: number;
  decimals: number;
  blockchain: string;
}

/**
 * Searchable token picker over the live 1Click token list (real prices,
 * real chains). Nothing hardcoded — whatever /api/tokens returns is the list.
 */
export function TokenPicker({
  tokens,
  selectedAssetId,
  onSelect,
  loading,
}: {
  tokens: LiveToken[];
  selectedAssetId: string;
  onSelect: (t: LiveToken) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tokens.slice(0, 50);
    return tokens
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.assetId.toLowerCase().includes(q) ||
          t.blockchain.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [tokens, query]);

  const selected = tokens.find((t) => t.assetId === selectedAssetId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-input px-3.5 text-sm transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="num flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card text-[10px] font-semibold text-foreground">
              {selected.symbol.slice(0, 2)}
            </span>
            <span className="font-medium text-foreground">
              {selected.symbol}
              <span className="ml-1.5 text-muted-foreground">on {selected.blockchain}</span>
            </span>
            <span className="num text-[11px] text-muted-foreground">${selected.price.toFixed(4)}</span>
          </span>
        ) : loading ? (
          <span className="text-muted-foreground">Loading tokens…</span>
        ) : (
          <span className="text-muted-foreground">Select a token</span>
        )}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-3.5 w-3.5 text-faint" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search token or chain…"
              spellCheck={false}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-faint focus-visible:outline-none"
              aria-label="Search tokens"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {filtered.map((t) => (
              <li key={t.assetId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={t.assetId === selectedAssetId}
                  onClick={() => {
                    onSelect(t);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="num flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary text-[10px] font-semibold text-foreground">
                      {t.symbol.slice(0, 2)}
                    </span>
                    <span>
                      <span className="block text-[13px] font-medium text-foreground">{t.symbol}</span>
                      <span className="block text-[11px] text-muted-foreground">{t.blockchain}</span>
                    </span>
                  </span>
                  <span className="num text-xs text-muted-foreground">${t.price.toFixed(4)}</span>
                  {t.assetId === selectedAssetId && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-up" aria-hidden />
                  )}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3.5 py-4 text-center text-[13px] text-muted-foreground">No tokens match.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
