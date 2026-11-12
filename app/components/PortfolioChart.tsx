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
    <div className="h-52 w-full md:h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="fillPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ddc97" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#3ddc97" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(237,235,228,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8f8f96", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#8f8f96", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            cursor={{ stroke: "rgba(237,235,228,0.15)", strokeWidth: 1 }}
            contentStyle={{
              background: "#1a1a1d",
              border: "1px solid #3a3a41",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
            }}
            itemStyle={{ color: "#edebe4" }}
            labelStyle={{ color: "#8f8f96" }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Portfolio"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3ddc97"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#fillPortfolio)"
            activeDot={{ r: 3, fill: "#3ddc97", stroke: "#0e0e10", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
