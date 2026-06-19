"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DayMetric } from "@/lib/demo";

export function PerformanceChart({ data }: { data: DayMetric[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(255 107 44)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="rgb(255 107 44)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="spd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(56 189 248)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(56 189 248)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.06)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(139 147 167)" }} tickFormatter={(d) => String(d).slice(5)} minTickGap={28} />
          <YAxis tick={{ fontSize: 11, fill: "rgb(139 147 167)" }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
          <Tooltip
            contentStyle={{ background: "rgb(18 22 32)", border: "1px solid rgb(38 44 58)", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "rgb(139 147 167)" }}
          />
          <Area type="monotone" dataKey="revenue" stroke="rgb(255 107 44)" strokeWidth={2} fill="url(#rev)" name="Revenue" />
          <Area type="monotone" dataKey="spend" stroke="rgb(56 189 248)" strokeWidth={2} fill="url(#spd)" name="Spend" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
