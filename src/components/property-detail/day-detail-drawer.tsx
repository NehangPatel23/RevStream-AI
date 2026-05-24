"use client";

import { Drawer } from "@/components/ui/drawer";

type CalendarDay = {
  date: Date;
  dayOfMonth: number;
  weekdayLabel: string;
  rate: number;
  occupancy: number;
  hasEvent?: boolean;
  isBooked?: boolean;
  isPast?: boolean;
  isToday?: boolean;
};

type DayDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: CalendarDay | null;
  monthLabel: string;
  onApplyRecommendation?: () => void;
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getDateContext(day: CalendarDay) {
  const leadTimeDays = day.isPast ? 0 : Math.max(0, day.dayOfMonth - 18);
  const confidence = day.isBooked && day.hasEvent ? 92 : day.hasEvent ? 88 : day.isBooked ? 85 : 77;

  if (day.isPast) {
    return {
      summary:
        "Historical day preserved for reference. This date is muted because it is no longer actionable.",
      action:
        "Use it to compare actual occupancy and rate outcomes against nearby upcoming dates.",
      leadTimeDays,
      bookingPaceDelta: "+0%",
      compSetDelta: "+0%",
      confidence,
    };
  }

  if (day.isBooked && day.hasEvent) {
    return {
      summary:
        "Demand is already strong on this date and a live event is layered on top. This is a high-conviction pricing opportunity.",
      action: "Hold or raise rates if nearby comps are also trending upward.",
      leadTimeDays,
      bookingPaceDelta: "+18%",
      compSetDelta: "+11%",
      confidence,
    };
  }

  if (day.isBooked) {
    return {
      summary:
        "This date is already booked. It is a useful signal of demand strength even though no pricing action is needed for the night itself.",
      action: "Watch adjacent open dates for spillover demand.",
      leadTimeDays,
      bookingPaceDelta: "+9%",
      compSetDelta: "+7%",
      confidence,
    };
  }

  if (day.hasEvent) {
    return {
      summary:
        "Open inventory with a strong event signal. This typically supports a more aggressive rate increase.",
      action: "Review nearby open nights for similar uplift opportunities.",
      leadTimeDays,
      bookingPaceDelta: "+14%",
      compSetDelta: "+9%",
      confidence,
    };
  }

  return {
    summary:
      "Open inventory without a major event signal. Keep pricing close to market pace and booking velocity.",
    action: "Follow the compset and monitor booking pace over the next few days.",
    leadTimeDays,
    bookingPaceDelta: "+4%",
    compSetDelta: "+2%",
    confidence,
  };
}

export function DayDetailDrawer({
  open,
  onOpenChange,
  day,
  monthLabel,
  onApplyRecommendation,
}: DayDetailDrawerProps) {
  const context = day ? getDateContext(day) : null;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={day ? `${day.weekdayLabel} ${day.dayOfMonth}` : "Day details"}
      description={day ? `${monthLabel} • ${toIsoDate(day.date)}` : undefined}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-[#c3c6d5] px-4 py-2 text-[14px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
          >
            Close
          </button>
          {onApplyRecommendation ? (
            <button
              type="button"
              onClick={onApplyRecommendation}
              className="rounded-full bg-[#003c90] px-4 py-2 text-[14px] font-semibold text-white transition hover:opacity-95"
            >
              Apply recommendation
            </button>
          ) : null}
        </div>
      }
    >
      {day && context ? (
        <div className="space-y-5">
          <section className="rounded-[18px] bg-[#f8fafc] p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Rate" value={formatCurrency(day.rate)} />
              <Stat label="Occupancy" value={`${day.occupancy}%`} />
              <Stat label="Confidence" value={`${context.confidence}%`} />
              <Stat label="Lead time" value={`${context.leadTimeDays}d`} />
            </div>
          </section>

          <section className="rounded-[18px] border border-[#e0e3e5] p-4">
            <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
              Why this date matters
            </div>
            <p className="mt-2 text-[14px] leading-6 text-[#434653]">{context.summary}</p>
            <p className="mt-3 text-[14px] leading-6 text-[#191c1e]">{context.action}</p>
          </section>

          <section className="rounded-[18px] border border-[#e0e3e5] p-4">
            <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
              Signal breakdown
            </div>
            <div className="mt-3 space-y-3 text-[14px] leading-6 text-[#434653]">
              <Row label="Booking pace" value={context.bookingPaceDelta} />
              <Row label="Comp-set spread" value={context.compSetDelta} />
              <Row label="Date type" value={day.isBooked ? "Booked" : day.hasEvent ? "Event" : "Open"} />
            </div>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#737784]">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold leading-6 text-[#191c1e]">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#f2f4f6] pt-3 first:border-t-0 first:pt-0">
      <span className="font-medium text-[#434653]">{label}</span>
      <span className="font-semibold text-[#191c1e]">{value}</span>
    </div>
  );
}