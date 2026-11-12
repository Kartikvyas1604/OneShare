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
import type { CrashResult } from "@/app/lib/crash-sim";

const COLORS: Record<string, string> = {
  naive: "#ff6369", // down — naive 100% exposure
  static: "#e8b45a", // pending — floor without de-risk
  derisk: "#3ddc97", // up — the full rule
};

export function CrashChart({ result }: { result: CrashResult }) {
  const data = result.arms[0].path.map((_, step) => ({
    step,
    naive: result.arms[0].path[step],
    static: result.arms[1].path[step],
    derisk: result.arms[2].path[step],
  }));

  return (
    <div className="h-64 w-full md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(237,235,228,0.06)" vertical={false} />
          <XAxis
            dataKey="step"
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
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
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
            labelFormatter={(step) => `Step ${step}`}
            formatter={(value, name) => {
              const arm = result.arms.find((a) => a.key === name);
              return [`$${Number(value).toFixed(2)}`, arm?.label ?? String(name)];
            }}
          />
          <Line
            type="monotone"
            dataKey="naive"
            stroke={COLORS.naive}
            strokeWidth={1.5}
            dot={false}
            name="naive"
          />
          <Line
            type="monotone"
            dataKey="static"
            stroke={COLORS.static}
            strokeWidth={1.5}
            dot={false}
            name="static"
          />
          <Line
            type="monotone"
            dataKey="derisk"
            stroke={COLORS.derisk}
            strokeWidth={2}
            dot={false}
            name="derisk"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
