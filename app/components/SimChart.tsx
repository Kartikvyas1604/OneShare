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
import { SimulationResult } from "@/app/lib/data";

export function SimChart({ result }: { result: SimulationResult }) {
  const data = result.dates.map((date, i) => ({
    date,
    policy: result.equity[i],
    buyHold: result.buyHold[i],
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPolicy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563ff" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2563ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBuyHold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              background: "#0b1221",
              border: "1px solid #1e293b",
              borderRadius: 12,
              fontSize: 12,
            }}
            itemStyle={{ color: "#f8fafc" }}
            formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="buyHold"
            stroke="#64748b"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorBuyHold)"
            name="Buy & hold"
          />
          <Area
            type="monotone"
            dataKey="policy"
            stroke="#2563ff"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPolicy)"
            name="With policy"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
