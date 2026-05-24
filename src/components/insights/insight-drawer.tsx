"use client";

import { Drawer } from "@/components/ui/drawer";
import type { InsightPayload } from "@/lib/app-shell";

type InsightDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insight: InsightPayload;
};

export function InsightDrawer({ open, onOpenChange, insight }: InsightDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={insight.title}
      description={insight.subtitle}
    >
      <div className="space-y-6">
        <section className="rounded-[18px] bg-[#f8fafc] p-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
            Confidence
          </div>
          <div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{insight.confidence}</div>
          <p className="mt-2 text-[14px] leading-6 text-[#434653]">{insight.rationale}</p>
        </section>

        {insight.sections.map((section) => (
          <section key={section.title} className="rounded-[18px] border border-[#e0e3e5] p-4">
            <div className="text-[15px] font-semibold text-[#191c1e]">{section.title}</div>
            <p className="mt-1 text-[14px] leading-6 text-[#434653]">{section.summary}</p>
            <ul className="mt-3 space-y-2">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-[14px] leading-6 text-[#434653]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#003c90]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Drawer>
  );
}