"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { appToast } from "@/lib/toast";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { ExportActions } from "@/components/shared/export-actions";
import { ExplanationPanel, type ExplanationSection } from "@/components/property/explanation-panel";
import {
  alerts as dashboardAlerts,
  kpis as dashboardKpis,
  portfolioSeries,
  recommendations,
} from "@/lib/data/dashboard";

type RangeKey = "7d" | "14d" | "30d";
type ConfirmAction = "apply-recommendation" | "clear-alerts" | null;

const RANGE_OPTIONS: Array<{ label: string; value: RangeKey }> = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 14 Days", value: "14d" },
  { label: "Last 30 Days", value: "30d" },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatRangeLabel(value: RangeKey) {
  return RANGE_OPTIONS.find((option) => option.value === value)?.label ?? "Last 30 Days";
}

function getInitialRange(value: string | null): RangeKey {
  if (value === "7d" || value === "14d" || value === "30d") return value;
  return "30d";
}

function getVisiblePortfolioSeries(range: RangeKey) {
  if (range === "7d") return portfolioSeries.slice(-4);
  if (range === "14d") return portfolioSeries.slice(-6);
  return portfolioSeries;
}

function getRecommendationDelta(currentPrice: string, recommendedPrice: string) {
  return `Suggested increase from ${currentPrice} to ${recommendedPrice}`;
}

function KpiCard({
  kpi,
}: {
  kpi: {
    label: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: string;
  };
}) {
  return (
    <div className="rounded-[18px] border border-[#e0e3e5] bg-white px-6 py-5 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[#434653]">
          {kpi.label}
        </div>
        <Icon name={kpi.icon} className="text-[22px] text-[#737784]" />
      </div>

      <div className="mt-4 text-[44px] font-bold leading-none tracking-[-0.04em] text-[#191c1e]">
        {kpi.value}
      </div>

      <div
        className={cx(
          "mt-2 flex items-center gap-2 text-[15px] leading-5.5",
          kpi.trend === "down" ? "text-[#ba1a1a]" : "text-[#1d59c1]"
        )}
      >
        <Icon
          name={kpi.trend === "down" ? "trending_down" : "trending_up"}
          className="text-[17px]"
        />
        <span className="font-medium">{kpi.change}</span>
      </div>
    </div>
  );
}

function ActivityToneDot({ tone }: { tone: "info" | "success" | "warning" }) {
  const toneClass =
    tone === "success"
      ? "bg-[#1d59c1]"
      : tone === "warning"
        ? "bg-[#ba1a1a]"
        : "bg-[#003c90]";

  return <span className={cx("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", toneClass)} />;
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>(getInitialRange(searchParams.get("range")));
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isRecommendationApplied, setIsRecommendationApplied] = useState(false);
  const [dismissedAlertTitles, setDismissedAlertTitles] = useState<string[]>([]);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const rangeRef = useRef<HTMLDivElement | null>(null);

  const recommendation = recommendations[0];
  const visiblePortfolioSeries = useMemo(() => getVisiblePortfolioSeries(range), [range]);
  const visibleAlerts = useMemo(
    () => dashboardAlerts.filter((alert) => !dismissedAlertTitles.includes(alert.title)),
    [dismissedAlertTitles]
  );

  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const nextRange = getInitialRange(searchParams.get("range"));
    setRange(nextRange);
  }, [searchParamsString]);

  useEffect(() => {
    const action = searchParams.get("action");
    const panel = searchParams.get("panel");

    if (action === "apply") {
      setConfirmAction("apply-recommendation");
    }

    if (panel === "explanation") {
      setExplanationOpen(true);
    }

    if (action || panel) {
      const params = new URLSearchParams(searchParamsString);
      params.delete("action");
      params.delete("panel");

      const nextQuery = params.toString();
      router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`, { scroll: false });
    }
  }, [pathname, router, searchParams, searchParamsString]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (rangeRef.current && !rangeRef.current.contains(target)) {
        setIsRangeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateRangeUrl = useCallback(
    (next: RangeKey) => {
      const params = new URLSearchParams(searchParamsString);
      params.set("range", next);

      const nextQuery = params.toString();
      if (nextQuery !== searchParamsString) {
        router.replace(`${pathname}?${nextQuery}`, { scroll: false });
      }
    },
    [pathname, router, searchParamsString]
  );

  const handleRangeChange = (next: RangeKey) => {
    setRange(next);
    setIsRangeOpen(false);
    updateRangeUrl(next);
    appToast.message({
      title: `Dashboard range set to ${formatRangeLabel(next)}`,
    });
  };

  const openApplyRecommendationConfirm = () => {
    setConfirmAction("apply-recommendation");
  };

  const openClearAlertsConfirm = () => {
    setConfirmAction("clear-alerts");
  };

  const confirmActionCopy = useMemo(() => {
    if (confirmAction === "apply-recommendation") {
      return {
        title: "Apply Recommendation?",
        description:
          "This will apply the suggested pricing direction to the selected property and update the dashboard state.",
        confirmLabel: "Apply Recommendation",
        danger: false,
      };
    }

    if (confirmAction === "clear-alerts") {
      return {
        title: "Clear Alerts?",
        description: "This will dismiss all current alerts from the dashboard view.",
        confirmLabel: "Clear Alerts",
        danger: true,
      };
    }

    return null;
  }, [confirmAction]);

  const handleConfirm = () => {
    if (confirmAction === "apply-recommendation") {
      setIsRecommendationApplied(true);
      appToast.success({
        title: "Recommendation applied",
      });
    }

    if (confirmAction === "clear-alerts") {
      setDismissedAlertTitles(dashboardAlerts.map((alert) => alert.title));
      appToast.success({
        title: "Alerts cleared",
      });
    }

    setConfirmAction(null);
  };

  const handleDismissAlert = (title: string) => {
    setDismissedAlertTitles((current) => [...current, title]);
    appToast.message({
      title: `Dismissed alert: ${title}`,
    });
  };

  const explanationSections: readonly ExplanationSection[] = useMemo(
    () => [
      {
        title: "Local demand",
        summary: "Demand is building faster than the model's neutral baseline around the stay window.",
        bullets: [
          recommendation.primaryDriver,
          "Weekend intent is stronger than weekday demand.",
          "Search traffic is concentrated on the exact date range the rate is targeting.",
        ],
        icon: "travel_explore",
        tone: "blue",
      },
      {
        title: "Booking pace",
        summary: "Booking velocity is ahead of the trailing pace and is tightening faster than expected.",
        bullets: [
          recommendation.marketContext,
          "The on-the-books curve is moving above the prior 30-day average.",
          "Lead time is compressing, which supports a firmer rate while inventory is still available.",
        ],
        icon: "speed",
        tone: "green",
      },
      {
        title: "Competitor behavior",
        summary: "Nearby competitors are already repricing upward and the market is not showing resistance.",
        bullets: [
          recommendation.competitiveSet,
          "The model is staying slightly ahead of the comp set instead of chasing it.",
          "Rate gaps are narrowing, which reduces the risk of being underpriced.",
        ],
        icon: "groups",
        tone: "amber",
      },
      {
        title: "Seasonality",
        summary: "This stay sits in a stronger seasonal window where demand tends to hold a premium.",
        bullets: [
          "Weekend compression typically supports higher ADR in this window.",
          "Shoulder dates are still healthy enough to absorb a measured lift.",
          "The recommendation keeps pricing aggressive without overexposing the calendar.",
        ],
        icon: "calendar_month",
        tone: "blue",
      },
      {
        title: "Event impact",
        summary: "The event window is helping compress supply and pull bookings forward.",
        bullets: [
          recommendation.dates,
          "Event-adjacent nights are likely to carry the highest rate sensitivity.",
          "The strongest uplift is concentrated where remaining inventory is tightest.",
        ],
        icon: "event",
        tone: "red",
      },
    ],
    [recommendation]
  );

  const explanationData = useMemo(
    () => ({
      title: `Why the model recommends ${recommendation.recommendedPrice}`,
      subtitle: `${recommendation.property} • ${recommendation.dates}`,
      summary:
        "The model is lifting the rate because demand is running ahead of pace, the event window is compressing availability, and nearby competitors have already moved upward.",
      confidenceLabel: `${recommendation.confidence}% confidence`,
      currentRate: recommendation.currentPrice,
      recommendedRate: recommendation.recommendedPrice,
      deltaLabel: getRecommendationDelta(recommendation.currentPrice, recommendation.recommendedPrice),
      sections: explanationSections,
    }),
    [explanationSections, recommendation]
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#191c1e]">
              Good Morning, Sarah
            </h1>
            <p className="mt-3 text-[16px] font-normal leading-6 text-[#434653]">
              Here is your portfolio performance overview for today.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-semibold tracking-[0.01em] text-[#191c1e]">
            <Icon name="sync" className="text-[18px] text-[#434653]" />
            <span>Last updated: 08:42 AM</span>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          {dashboardKpis.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} />
          ))}
        </section>

        <section className="grid items-stretch gap-7 xl:grid-cols-[1.45fr_1fr]">
          <div className="flex h-full flex-col rounded-[18px] border border-[#e0e3e5] bg-white p-5 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
                  Performance Trends
                </h2>
                <p className="mt-2 text-[15px] leading-6 text-[#434653]">
                  Track actual ADR versus target ADR and identify movement over time.
                </p>
              </div>

              <div className="flex items-center gap-4 text-[14px] font-medium text-[#434653]">
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-3 border-t-2 border-solid border-[#003c90]" />
                  Actual ADR
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-3 border-t-2 border-dashed border-[#c3c6d5]" />
                  Target ADR
                </span>

                <div ref={rangeRef} className="relative z-20" data-range-dropdown>
                  <button
                    type="button"
                    onClick={() => setIsRangeOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-[#f2f4f6] px-4 py-2 text-[14px] text-[#191c1e]"
                    aria-expanded={isRangeOpen}
                    aria-haspopup="menu"
                  >
                    {formatRangeLabel(range)}
                    <Icon name="expand_more" className="text-[18px]" />
                  </button>

                  {isRangeOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    >
                      {RANGE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="menuitem"
                          onClick={() => handleRangeChange(option.value)}
                          className={cx(
                            "block w-full px-4 py-3 text-left text-[14px] transition hover:bg-[#f2f4f6]",
                            option.value === range ? "font-semibold text-[#003c90]" : "text-[#191c1e]"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 h-115 min-w-0">
              <PortfolioChart data={visiblePortfolioSeries} />
            </div>
          </div>

          <div className="flex h-full flex-col rounded-[18px] border border-[#e0e3e5] bg-white p-5 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
                Urgent Alerts
              </h2>
              <button
                type="button"
                onClick={openClearAlertsConfirm}
                className="text-[15px] font-medium text-[#003c90] hover:underline"
              >
                Clear all
              </button>
            </div>

            <div className="mt-5 flex flex-1 flex-col gap-4">
              {visibleAlerts.length ? (
                visibleAlerts.map((alert) => (
                  <div
                    key={alert.title}
                    className="rounded-[14px] bg-[#f2f4f6] px-5 py-5"
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftStyle: "solid",
                      borderLeftColor:
                        alert.tone === "red"
                          ? "#ba1a1a"
                          : alert.tone === "blue"
                            ? "#1d59c1"
                            : "#737784",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 shrink-0"
                        style={{
                          color:
                            alert.tone === "red"
                              ? "#ba1a1a"
                              : alert.tone === "blue"
                                ? "#1d59c1"
                                : "#737784",
                        }}
                      >
                        <Icon name={alert.icon} className="text-[20px]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold leading-5.5 tracking-[-0.01em] text-[#191c1e]">
                          {alert.title}
                        </div>
                        <p className="mt-2 text-[15px] leading-6.5 text-[#434653]">
                          {alert.detail}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDismissAlert(alert.title)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#737784] hover:bg-white/70 hover:text-[#191c1e]"
                        aria-label={`Dismiss ${alert.title}`}
                      >
                        <Icon name="close" className="text-[18px]" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#e0e3e5] bg-[#fafbfc] px-6 py-10 text-center">
                  <div className="text-[16px] font-semibold text-[#191c1e]">No active alerts</div>
                  <p className="mt-2 text-[14px] leading-5.5 text-[#434653]">
                    Everything is stable right now. New signals will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="self-start rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
                    Algorithmic Recommendation
                  </h2>
                  <button
                    type="button"
                    onClick={() => setExplanationOpen(true)}
                    className="inline-flex h-9 items-center rounded-full border border-[#c3c6d5] px-3 text-[13px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
                  >
                    Why this recommendation?
                  </button>
                </div>

                <p className="mt-2 text-[15px] leading-6 text-[#434653]">
                  {recommendation.title}
                </p>
              </div>

              <div className="lg:ml-auto">
                <span className="relative top-0.5 inline-flex items-center justify-center rounded-[10px] border border-[#c3d5f7] bg-[#d0e1fb] px-4 py-3 text-[13px] font-medium leading-none text-[#1d59c1]">
                  <Icon name="verified" className="mr-2 text-[18px] leading-none" />
                  {recommendation.confidence}% Confidence
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
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d0e1fb] text-[#003c90]">
                        <Icon name="event" className="text-[16px]" />
                      </div>
                      <div className="text-[14px] leading-5.5 text-[#191c1e]">
                        <span className="font-semibold">Local Event:</span> {recommendation.primaryDriver}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d0e1fb] text-[#003c90]">
                        <Icon name="speed" className="text-[16px]" />
                      </div>
                      <div className="text-[14px] leading-5.5 text-[#191c1e]">
                        <span className="font-semibold">Market Context:</span> {recommendation.marketContext}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d0e1fb] text-[#003c90]">
                        <Icon name="inventory_2" className="text-[16px]" />
                      </div>
                      <div className="text-[14px] leading-5.5 text-[#191c1e]">
                        <span className="font-semibold">Competitive Set:</span> {recommendation.competitiveSet}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#eceef0] p-6 text-center">
                  <div className="text-[14px] font-medium text-[#434653]">Suggested Rate</div>
                  <div className="mt-2 text-[44px] font-bold leading-none tracking-tighter text-[#191c1e]">
                    {isRecommendationApplied ? "$510" : recommendation.recommendedPrice}
                  </div>
                  <div className="mt-2 text-[15px] font-medium text-[#1d59c1]">
                    {isRecommendationApplied ? "Applied to selected dates" : getRecommendationDelta(recommendation.currentPrice, recommendation.recommendedPrice)}
                  </div>

                  <button
                    type="button"
                    onClick={openApplyRecommendationConfirm}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-[10px] bg-[#003c90] px-4 py-3 text-[14px] font-medium text-white hover:bg-[#0f52ba]"
                  >
                    Apply Recommendation
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
                Action Center
              </h2>
              <button
                type="button"
                onClick={() => appToast.message({ title: "Action center opened" })}
                className="text-[15px] font-medium text-[#003c90] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={openApplyRecommendationConfirm}
                className="w-full rounded-[10px] bg-[#003c90] px-4 py-3 text-[14px] font-medium text-white hover:bg-[#0f52ba]"
              >
                {isRecommendationApplied ? "Recommendation Applied" : "Review and Apply"}
              </button>

              <button
                type="button"
                onClick={() => appToast.message({ title: "Opening portfolio report" })}
                className="w-full rounded-[10px] border border-[#737784] bg-white px-4 py-3 text-[14px] font-medium text-[#191c1e] hover:bg-[#f2f4f6]"
              >
                Open Portfolio Report
              </button>

              <button
                type="button"
                onClick={() => appToast.message({ title: "Export started" })}
                className="w-full rounded-[10px] border border-[#737784] bg-white px-4 py-3 text-[14px] font-medium text-[#191c1e] hover:bg-[#f2f4f6]"
              >
                Export Summary
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmAction !== null && confirmActionCopy !== null}
        title={confirmActionCopy?.title ?? ""}
        description={confirmActionCopy?.description ?? ""}
        confirmLabel={confirmActionCopy?.confirmLabel ?? "Confirm"}
        danger={confirmActionCopy?.danger ?? false}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />

      <ExplanationPanel
        open={explanationOpen}
        onOpenChange={setExplanationOpen}
        title={explanationData.title}
        subtitle={explanationData.subtitle}
        summary={explanationData.summary}
        confidenceLabel={explanationData.confidenceLabel}
        currentRate={explanationData.currentRate}
        recommendedRate={explanationData.recommendedRate}
        deltaLabel={explanationData.deltaLabel}
        sections={explanationData.sections}
        primaryActionLabel="Apply recommendation"
        onPrimaryAction={() => {
          setExplanationOpen(false);
          openApplyRecommendationConfirm();
        }}
      />
    </DashboardLayout>
  );
}