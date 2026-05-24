"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { appToast } from "@/lib/toast";
import { Drawer } from "@/components/ui/drawer";
import { DayDetailDrawer } from "@/components/property-detail/day-detail-drawer";

type TabKey = "Overview" | "Calendar" | "Competitors" | "Rules";
type RangeKey = "Last 7 Days" | "Last 14 Days" | "Last 30 Days";
type CalendarDirection = "left" | "right" | "up" | "down";
type ReorderDirection = "up" | "down";

type TrendPoint = {
  label: string;
  actual: number;
  target: number;
  occupancy: number;
  note: string;
  drivers: string[];
  confidence: number;
  compSet: string;
};

type MetricCardData = {
  title: string;
  value: string;
  delta: string;
  tone: "blue" | "red";
  icon: string;
  insight: string;
};

type RuleStatus = "Active" | "Paused";
type RuleItem = {
  id: string;
  name: string;
  description: string;
  status: RuleStatus;
  active: boolean;
};

type RuleForm = {
  name: string;
  description: string;
  active: boolean;
};

type CalendarSeedDay = {
  dayOfMonth: number;
  rate: number;
  occupancy: number;
  hasEvent?: boolean;
  isBooked?: boolean;
};

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

type Competitor = {
  name: string;
  rate: string;
  occupancy: string;
  position: string;
  note: string;
};

type ConfirmAction =
  | { kind: "delete-rule"; ruleId: string }
  | { kind: "apply-recommendation" }
  | null;

const tabs: TabKey[] = ["Overview", "Calendar", "Competitors", "Rules"];
const rangeOptions: RangeKey[] = ["Last 7 Days", "Last 14 Days", "Last 30 Days"];

const metrics: MetricCardData[] = [
  {
    title: "Revenue (MTD)",
    value: "$14,250",
    delta: "+12.4% vs last month",
    tone: "blue",
    icon: "payments",
    insight: "Revenue pacing is ahead of the prior period.",
  },
  {
    title: "Occupancy (MTD)",
    value: "82%",
    delta: "-2.1% vs target (85%)",
    tone: "red",
    icon: "hotel",
    insight: "Weekend fill rate is strong, weekdays are still soft.",
  },
  {
    title: "Avg Daily Rate",
    value: "$425",
    delta: "+5.8% vs compset ($401)",
    tone: "blue",
    icon: "local_offer",
    insight: "ADR is outperforming the competitive set.",
  },
];

const trendData: TrendPoint[] = [
  {
    label: "Oct 1",
    actual: 152,
    target: 148,
    occupancy: 75,
    note: "Early month pickup tracked steadily above baseline.",
    drivers: ["Weekend demand held", "Search volume was steady"],
    confidence: 78,
    compSet: "Comps were close to target with a narrow spread.",
  },
  {
    label: "Oct 4",
    actual: 154,
    target: 149,
    occupancy: 76,
    note: "Small lift came from a stronger midweek conversion rate.",
    drivers: ["Lead-time inquiries improved", "No comp discounting pressure"],
    confidence: 80,
    compSet: "One nearby comp lowered rates slightly.",
  },
  {
    label: "Oct 8",
    actual: 164,
    target: 153,
    occupancy: 78,
    note: "The market started tightening ahead of the event window.",
    drivers: ["Short-lead demand", "Weekend search growth"],
    confidence: 84,
    compSet: "Direct comps began moving up.",
  },
  {
    label: "Oct 11",
    actual: 166,
    target: 156,
    occupancy: 79,
    note: "Rate lift continued without hurting occupancy.",
    drivers: ["Strong booking pace", "Limited supply"],
    confidence: 86,
    compSet: "Two comps now price above current ADR.",
  },
  {
    label: "Oct 15",
    actual: 163,
    target: 159,
    occupancy: 81,
    note: "A brief slowdown kept the recommendation conservative.",
    drivers: ["Lead window widened", "Weekend fill remained healthy"],
    confidence: 82,
    compSet: "Spread across comps remained stable.",
  },
  {
    label: "Oct 18",
    actual: 171,
    target: 161,
    occupancy: 82,
    note: "Booking pace accelerated into the event cluster.",
    drivers: ["Event spillover", "Strong short-stay intent"],
    confidence: 88,
    compSet: "Comp-set lifted rates in tandem.",
  },
  {
    label: "Oct 22",
    actual: 176,
    target: 164,
    occupancy: 84,
    note: "Demand was strong enough to support a premium.",
    drivers: ["High-intent search traffic", "Weekend compression"],
    confidence: 91,
    compSet: "Most comps were already above target.",
  },
  {
    label: "Oct 25",
    actual: 172,
    target: 166,
    occupancy: 85,
    note: "The market stayed firm while occupancy stayed healthy.",
    drivers: ["Weekend demand", "Comp-set stayed elevated"],
    confidence: 89,
    compSet: "No signs of rate resistance yet.",
  },
  {
    label: "Oct 29",
    actual: 182,
    target: 168,
    occupancy: 86,
    note: "Late-month demand spike strengthened pricing power.",
    drivers: ["Event concentration", "Low remaining supply"],
    confidence: 93,
    compSet: "Direct comps were well above baseline.",
  },
  {
    label: "Nov 1",
    actual: 184,
    target: 169,
    occupancy: 87,
    note: "Strong close to the month with healthy conversion.",
    drivers: ["Holiday overlap", "Search velocity remained high"],
    confidence: 94,
    compSet: "The comp-set spread widened further.",
  },
];

const baseRules: RuleItem[] = [
  {
    id: "r1",
    name: "Last Minute Discounting",
    description: "Gradually reduces price by 5% every 12 hours starting 48 hours before arrival.",
    status: "Active",
    active: true,
  },
  {
    id: "r2",
    name: "Weekend Premium",
    description: "Applies a flat 12% multiplier to base rate for Friday and Saturday nights.",
    status: "Active",
    active: true,
  },
  {
    id: "r3",
    name: "Orphan Day Filler",
    description: "Discounts single unbooked days between two bookings by 8% to improve continuity.",
    status: "Paused",
    active: false,
  },
];

const competitors: Competitor[] = [
  {
    name: "Bayfront Loft",
    rate: "$490",
    occupancy: "89%",
    position: "Above you",
    note: "Prized view corridor and high weekend fill.",
  },
  {
    name: "Ocean View Residence",
    rate: "$505",
    occupancy: "86%",
    position: "Above you",
    note: "Strong event-premium behavior on short lead dates.",
  },
  {
    name: "Your Listing",
    rate: "$425",
    occupancy: "82%",
    position: "Current",
    note: "Good pace, but still room for lift on peak nights.",
  },
  {
    name: "South Beach Suite",
    rate: "$408",
    occupancy: "79%",
    position: "Below you",
    note: "Softer comp with some weekday discounting.",
  },
];

const baseCalendarDays: CalendarSeedDay[] = [
  { dayOfMonth: 1, rate: 390, occupancy: 75 },
  { dayOfMonth: 2, rate: 392, occupancy: 76 },
  { dayOfMonth: 3, rate: 398, occupancy: 77 },
  { dayOfMonth: 4, rate: 405, occupancy: 79 },
  { dayOfMonth: 5, rate: 418, occupancy: 84, hasEvent: true },
  { dayOfMonth: 6, rate: 435, occupancy: 87, hasEvent: true },
  { dayOfMonth: 7, rate: 422, occupancy: 83 },
  { dayOfMonth: 8, rate: 398, occupancy: 76 },
  { dayOfMonth: 9, rate: 400, occupancy: 77 },
  { dayOfMonth: 10, rate: 404, occupancy: 78 },
  { dayOfMonth: 11, rate: 408, occupancy: 79 },
  { dayOfMonth: 12, rate: 428, occupancy: 85, hasEvent: true },
  { dayOfMonth: 13, rate: 442, occupancy: 88, hasEvent: true, isBooked: true },
  { dayOfMonth: 14, rate: 430, occupancy: 84, isBooked: true },
  { dayOfMonth: 15, rate: 404, occupancy: 78 },
  { dayOfMonth: 16, rate: 402, occupancy: 77 },
  { dayOfMonth: 17, rate: 409, occupancy: 79 },
  { dayOfMonth: 18, rate: 415, occupancy: 81 },
  { dayOfMonth: 19, rate: 438, occupancy: 86, hasEvent: true },
  { dayOfMonth: 20, rate: 450, occupancy: 89, hasEvent: true },
  { dayOfMonth: 21, rate: 438, occupancy: 85 },
  { dayOfMonth: 22, rate: 410, occupancy: 80, hasEvent: true, isBooked: true },
  { dayOfMonth: 23, rate: 412, occupancy: 81 },
  { dayOfMonth: 24, rate: 418, occupancy: 82, hasEvent: true },
  { dayOfMonth: 25, rate: 424, occupancy: 83 },
  { dayOfMonth: 26, rate: 448, occupancy: 88, isBooked: true },
  { dayOfMonth: 27, rate: 460, occupancy: 90, hasEvent: true },
  { dayOfMonth: 28, rate: 446, occupancy: 86 },
  { dayOfMonth: 29, rate: 418, occupancy: 81 },
  { dayOfMonth: 30, rate: 420, occupancy: 82, hasEvent: true },
  { dayOfMonth: 31, rate: 430, occupancy: 83 },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function parseMonthParam(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(month)) return fallback;
  return new Date(year, month, 1);
}

function parseDateParam(value: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTabParam(value: string | null): TabKey | null {
  return tabs.includes(value as TabKey) ? (value as TabKey) : null;
}

function buildMonthDays(seedDays: CalendarSeedDay[], monthDate: Date, today: Date): CalendarDay[] {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const totalDays = getDaysInMonth(monthDate);
  const todayStart = startOfDay(today);
  const seedByDay = new Map(seedDays.map((item) => [item.dayOfMonth, item]));

  const days: CalendarDay[] = [];

  for (let dayOfMonth = 1; dayOfMonth <= totalDays; dayOfMonth += 1) {
    const fallback =
      seedByDay.get(dayOfMonth) ??
      seedDays[(dayOfMonth - 1) % seedDays.length] ?? {
        dayOfMonth,
        rate: 400,
        occupancy: 80,
      };

    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayOfMonth);
    const weekdayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);

    days.push({
      date,
      dayOfMonth,
      weekdayLabel,
      rate: fallback.rate,
      occupancy: fallback.occupancy,
      hasEvent: fallback.hasEvent,
      isBooked: fallback.isBooked,
      isPast: startOfDay(date) < todayStart,
      isToday: isSameDay(date, todayStart),
    });
  }

  return days;
}

function buildCalendarGrid(days: CalendarDay[]) {
  if (!days.length) return [];
  const firstDay = days[0].date;
  const leadingEmpty = (firstDay.getDay() + 6) % 7;
  const trailingEmpty = (7 - ((leadingEmpty + days.length) % 7)) % 7;
  return [
    ...Array.from({ length: leadingEmpty }, () => null),
    ...days,
    ...Array.from({ length: trailingEmpty }, () => null),
  ] as Array<CalendarDay | null>;
}

function getCalendarVisualState(day: CalendarDay) {
  const isPast = Boolean(day.isPast);

  if (day.isBooked && day.hasEvent) {
    return {
      surface: isPast ? "bg-[#f1f3f5]" : "bg-[#ffe8d6]",
      border: isPast ? "border-[#d9dee4]" : "border-[#f1b889]",
      icon: isPast ? "text-[#9aa3af]" : "text-[#c46b1a]",
      chip: isPast ? "bg-[#e4e7eb] text-[#7a8088]" : "bg-[#ffd4b0] text-[#9c4f0c]",
    };
  }

  if (day.isBooked) {
    return {
      surface: isPast ? "bg-[#f1f3f5]" : "bg-[#e8edff]",
      border: isPast ? "border-[#d9dee4]" : "border-[#aebff7]",
      icon: isPast ? "text-[#9aa3af]" : "text-[#4a67c7]",
      chip: isPast ? "bg-[#e4e7eb] text-[#7a8088]" : "bg-[#d7e1ff] text-[#3451b2]",
    };
  }

  if (day.hasEvent) {
    return {
      surface: isPast ? "bg-[#f1f3f5]" : "bg-[#dff3ea]",
      border: isPast ? "border-[#d9dee4]" : "border-[#8fd0b2]",
      icon: isPast ? "text-[#9aa3af]" : "text-[#27835d]",
      chip: isPast ? "bg-[#e4e7eb] text-[#7a8088]" : "bg-[#cbeadf] text-[#1d6b4a]",
    };
  }

  return {
    surface: isPast ? "bg-[#f1f3f5]" : "bg-white",
    border: isPast ? "border-[#d9dee4]" : "border-[#d6dde8]",
    icon: isPast ? "text-[#9aa3af]" : "text-[#737784]",
    chip: isPast ? "bg-[#e4e7eb] text-[#7a8088]" : "bg-[#f7f9fb] text-[#737784]",
  };
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

function downloadTextFile(filename: string, mimeType: string, contents: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escapeCsv(value: string) {
  if (/[,"\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(rows: string[][]) {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const body = [
    "BT",
    "/F1 15 Tf",
    "72 760 Td",
    `(${escapePdfText(lines[0] ?? "RevStream AI Report")}) Tj`,
    "/F1 11 Tf",
    ...lines.slice(1).flatMap((line) => [`0 -22 Td`, `(${escapePdfText(line)}) Tj`]),
    "ET",
  ].join("\n");

  const pdfParts: string[] = [];
  const offsets: number[] = [0];

  const push = (chunk: string) => {
    pdfParts.push(chunk);
  };

  push("%PDF-1.4\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${body.length} >>\nstream\n${body}\nendstream\nendobj\n`,
  ];

  for (const object of objects) {
    offsets.push(pdfParts.join("").length);
    push(object);
  }

  const xrefStart = pdfParts.join("").length;
  const xref = [
    "xref",
    "0 6",
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    "<< /Size 6 /Root 1 0 R >>",
    "startxref",
    `${xrefStart}`,
    "%%EOF",
  ].join("\n");

  push(xref);
  return pdfParts.join("");
}

function MetricCard({ metric }: { metric: MetricCardData }) {
  return (
    <button
      type="button"
      className="group rounded-[18px] border border-[#e0e3e5] bg-white p-6 text-left shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition hover:-translate-y-px hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#003c90]"
      onClick={() => appToast.message({ title: metric.title, description: metric.insight })}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-[15px] font-semibold uppercase tracking-[0.11em] text-[#434653]">
          {metric.title}
        </div>
        <Icon name={metric.icon} className="text-[22px] text-[#737784]" />
      </div>

      <div className="mt-4 text-[44px] font-bold leading-none tracking-[-0.04em] text-[#191c1e]">
        {metric.value}
      </div>

      <div
        className={cx(
          "mt-2 flex items-center gap-2 text-[15px] leading-5.5",
          metric.tone === "red" ? "text-[#ba1a1a]" : "text-[#1d59c1]"
        )}
      >
        <Icon
          name={metric.tone === "red" ? "trending_down" : "trending_up"}
          className="text-[17px]"
        />
        <span className="font-medium">{metric.delta}</span>
      </div>

      <div className="mt-3 text-[13px] leading-5 text-[#434653]">{metric.insight}</div>
    </button>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const actual = payload.find((item) => item.dataKey === "actual")?.value;
  const target = payload.find((item) => item.dataKey === "target")?.value;

  const percentDelta =
    typeof actual === "number" && typeof target === "number"
      ? (((actual - target) / target) * 100).toFixed(1)
      : null;

  const isIncrease =
    typeof actual === "number" &&
    typeof target === "number" &&
    actual >= target;

  return (
    <div className="min-w-55 rounded-2xl border border-[#e0e3e5] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <div className="text-[14px] font-semibold text-[#191c1e]">
        {label}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="h-0.75 w-5 rounded-full bg-[#003c90]" />
            <span className="text-[14px] font-medium text-[#434653]">
              Actual ADR
            </span>
          </div>

          <span className="text-[14px] font-semibold text-[#191c1e]">
            {typeof actual === "number" ? formatCurrency(actual) : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="h-0.75 w-5 rounded-full border-t-2 border-dashed border-[#b8beca]" />
            <span className="text-[14px] font-medium text-[#434653]">
              Target ADR
            </span>
          </div>

          <span className="text-[14px] font-semibold text-[#191c1e]">
            {typeof target === "number" ? formatCurrency(target) : "—"}
          </span>
        </div>
      </div>

      {percentDelta ? (
        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="text-[14px] font-medium text-[#434653]">
            Variance
          </span>

          <span
            className={`text-[14px] font-semibold ${
              isIncrease ? "text-[#27835d]" : "text-[#ba1a1a]"
            }`}
          >
            {isIncrease ? "+" : ""}
            {percentDelta}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

function TrendChart({
  data,
  rangeLabel,
  onToggleRange,
  onSelectRange,
  isRangeOpen,
  onCloseRange,
  onPointClick,
}: {
  data: TrendPoint[];
  rangeLabel: RangeKey;
  onToggleRange: () => void;
  onSelectRange: (value: RangeKey) => void;
  isRangeOpen: boolean;
  onCloseRange: () => void;
  onPointClick: (point: TrendPoint) => void;
}) {
  const rangeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rangeRef.current && !rangeRef.current.contains(event.target as Node)) {
        onCloseRange();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCloseRange]);

  return (
    <div className="self-start overflow-hidden rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-140 min-w-0">
          <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
            Performance Trends
          </h2>
          <p className="mt-2 text-[15px] leading-6 text-[#434653]">
            Track actual ADR versus target ADR and identify movement over time.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-6 whitespace-nowrap" ref={rangeRef} data-range-dropdown>
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[14px] font-medium text-[#434653]">
            <span className="h-0.5 w-3 shrink-0 border-t-2 border-solid border-[#003c90]" />
            <span>Actual ADR</span>
          </span>

          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[14px] font-medium text-[#434653]">
            <span className="h-0.5 w-3 shrink-0 border-t-2 border-dashed border-[#c3c6d5]" />
            <span>Target ADR</span>
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={onToggleRange}
              className="inline-flex min-w-42.5 items-center justify-between rounded-xl bg-[#f2f4f6] px-4 py-2.5 text-[14px] font-medium text-[#191c1e]"
            >
              <span>{rangeLabel}</span>
              <Icon name="expand_more" className="text-[18px]" />
            </button>

            {isRangeOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                {rangeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onSelectRange(option)}
                    className={`block w-full px-4 py-3 text-left text-[14px] transition hover:bg-[#f2f4f6] ${
                      option === rangeLabel ? "font-semibold text-[#003c90]" : "text-[#191c1e]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 h-75 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 12 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#003c90" stopOpacity={0.28} />
                <stop offset="55%" stopColor="#003c90" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#003c90" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e0e3e5" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              stroke="#737784"
              interval={0}
              minTickGap={8}
              tickMargin={12}
              height={40}
              padding={{ left: 16, right: 16 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#737784"
              width={60}
              tickMargin={10}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="linear"
              dataKey="actual"
              stroke="#003c90"
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              dot={false}
              activeDot={{ r: 4 }}
              onClick={(state: unknown) => {
                const chartState = state as { payload?: TrendPoint };
                if (chartState.payload) onPointClick(chartState.payload);
              }}
            />
            <Line
              type="linear"
              dataKey="target"
              stroke="#c3c6d5"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecommendationDriver({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-[#003c90]">
        <Icon name={icon} className="text-[16px]" />
      </div>
      <div className="text-[14px] leading-5.5 text-[#191c1e]">
        <span className="font-semibold">{title}:</span> {text}
      </div>
    </div>
  );
}

function CalendarLegendItem({
  label,
  swatchClass,
}: {
  label: string;
  swatchClass: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#e0e3e5] bg-white px-3 py-2 text-[13px] text-[#434653]">
      <span className={`h-3 w-3 rounded-sm border ${swatchClass}`} />
      {label}
    </div>
  );
}

function CalendarCell({
  day,
  selected,
  onSelect,
  onNavigate,
}: {
  day: CalendarDay;
  selected: boolean;
  onSelect: (day: CalendarDay) => void;
  onNavigate: (direction: CalendarDirection) => void;
}) {
  const state = getCalendarVisualState(day);

  const selectedBorder = selected
    ? day.isPast
      ? "border-[#c3c6d5] ring-1 ring-[#dfe4ea]"
      : "border-[#003c90] ring-1 ring-[#c3d5f7]"
    : state.border;

  const mutedPast = day.isPast ? "opacity-50 grayscale" : "";

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onNavigate("left");
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onNavigate("right");
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      onNavigate("up");
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onNavigate("down");
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      onKeyDown={handleKeyDown}
      className={`flex h-23 flex-col justify-between rounded-[14px] border px-3 py-3 text-left transition ${state.surface} ${selectedBorder} ${mutedPast}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
          {day.isToday ? "TODAY" : `${day.weekdayLabel} ${day.dayOfMonth}`}
        </div>
        {day.hasEvent ? <Icon name="event" className={`text-[15px] ${state.icon}`} /> : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div
            className={`text-[15px] font-semibold leading-5 ${
              day.isPast ? "text-[#737784]" : "text-[#191c1e]"
            }`}
          >
            {formatCurrency(day.rate)}
          </div>
          <div className="text-[12px] text-[#737784]">{day.occupancy}% occ.</div>
        </div>

        {day.isBooked ? (
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${state.chip}`}>
            Booked
          </span>
        ) : null}
      </div>
    </button>
  );
}

function RuleItemRow({
  rule,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDrop,
  onMove,
  canDrop,
  dragging,
  showDropLine,
}: {
  rule: RuleItem;
  onToggle: (id: string) => void;
  onEdit: (rule: RuleItem) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string, event: ReactDragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragEnter: (id: string) => void;
  onDragOver: (e: ReactDragEvent<HTMLDivElement>) => void;
  onDrop: (id: string) => void;
  onMove: (id: string, direction: ReorderDirection) => void;
  canDrop: boolean;
  dragging: boolean;
  showDropLine: boolean;
}) {
  const handleRowKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onEdit(rule);
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onDelete(rule.id);
    }
    if (event.altKey && event.key === "ArrowUp") {
      event.preventDefault();
      onMove(rule.id, "up");
    }
    if (event.altKey && event.key === "ArrowDown") {
      event.preventDefault();
      onMove(rule.id, "down");
    }
  };

  return (
    <div className="relative">
      <div
        data-rule-card
        tabIndex={0}
        role="group"
        aria-label={`Rule ${rule.name}`}
        draggable
        onDragStart={(event) => {
          onDragStart(rule.id, event);
          event.dataTransfer.effectAllowed = "move";

          const element = event.currentTarget as HTMLDivElement;
          event.dataTransfer.setDragImage(element, element.offsetWidth / 2, element.offsetHeight / 2);
        }}
        onDragEnd={onDragEnd}
        onDragEnter={() => onDragEnter(rule.id)}
        onDragOver={onDragOver}
        onDrop={() => onDrop(rule.id)}
        onKeyDown={handleRowKeyDown}
        className={[
          "group relative rounded-[14px] border border-[#e0e3e5] bg-[#f2f4f6] p-4 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#c3d5f7]",
          "cursor-grab active:cursor-grabbing",
          dragging
            ? "z-20 scale-[1.01] border-[#c3d5f7] shadow-[0_16px_36px_rgba(0,0,0,0.14)] ring-1 ring-[#d0e1fb]"
            : "shadow-none",
          canDrop ? "ring-1 ring-[#d0e1fb]" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-start gap-4">
            <button
              type="button"
              onClick={() => onToggle(rule.id)}
              className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                rule.active ? "bg-[#003c90]" : "bg-[#cbd5e1]"
              }`}
              aria-label={`Toggle ${rule.name}`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white transition ${
                  rule.active ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>

            <div
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/45 text-[#737784] backdrop-blur-[2px]"
              aria-hidden="true"
              title="Drag to reorder"
            >
              <Icon name="drag_indicator" className="text-[10px]" />
            </div>
          </div>

          <div className="min-w-0 flex-1 pr-12">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[15px] font-semibold leading-5.5 tracking-[-0.01em] text-[#191c1e]">
                {rule.name}
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                  rule.status === "Active"
                    ? "bg-[#d0e1fb] text-[#003c90]"
                    : "bg-[#eceef0] text-[#737784]"
                }`}
              >
                {rule.status}
              </span>
            </div>

            <p className="mt-2 text-[14px] leading-5.5 text-[#434653]">{rule.description}</p>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(rule)}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#fff6dd]/70 text-[#c58a1d] opacity-70 backdrop-blur-[2px] transition hover:bg-[#fff1c4] hover:opacity-100"
            aria-label={`Edit ${rule.name}`}
            title="Edit"
          >
            <Icon name="edit" className="text-[7px]" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(rule.id)}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#ffe7e7]/70 text-[#ba1a1a] opacity-70 backdrop-blur-[2px] transition hover:bg-[#ffd6d6] hover:opacity-100"
            aria-label={`Delete ${rule.name}`}
            title="Delete"
          >
            <Icon name="delete" className="text-[7px]" />
          </button>
        </div>

        {showDropLine ? (
          <div className="pointer-events-none absolute -top-2 left-4 right-4 h-0.5 rounded-full bg-[#003c90]" />
        ) : null}
      </div>
    </div>
  );
}

function RuleEditorDrawer({
  open,
  title,
  form,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  form: RuleForm | null;
  onChange: (next: RuleForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!open || !form) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      description="Update the rule name, description, and status."
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#737784] bg-white px-4 py-2 text-[14px] font-medium text-[#191c1e] hover:bg-[#f7f9fb]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-[10px] bg-[#003c90] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#0f52ba]"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
            Rule Name
          </label>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className="mt-2 h-11 w-full rounded-[10px] border border-[#c3c6d5] bg-white px-3 text-[14px] text-[#191c1e] outline-none focus:border-[#003c90]"
            placeholder="Weekend Premium"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            className="mt-2 min-h-27.5 w-full rounded-[10px] border border-[#c3c6d5] bg-white px-3 py-3 text-[14px] text-[#191c1e] outline-none focus:border-[#003c90]"
            placeholder="Describe when this rule should apply..."
          />
        </div>

        <button
          type="button"
          onClick={() => onChange({ ...form, active: !form.active })}
          className="flex items-center gap-3 text-[14px] font-medium text-[#191c1e]"
        >
          <span
            className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition ${
              form.active ? "bg-[#003c90]" : "bg-[#cbd5e1]"
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white transition ${
                form.active ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
          Active
        </button>
      </div>
    </Drawer>
  );
}

function createRecommendationInsight(point: TrendPoint) {
  const trendBeat = point.actual >= point.target ? "above target" : "below target";
  const delta = Math.abs(((point.actual - point.target) / point.target) * 100).toFixed(1);

  return {
    title: `Why ${point.label} moved`,
    subtitle: "Trend point drilldown",
    confidence: `${point.confidence}% confidence`,
    rationale: `${point.label} finished ${trendBeat} and booked at ${point.occupancy}% occupancy.`,
    sections: [
      {
        title: "Demand drivers",
        summary: point.note,
        bullets: point.drivers,
      },
      {
        title: "Comp-set context",
        summary: point.compSet,
        bullets: [
          `Actual vs target moved ${delta}% ${point.actual >= point.target ? "ahead" : "behind"} the plan.`,
          "Nearby rate moves stayed supportive.",
        ],
      },
      {
        title: "Recommendation",
        summary:
          point.actual >= point.target
            ? "This point supports a slightly stronger rate posture."
            : "This point suggests keeping the next lift conservative.",
        bullets: ["Use this as a reference when adjusting the next open nights."],
      },
    ],
  };
}

function buildTrendRows(point: TrendPoint) {
  return [
    ["Metric", "Value"],
    ["Date", point.label],
    ["Actual ADR", String(point.actual)],
    ["Target ADR", String(point.target)],
    ["Occupancy", `${point.occupancy}%`],
    ["Confidence", `${point.confidence}%`],
    ["Note", point.note],
  ];
}

export default function PropertyDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const today = useMemo(() => startOfDay(new Date()), []);
  const initialMonth = parseMonthParam(
    searchParams.get("month"),
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const initialSelectedDate = parseDateParam(searchParams.get("date"));

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>(parseTabParam(searchParams.get("tab")) ?? "Overview");
  const [rules, setRules] = useState<RuleItem[]>(baseRules);
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(initialMonth);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(
    initialSelectedDate ? toIsoDate(initialSelectedDate) : null
  );
  const [rangeLabel, setRangeLabel] = useState<RangeKey>("Last 30 Days");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleForm | null>(null);
  const [selectedTrendPoint, setSelectedTrendPoint] = useState<TrendPoint | null>(null);
  const [trendInsightOpen, setTrendInsightOpen] = useState(false);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const [dropTargetRuleId, setDropTargetRuleId] = useState<string | null>(null);

  const rulesAnchorRef = useRef<HTMLDivElement | null>(null);

  const recommendation = {
    currentRate: "$450",
    suggestedRate: "$510",
    confidenceLabel: "High Confidence (92%)",
    subtitle: "Suggested base rate increase for upcoming weekend.",
    primaryDriver: "Local festival demand and compressed supply.",
    marketContext: "Booking pace is running ahead of the prior 30-day average.",
    competitiveSet: "3 of 5 direct competitors are already blocked or booked.",
  };

  const calendarMonthLabel = useMemo(() => formatMonthYear(calendarMonthDate), [calendarMonthDate]);

  const selectedMonthDays = useMemo(
    () => buildMonthDays(baseCalendarDays, calendarMonthDate, today),
    [calendarMonthDate, today]
  );

  const calendarGrid = useMemo(() => buildCalendarGrid(selectedMonthDays), [selectedMonthDays]);

  const selectedDate = useMemo(() => {
    if (!selectedDateIso) return null;
    return selectedMonthDays.find((day) => toIsoDate(day.date) === selectedDateIso) ?? null;
  }, [selectedDateIso, selectedMonthDays]);

  const fallbackSelectedDate = useMemo(() => {
    return (
      selectedMonthDays.find((day) => day.isToday) ??
      selectedMonthDays.find((day) => !day.isPast) ??
      selectedMonthDays[0] ??
      null
    );
  }, [selectedMonthDays]);

  const activeSelectedDate = selectedDate ?? fallbackSelectedDate;
  const selectedDateContext = activeSelectedDate ? getDateContext(activeSelectedDate) : null;

  const chartData = useMemo(() => {
    if (rangeLabel === "Last 7 Days") return trendData.slice(-4);
    if (rangeLabel === "Last 14 Days") return trendData.slice(-6);
    return trendData;
  }, [rangeLabel]);

  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const nextTab = parseTabParam(searchParams.get("tab")) ?? "Overview";
    const nextMonth = parseMonthParam(
      searchParams.get("month"),
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const nextDate = parseDateParam(searchParams.get("date"));

    setActiveTab(nextTab);
    setCalendarMonthDate(nextMonth);
    setSelectedDateIso(nextDate ? toIsoDate(nextDate) : null);
  }, [searchParamsString, today]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-range-dropdown]")) setRangeOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedDate && fallbackSelectedDate) {
      setSelectedDateIso(toIsoDate(fallbackSelectedDate.date));
    }
  }, [fallbackSelectedDate, selectedDate]);

  const replaceUrl = useCallback(
    (next: { tab?: TabKey; month?: Date; date?: Date | null }) => {
      const params = new URLSearchParams(searchParamsString);

      const tab = next.tab ?? activeTab;
      const month = next.month ?? calendarMonthDate;
      const date = next.date ?? activeSelectedDate?.date ?? null;

      params.set("tab", tab);
      params.set("month", `${month.getFullYear()}-${pad2(month.getMonth() + 1)}`);

      if (date) {
        params.set("date", toIsoDate(date));
      } else {
        params.delete("date");
      }

      const nextQuery = params.toString();
      if (nextQuery === searchParamsString) return;

      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    },
    [activeSelectedDate?.date, activeTab, calendarMonthDate, pathname, router, searchParamsString]
  );

  const openCreateRule = () => {
    setEditingRuleId("new");
    setRuleForm({
      name: "",
      description: "",
      active: true,
    });
  };

  const openEditRule = (rule: RuleItem) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      active: rule.active,
    });
  };

  const closeEditor = () => {
    setEditingRuleId(null);
    setRuleForm(null);
  };

  const saveRule = () => {
    if (!ruleForm) return;

    const cleanedName = ruleForm.name.trim();
    const cleanedDescription = ruleForm.description.trim();

    if (!cleanedName || !cleanedDescription) {
      appToast.error({
        title: "Missing information",
        description: "Please add both a rule name and description.",
      });
      return;
    }

    const nextRule: RuleItem = {
      id: editingRuleId === "new" ? `rule-${Date.now()}` : editingRuleId ?? `rule-${Date.now()}`,
      name: cleanedName,
      description: cleanedDescription,
      active: ruleForm.active,
      status: ruleForm.active ? "Active" : "Paused",
    };

    setRules((current) => {
      if (editingRuleId === "new" || !editingRuleId) return [nextRule, ...current];
      return current.map((rule) => (rule.id === editingRuleId ? nextRule : rule));
    });

    appToast.success({
      title: "Rule saved",
      description: cleanedName,
    });
    closeEditor();
  };

  const deleteRule = (id: string) => {
    const deletedRule = rules.find((rule) => rule.id === id);
    setRules((current) => current.filter((item) => item.id !== id));
    if (editingRuleId === id) closeEditor();
    appToast.success({
      title: "Rule deleted",
      description: deletedRule ? deletedRule.name : undefined,
    });
  };

  const moveRule = (id: string, direction: ReorderDirection) => {
    setRules((current) => {
      const index = current.findIndex((rule) => rule.id === id);
      if (index === -1) return current;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });

    appToast.message({
      title: direction === "up" ? "Rule moved up" : "Rule moved down",
    });
  };

  const reorderRules = useCallback((sourceId: string, targetId: string) => {
    if (!sourceId || sourceId === targetId) return;

    setRules((current) => {
      const sourceIndex = current.findIndex((rule) => rule.id === sourceId);
      const targetIndex = current.findIndex((rule) => rule.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return current;

      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(adjustedTargetIndex, 0, moved);
      return next;
    });

    setDropTargetRuleId(null);
  }, []);

  const onViewRuleHierarchy = () => {
    setActiveTab("Rules");
    replaceUrl({ tab: "Rules" });
    requestAnimationFrame(() => {
      rulesAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openDeleteConfirm = (ruleId: string) => {
    setConfirmAction({ kind: "delete-rule", ruleId });
  };

  const openApplyConfirm = () => {
    setConfirmAction({ kind: "apply-recommendation" });
  };

  const confirmModalCopy = useMemo(() => {
    if (!confirmAction) return null;

    if (confirmAction.kind === "delete-rule") {
      return {
        title: "Delete Rule?",
        description:
          "This will permanently remove the rule from the hierarchy. This action cannot be undone.",
        confirmLabel: "Delete Rule",
        danger: true,
      };
    }

    return {
      title: "Apply Recommendation?",
      description:
        "This will update the suggested pricing strategy for the selected property and dates.",
      confirmLabel: "Apply Recommendation",
      danger: false,
    };
  }, [confirmAction]);

  const confirmActionHandler = () => {
    if (!confirmAction) return;

    if (confirmAction.kind === "delete-rule") {
      deleteRule(confirmAction.ruleId);
    }

    if (confirmAction.kind === "apply-recommendation") {
      setIsApplied(true);
      appToast.success({
        title: "Recommendation applied",
      });
    }

    setConfirmAction(null);
  };

  const updateSelectedMonth = (nextMonth: Date) => {
    setCalendarMonthDate(nextMonth);
    const nextDefault = buildMonthDays(baseCalendarDays, nextMonth, today).find((day) => !day.isPast);
    setSelectedDateIso(nextDefault ? toIsoDate(nextDefault.date) : null);
    replaceUrl({ month: nextMonth, date: nextDefault?.date ?? null });
    appToast.message({
      title: `Month changed to ${formatMonthYear(nextMonth)}`,
    });
  };

  const handleCalendarNavigate = useCallback(
    (direction: CalendarDirection) => {
      if (!activeSelectedDate) return;

      const currentIndex = calendarGrid.findIndex(
        (item) => item && isSameDay(item.date, activeSelectedDate.date)
      );
      if (currentIndex === -1) return;

      const step = direction === "left" ? -1 : direction === "right" ? 1 : direction === "up" ? -7 : 7;
      let nextIndex = currentIndex + step;

      while (nextIndex >= 0 && nextIndex < calendarGrid.length && !calendarGrid[nextIndex]) {
        nextIndex += step;
      }

      const next = calendarGrid[nextIndex];
      if (next) {
        setSelectedDateIso(toIsoDate(next.date));
        replaceUrl({ date: next.date });
      }
    },
    [activeSelectedDate, calendarGrid, replaceUrl]
  );

  const handleCalendarSelect = (day: CalendarDay) => {
    setSelectedDateIso(toIsoDate(day.date));
    setSelectedDay(day);
    setDayDrawerOpen(true);
    replaceUrl({ date: day.date });
  };

  const handleExportCsv = () => {
    const point = selectedTrendPoint ?? chartData[chartData.length - 1];
    const csv = buildCsv(buildTrendRows(point));
    downloadTextFile("property-report.csv", "text/csv;charset=utf-8", csv);
    appToast.success({ title: "CSV downloaded" });
  };

  const handleExportPdf = () => {
    const point = selectedTrendPoint ?? chartData[chartData.length - 1];
    const pdf = buildSimplePdf([
      "RevStream AI Property Report",
      "Oceanfront Suite",
      `Generated: ${new Date().toLocaleString()}`,
      `Selected trend point: ${point.label}`,
      `Actual ADR: ${point.actual}`,
      `Target ADR: ${point.target}`,
      `Occupancy: ${point.occupancy}%`,
    ]);
    downloadTextFile("property-report.pdf", "application/pdf", pdf);
    appToast.success({ title: "PDF downloaded" });
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      appToast.success({ title: "Share link copied" });
    } catch {
      appToast.error({ title: "Could not copy share link" });
    }
  };

  const handleDragStart = (ruleId: string, event: ReactDragEvent<HTMLDivElement>) => {
    setDraggingRuleId(ruleId);
    setDropTargetRuleId(ruleId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ruleId);

    const element = event.currentTarget;
    event.dataTransfer.setDragImage(
      element,
      element.offsetWidth / 2,
      element.offsetHeight / 2
    );
  };

  const handleDragEnd = () => {
    setDraggingRuleId(null);
    setDropTargetRuleId(null);
  };

  const handleDragEnter = (ruleId: string) => {
    if (draggingRuleId && ruleId !== draggingRuleId) {
      setDropTargetRuleId(ruleId);
    }
  };

  const handleDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    if (draggingRuleId) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (targetRuleId: string) => {
    if (!draggingRuleId) return;
    reorderRules(draggingRuleId, targetRuleId);
    setDraggingRuleId(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  const selectedTrendInsight = selectedTrendPoint ? createRecommendationInsight(selectedTrendPoint) : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="text-[14px] font-medium text-[#434653]">
          <span>Properties</span>
          <span className="mx-2 text-[#737784]">›</span>
          <span>Miami Beach</span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[56px] font-bold leading-[1.02] tracking-[-0.03em] text-[#191c1e]">
              Oceanfront Suite
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-[#d0e1fb] px-3 py-1 text-[14px] font-semibold text-[#003c90]">
                Active Listing
              </span>
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#434653]">
                <Icon name="location_on" className="text-[18px] text-[#737784]" />
                ID: MIA-772-OS
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyShareLink}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#737784] bg-white px-4 text-[14px] font-medium text-[#191c1e] hover:bg-[#f2f4f6]"
            >
              <Icon name="share" className="text-[18px]" />
              Copy Share Link
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#737784] bg-white px-4 text-[14px] font-medium text-[#191c1e] hover:bg-[#f2f4f6]"
            >
              <Icon name="download" className="text-[18px]" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#737784] bg-white px-4 text-[14px] font-medium text-[#191c1e] hover:bg-[#f2f4f6]"
            >
              <Icon name="picture_as_pdf" className="text-[18px]" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => appToast.message({ title: "Live view opening..." })}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#003c90] px-4 text-[14px] font-medium text-white hover:bg-[#0f52ba]"
            >
              <Icon name="open_in_new" className="text-[18px]" />
              View Live
            </button>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} metric={metric} />
          ))}
        </section>

        <section className="border-b border-[#e0e3e5]">
          <div className="flex gap-8 text-[14px] font-semibold">
            {tabs.map((tab) => {
              const active = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    replaceUrl({ tab });
                  }}
                  className={`relative pb-4 text-left transition ${
                    active ? "text-[#003c90]" : "text-[#434653] hover:text-[#191c1e]"
                  }`}
                >
                  {tab}
                  {active ? (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#003c90]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === "Overview" ? (
          <section className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="space-y-6">
              <TrendChart
                data={chartData}
                rangeLabel={rangeLabel}
                onToggleRange={() => setRangeOpen((v) => !v)}
                onSelectRange={(value) => {
                  setRangeLabel(value);
                  setRangeOpen(false);
                  appToast.message({
                    title: `Trend range set to ${value}`,
                  });
                }}
                isRangeOpen={rangeOpen}
                onCloseRange={() => setRangeOpen(false)}
                onPointClick={(point) => {
                  setSelectedTrendPoint(point);
                  setTrendInsightOpen(true);
                }}
              />

              <div className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
                        Algorithmic Recommendation
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrendPoint(chartData[chartData.length - 1]);
                          setTrendInsightOpen(true);
                        }}
                        className="rounded-full border border-[#c3c6d5] px-3 py-1 text-[13px] font-semibold text-[#003c90] transition hover:bg-[#f2f4f6]"
                      >
                        Why this rate?
                      </button>
                    </div>

                    <p className="mt-2 text-[15px] leading-6 text-[#434653]">
                      {recommendation.subtitle}
                    </p>
                  </div>

                  <div className="lg:ml-auto flex justify-end">
                    <span className="inline-flex items-center justify-center rounded-[10px] border border-[#c3d5f7] bg-[#d0e1fb] px-4 py-3 text-[13px] font-medium leading-none text-[#1d59c1]">
                      <Icon name="verified" className="mr-2 text-[18px] leading-none" />
                      {recommendation.confidenceLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#e0e3e5] pt-6">
                  <div className="grid gap-6 xl:grid-cols-[1fr_280px] xl:items-start">
                    <div>
                      <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                        Primary Drivers
                      </div>

                      <div className="mt-4 space-y-4">
                        <RecommendationDriver
                          icon="event"
                          title="Local Festival Detected"
                          text='"Art Deco Weekend" identified on Oct 24-26. Expected influx of high-intent travelers.'
                        />
                        <RecommendationDriver
                          icon="speed"
                          title="Elevated Booking Pace"
                          text="Compset properties are booking 22% faster than the historical 30-day average for this timeframe."
                        />
                        <RecommendationDriver
                          icon="inventory_2"
                          title="Constrained Supply"
                          text="3 of 5 direct competitor suites in the same building are already blocked or booked."
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#eceef0] p-6 text-center">
                      <div className="text-[14px] font-medium text-[#434653]">Suggested Rate</div>

                      <div className="mt-3 text-[44px] font-bold leading-none tracking-tighter text-[#191c1e]">
                        {isApplied ? "$510" : recommendation.suggestedRate}
                      </div>

                      <div
                        className={`mt-4 text-[15px] font-semibold ${
                          Number(recommendation.suggestedRate.replace(/\$/g, "")) >=
                          Number(recommendation.currentRate.replace(/\$/g, ""))
                            ? "text-[#27835d]"
                            : "text-[#ba1a1a]"
                        }`}
                      >
                        {Number(recommendation.suggestedRate.replace(/\$/g, "")) >=
                        Number(recommendation.currentRate.replace(/\$/g, ""))
                          ? `+${Math.round(
                              ((Number(recommendation.suggestedRate.replace(/\$/g, "")) -
                                Number(recommendation.currentRate.replace(/\$/g, ""))) /
                                Number(recommendation.currentRate.replace(/\$/g, ""))) *
                                100
                            )}% from current`
                          : `${Math.round(
                              ((Number(recommendation.suggestedRate.replace(/\$/g, "")) -
                                Number(recommendation.currentRate.replace(/\$/g, ""))) /
                                Number(recommendation.currentRate.replace(/\$/g, ""))) *
                                100
                            )}% from current`}
                      </div>

                      <div className="mt-2 text-[15px] leading-6 font-medium text-[#1d59c1]">
                        {isApplied
                          ? "Applied to selected dates"
                          : `Suggested increase from ${recommendation.currentRate} to ${recommendation.suggestedRate}`}
                      </div>

                      <button
                        type="button"
                        onClick={openApplyConfirm}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-[10px] bg-[#003c90] px-4 py-3 text-[14px] font-medium text-white hover:bg-[#0f52ba]"
                      >
                        Apply Recommendation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref={rulesAnchorRef} className="h-full">
              <div className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
                    Dynamic Rules
                  </h2>

                  <button
                    type="button"
                    onClick={openCreateRule}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#003c90] hover:bg-[#f2f4f6]"
                    aria-label="Add rule"
                  >
                    <Icon name="add" className="text-[22px]" />
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {rules.map((rule) => (
                    <RuleItemRow
                      key={rule.id}
                      rule={rule}
                      onToggle={(id) => {
                        setRules((current) =>
                          current.map((item) =>
                            item.id === id
                              ? {
                                  ...item,
                                  active: !item.active,
                                  status: !item.active ? "Active" : "Paused",
                                }
                              : item
                          )
                        );
                        appToast.message({
                          title: rule.active ? "Rule paused" : "Rule activated",
                        });
                      }}
                      onEdit={openEditRule}
                      onDelete={openDeleteConfirm}
                      onMove={moveRule}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      canDrop={dropTargetRuleId === rule.id && draggingRuleId !== rule.id}
                      dragging={draggingRuleId === rule.id}
                      showDropLine={dropTargetRuleId === rule.id && draggingRuleId !== rule.id}
                    />
                  ))}
                </div>

                <div className="mt-5 rounded-[14px] bg-[#f8fafc] p-4 text-[14px] leading-6 text-[#434653]">
                  Tip: drag the handle to reorder. Enter edits a rule, and Alt+ArrowUp / Alt+ArrowDown still works.
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "Calendar" ? (
          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
            <div className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
                    Pricing Calendar
                  </h2>
                  <p className="mt-2 text-[15px] leading-6 text-[#434653]">
                    Click any date to inspect demand drivers and rate context.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSelectedMonth(addMonths(calendarMonthDate, -1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c3c6d5] text-[#191c1e] transition hover:bg-[#f2f4f6]"
                    aria-label="Previous month"
                  >
                    <Icon name="chevron_left" className="text-[20px]" />
                  </button>
                  <span className="min-w-28 text-center text-[15px] font-semibold text-[#191c1e]">
                    {calendarMonthLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateSelectedMonth(addMonths(calendarMonthDate, 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c3c6d5] text-[#191c1e] transition hover:bg-[#f2f4f6]"
                    aria-label="Next month"
                  >
                    <Icon name="chevron_right" className="text-[20px]" />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <CalendarLegendItem label="Available / No Event" swatchClass="bg-[#ffffff] border-[#d6dde8]" />
                <CalendarLegendItem label="Available / Event" swatchClass="bg-[#dff3ea] border-[#8fd0b2]" />
                <CalendarLegendItem label="Booked / No Event" swatchClass="bg-[#e8edff] border-[#aebff7]" />
                <CalendarLegendItem label="Booked / Event" swatchClass="bg-[#ffe8d6] border-[#f1b889]" />
                <CalendarLegendItem label="Past Date" swatchClass="bg-[#eef2f7] border-[#dfe4ea]" />
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#737784]">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
                  <div key={weekday} className="px-2 py-1">
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarGrid.map((day, index) =>
                  day ? (
                    <CalendarCell
                      key={toIsoDate(day.date)}
                      day={day}
                      selected={selectedDateIso === toIsoDate(day.date)}
                      onSelect={handleCalendarSelect}
                      onNavigate={handleCalendarNavigate}
                    />
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="h-23 rounded-[14px] border border-dashed border-[#eef2f7] bg-[#fafbfc]"
                    />
                  )
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                  Selected Day
                </div>
                {activeSelectedDate && selectedDateContext ? (
                  <>
                    <div className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-[#191c1e]">
                      {formatFullDate(activeSelectedDate.date)}
                    </div>
                    <p className="mt-3 text-[14px] leading-6 text-[#434653]">
                      {selectedDateContext.summary}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <SmallStat label="Rate" value={formatCurrency(activeSelectedDate.rate)} />
                      <SmallStat label="Occupancy" value={`${activeSelectedDate.occupancy}%`} />
                      <SmallStat label="Confidence" value={`${selectedDateContext.confidence}%`} />
                      <SmallStat label="Lead time" value={`${selectedDateContext.leadTimeDays}d`} />
                    </div>

                    <div className="mt-4 rounded-[14px] bg-[#f8fafc] p-4 text-[14px] leading-6 text-[#434653]">
                      {selectedDateContext.action}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDayDrawerOpen(true);
                        setSelectedDay(activeSelectedDate);
                      }}
                      className="mt-4 inline-flex h-10 items-center rounded-full bg-[#003c90] px-4 text-[14px] font-semibold text-white transition hover:opacity-95"
                    >
                      Open day analysis
                    </button>
                  </>
                ) : null}
              </div>

              <div className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                  Booking Pace
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "Next 7 nights are pacing 6% ahead of the prior month.",
                    "The strongest pickup is on event-adjacent dates.",
                    "Weekday fill still needs price support to close gaps.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[14px] bg-[#f8fafc] p-3 text-[14px] leading-6 text-[#434653]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "Competitors" ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {competitors.map((competitor) => (
              <article
                key={competitor.name}
                className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
              >
                <div className="text-[18px] font-semibold text-[#191c1e]">{competitor.name}</div>
                <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                  {competitor.position}
                </div>
                <div className="mt-4 text-[36px] font-bold tracking-[-0.03em] text-[#003c90]">
                  {competitor.rate}
                </div>
                <div className="mt-1 text-[14px] text-[#434653]">{competitor.occupancy} occupancy</div>
                <p className="mt-4 text-[14px] leading-6 text-[#434653]">{competitor.note}</p>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === "Rules" ? (
          <section className="space-y-6">
            <div className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
                    Dynamic Rules
                  </h2>
                  <p className="mt-2 text-[15px] leading-6 text-[#434653]">
                    Keep rules editable, reorderable, and easy to explain.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateRule}
                  className="inline-flex h-10 items-center rounded-full bg-[#003c90] px-4 text-[14px] font-semibold text-white transition hover:opacity-95"
                >
                  Add rule
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {rules.map((rule) => (
                  <RuleItemRow
                    key={rule.id}
                    rule={rule}
                    onToggle={(id) => {
                      setRules((current) =>
                        current.map((item) =>
                          item.id === id
                            ? {
                                ...item,
                                active: !item.active,
                                status: !item.active ? "Active" : "Paused",
                              }
                            : item
                        )
                      );
                      appToast.message({
                        title: rule.active ? "Rule paused" : "Rule activated",
                      });
                    }}
                    onEdit={openEditRule}
                    onDelete={openDeleteConfirm}
                    onMove={moveRule}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    canDrop={dropTargetRuleId === rule.id && draggingRuleId !== rule.id}
                    dragging={draggingRuleId === rule.id}
                    showDropLine={dropTargetRuleId === rule.id && draggingRuleId !== rule.id}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-[14px] bg-[#f8fafc] p-4 text-[14px] leading-6 text-[#434653]">
                Tip: drag the handle to reorder. Enter edits a rule, and Alt+ArrowUp / Alt+ArrowDown still works.
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmAction !== null && confirmModalCopy !== null}
        title={confirmModalCopy?.title ?? ""}
        description={confirmModalCopy?.description ?? ""}
        confirmLabel={confirmModalCopy?.confirmLabel ?? "Confirm"}
        danger={confirmModalCopy?.danger ?? false}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmActionHandler}
      />

      <RuleEditorDrawer
        open={ruleForm !== null}
        title={editingRuleId === "new" ? "Create Rule" : "Edit Rule"}
        form={ruleForm}
        onChange={setRuleForm}
        onClose={closeEditor}
        onSave={saveRule}
      />

      <DayDetailDrawer
        open={dayDrawerOpen}
        onOpenChange={(open) => setDayDrawerOpen(open)}
        day={selectedDay}
        monthLabel={calendarMonthLabel}
        onApplyRecommendation={() => {
          setDayDrawerOpen(false);
          openApplyConfirm();
        }}
      />

      <Drawer
        open={trendInsightOpen}
        onOpenChange={setTrendInsightOpen}
        title={selectedTrendInsight?.title ?? "Why this point moved"}
        description={selectedTrendInsight?.subtitle}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setTrendInsightOpen(false)}
              className="rounded-full border border-[#c3c6d5] px-4 py-2 text-[14px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedTrendInsight ? (
          <div className="space-y-5">
            <section className="rounded-[18px] bg-[#f8fafc] p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                Confidence
              </div>
              <div className="mt-2 text-[22px] font-semibold text-[#191c1e]">
                {selectedTrendInsight.confidence}
              </div>
              <p className="mt-2 text-[14px] leading-6 text-[#434653]">
                {selectedTrendInsight.rationale}
              </p>
            </section>

            {selectedTrendInsight.sections.map((section) => (
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
        ) : null}
      </Drawer>
    </DashboardLayout>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-[#f8fafc] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#737784]">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold text-[#191c1e]">{value}</div>
    </div>
  );
}