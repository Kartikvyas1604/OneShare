import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(value: number, opts: { compact?: boolean } = {}) {
  if (opts.compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTokenAmount(value: number, decimals = 4) {
  if (value === 0) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, opts: { sign?: boolean } = {}) {
  const sign = opts.sign && value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

export function formatBps(value: number) {
  return `${value.toFixed(0)} bps`;
}

export function truncateAddress(address: string, chars = 4) {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatDate(date: Date | string | number) {
  const d = new Date(date);
  // UTC keeps server and client output byte-identical (no hydration mismatch).
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(d);
}

/** Deterministic UTC date used for relative labels like "2h ago". */
export function timeAgoLabel(ts: number, now = MOCK_EPOCH_FALLBACK) {
  const diff = Math.max(0, now - ts);
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// Matches MOCK_EPOCH in data.ts without a circular import.
const MOCK_EPOCH_FALLBACK = Date.UTC(2026, 10, 12, 6, 0, 0);

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
