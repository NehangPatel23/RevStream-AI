"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComparisonRow } from "@/lib/app-shell";

type PropertyCompareProps = {
  items: ComparisonRow[];
  onRemove: (id: string) => void;
};

const metrics = [
  { key: "adr", label: "ADR" },
  { key: "occupancy", label: "Occupancy" },
  { key: "pace", label: "Booking pace" },
  { key: "recommendation", label: "Recommendation" },
  { key: "signal", label: "Primary signal" },
] as const;

export function PropertyCompare({ items, onRemove }: PropertyCompareProps) {
  if (!items.length) return null;

  return (
    <div className="rounded-[18px] border border-[#e0e3e5] bg-white p-5 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-[#191c1e]">
            Comparison mode
          </h2>
          <p className="mt-1 text-[14px] text-[#434653]">Compare 2–4 properties side by side.</p>
        </div>
        <span className="rounded-full bg-[#d0e1fb] px-3 py-1 text-[12px] font-semibold text-[#003c90]">
          {items.length} selected
        </span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {items.map((item) => (
          <article key={item.id} className="relative rounded-[18px] border border-[#e0e3e5] p-4">
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f4b8b8] bg-[#fff0f0] text-[#ba1a1a] transition hover:bg-[#ffe3e3] focus:outline-none focus:ring-2 focus:ring-[#ba1a1a] focus:ring-offset-2"
              aria-label={`Remove ${item.name} from compare`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-[15px] font-semibold text-[#191c1e]">{item.name}</div>
            <div className="mt-1 text-[13px] text-[#434653]">{item.region}</div>

            <dl className="mt-4 space-y-3 pr-8">
              {metrics.map((metric) => (
                <div
                  key={metric.key}
                  className="flex items-center justify-between gap-4 border-t border-[#f2f4f6] pt-3 first:border-t-0 first:pt-0"
                >
                  <dt className="text-[13px] font-medium text-[#434653]">{metric.label}</dt>
                  <dd
                    className={cn(
                      "text-[13px] font-semibold text-[#191c1e]",
                      metric.key === "recommendation" ? "text-[#003c90]" : ""
                    )}
                  >
                    {item[metric.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}