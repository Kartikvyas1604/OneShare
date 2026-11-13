import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** USD with 2 decimals; compact notation above $1M. */
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

/** Token amount, up to `decimals` places, trimmed. */
export function formatTokenAmount(value: number, decimals = 4) {
  if (value === 0) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Signed percent: default keeps the natural sign (−1.12%); `sign: true` forces an explicit +/−. */
export function formatPercent(value: number, opts: { sign?: boolean } = {}) {
  if (opts.sign) {
    const sign = value > 0 ? "+" : value < 0 ? "−" : "";
    return `${sign}${Math.abs(value * 100).toFixed(2)}%`;
  }
  return `${(value * 100).toFixed(2)}%`;
}

export function formatBps(value: number) {
  return `${value.toFixed(0)} bps`;
}

/** Base58 truncation: 7xKX…kLm */
export function truncateAddress(address: string, chars = 4) {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/**
 * Deterministic UTC timestamp formatting.
 * Fixed locale + timeZone keeps server and client renders
 * byte-identical — prevents hydration mismatches.
 */
export function formatDate(date: Date | string | number) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(d);
}

/** Relative label ("3h ago") against the real clock. */
export function timeAgoLabel(ts: number, now = Date.now()) {
  const diff = Math.max(0, now - ts);
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
