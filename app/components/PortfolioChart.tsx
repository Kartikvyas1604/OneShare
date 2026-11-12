"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PORTFOLIO_HISTORY } from "@/app/lib/data";

export function PortfolioChart({ range = "1M" }: { range?: string }) {
  const points =
    range === "7D"
      ? PORTFOLIO_HISTORY.slice(-8)
      : range === "1M"
        ? PORTFOLIO_HISTORY.slice(-14)
        : range === "3M"
          ? PORTFOLIO_HISTORY.slice(-18)
          : PORTFOLIO_HISTORY;

  return (
    <div className="h-56 w-full md:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f6bff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2f6bff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8fa0bb", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#8fa0bb", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            cursor={{ stroke: "rgba(148,163,184,0.25)", strokeWidth: 1 }}
            contentStyle={{
              background: "#101728",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "0 12px 32px rgba(2,6,17,0.55)",
            }}
            itemStyle={{ color: "#f4f7fb" }}
            labelStyle={{ color: "#8fa0bb" }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Portfolio"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4f8cff"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPortfolio)"
            activeDot={{ r: 4, fill: "#4f8cff", stroke: "#05070d", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
