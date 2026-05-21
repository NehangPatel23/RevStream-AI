"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

type Point = {
  name: string;
  revenue: number;
  occupancy: number;
};

export function PortfolioChart({ data }: { data: readonly Point[] }) {
  return (
    <div className="h-55 min-h-55 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e0e3e5" strokeDasharray="4 4" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#737784" />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #c3c6d5",
              borderRadius: "12px",
              color: "#191c1e",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#003c90"
            fill="rgba(0, 60, 144, 0.12)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}