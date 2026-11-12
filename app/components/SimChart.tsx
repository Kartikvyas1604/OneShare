"use client";

import {
  LineChart,
  Line,
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
    <div className="h-64 w-full md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8a8a8a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#8a8a8a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
            contentStyle={{
              background: "#141414",
              border: "1px solid #2e2e2e",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
            }}
            itemStyle={{ color: "#f5f5f5" }}
            labelStyle={{ color: "#8a8a8a" }}
            formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
          />
          <Line
            type="monotone"
            dataKey="buyHold"
            stroke="#5c5c5c"
            strokeWidth={1.5}
            dot={false}
            name="Buy & hold"
          />
          <Line
            type="monotone"
            dataKey="policy"
            stroke="#16c784"
            strokeWidth={2}
            dot={false}
            name="With policy"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
