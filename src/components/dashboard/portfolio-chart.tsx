"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  name: string;
  actual?: number;
  target?: number;
  revenue?: number;
  occupancy?: number;
};

type PortfolioTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string;
    value?: number;
  }>;
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function PortfolioTooltip({ active, payload, label }: PortfolioTooltipProps) {
  if (!active || !payload?.length) return null;

  const actual =
    payload.find((item) => item.dataKey === "actual")?.value ??
    payload.find((item) => item.dataKey === "revenue")?.value;

  const target = payload.find((item) => item.dataKey === "target")?.value;
  const occupancy = payload.find((item) => item.dataKey === "occupancy")?.value;

  if (typeof actual !== "number") return null;

  const variance =
    typeof target === "number" && target > 0 ? ((actual - target) / target) * 100 : null;

  return (
    <div className="min-w-70 rounded-[14px] border border-[#c3c6d5] bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
      <div className="text-[13px] font-semibold text-[#191c1e]">{label}</div>

      <div className="mt-3 space-y-2 text-[13px]">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-[#434653]">
            <span className="h-0.5 w-4 rounded-full bg-[#003c90]" />
            Actual ADR
          </span>
          <span className="font-semibold text-[#191c1e]">{formatCurrency(actual)}</span>
        </div>

        {typeof target === "number" ? (
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-[#434653]">
              <span className="h-0.5 w-4 rounded-full bg-[#b9bfd0]" />
              Target ADR
            </span>
            <span className="font-semibold text-[#191c1e]">{formatCurrency(target)}</span>
          </div>
        ) : null}

        {variance !== null ? (
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-[#434653]">Variance</span>
            <span className={`font-semibold ${variance >= 0 ? "text-[#1f9d55]" : "text-[#d93025]"}`}>
              {variance >= 0 ? "+" : ""}
              {variance.toFixed(1)}%
            </span>
          </div>
        ) : null}

        {typeof occupancy === "number" ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#434653]">Occupancy</span>
            <span className="font-semibold text-[#191c1e]">{occupancy}%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PortfolioChart({ data }: { data: readonly Point[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  const chartData = useMemo(
    () =>
      data.map((point) => {
        const actual = point.actual ?? point.revenue ?? 0;
        return {
          ...point,
          actual,
          target: point.target ?? Math.max(0, actual - 18),
        };
      }),
    [data]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setIsReady(true);
      }
    };

    measure();

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    });

    observer.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-[300px] w-full min-w-0 overflow-visible">
      {isReady ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={chartData} margin={{ top: 18, right: 24, left: 24, bottom: 34 }}>
            <defs>
              <linearGradient id="portfolioArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#003c90" stopOpacity={0.26} />
                <stop offset="55%" stopColor="#003c90" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#003c90" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#e7ebf0" strokeDasharray="0" vertical={false} />

            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              stroke="#737784"
              interval="preserveStartEnd"
              minTickGap={22}
              tickMargin={12}
              height={42}
              padding={{ left: 18, right: 18 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#737784"
              width={70}
              tickMargin={12}
              tickFormatter={(value) => `$${value}`}
            />

            <Tooltip
              content={<PortfolioTooltip />}
              cursor={{
                stroke: "#003c90",
                strokeOpacity: 0.12,
                strokeWidth: 1,
              }}
              wrapperStyle={{ outline: "none" }}
            />

            <Area
              type="linear"
              dataKey="actual"
              stroke="#003c90"
              strokeWidth={3}
              fill="url(#portfolioArea)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#003c90",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            />

            <Line
              type="linear"
              dataKey="target"
              stroke="#b9bfd0"
              strokeWidth={2.5}
              dot={false}
              strokeDasharray="5 5"
              activeDot={{
                r: 4,
                fill: "#b9bfd0",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}