import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  alerts,
  kpis,
  portfolioSeries,
  recommendations,
} from "@/lib/data/dashboard";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function DashboardPage() {
  const recommendation = recommendations[0];

  return (
    <DashboardLayout>
      <section className="flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#191c1e]">
              Good Morning, Sarah
            </h1>
            <p className="mt-3 text-[16px] leading-6 font-normal text-[#434653]">
              Here is your portfolio performance overview for today.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-semibold tracking-[0.01em] text-[#191c1e]">
            <Icon name="sync" className="text-[18px] text-[#434653]" />
            <span>Last updated: 08:42 AM</span>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="relative rounded-[18px] border border-[#e0e3e5] bg-white px-6 py-5 shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-start justify-between">
              <div className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[#434653]">
                {kpi.label}
              </div>
              <Icon name={kpi.icon} className="text-[22px] text-[#737784]" />
            </div>

            <div className="mt-4 text-[48px] font-bold leading-none tracking-[-0.04em] text-[#191c1e]">
              {kpi.value}
            </div>

            <div
              className={`mt-2 flex items-center gap-2 text-[15px] leading-5.5 ${
                kpi.trend === "down" ? "text-[#ba1a1a]" : "text-[#1d59c1]"
              }`}
            >
              <Icon
                name={kpi.trend === "down" ? "trending_down" : "trending_up"}
                className="text-[17px]"
              />
              <span className="font-medium">{kpi.change}</span>
            </div>

            <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-[18px] bg-[#e6e8ea]">
              <div
                className={`h-full rounded-r-full ${
                  kpi.label === "RevPAR" ? "w-[38%] bg-[#ba1a1a]" : "w-[78%] bg-[#1d59c1]"
                }`}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="grid items-stretch gap-7 xl:grid-cols-[1.45fr_1fr]">
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
              Today's Top Recommendations
            </h2>
          </div>

          <div className="flex h-full flex-col rounded-[18px] border border-[#e0e3e5] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            <div className="border-b border-[#e0e3e5] px-5 py-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-[22px] font-semibold leading-7 tracking-[-0.02em] text-[#191c1e]">
                    {recommendation.title}
                  </div>
                  <div className="mt-2 text-[15px] leading-6.5 text-[#434653]">
                    Property: {recommendation.property} • Dates: {recommendation.dates}
                  </div>
                </div>

                <div className="inline-flex items-center rounded-full border border-[#a6bbdf] bg-[#d0e1fb] px-4 py-2 text-[13px] font-medium text-[#191c1e]">
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#191c1e] text-[12px]">
                    ✓
                  </span>
                  High Confidence ({recommendation.confidence}%)
                </div>
              </div>
            </div>

            <div className="grid flex-1 gap-0 lg:grid-cols-[1.05fr_1fr]">
              <div className="border-b border-[#e0e3e5] px-5 py-8 lg:border-b-0 lg:border-r lg:border-[#e0e3e5]">
                <div className="flex h-full items-center justify-center">
                  <div className="w-full max-w-85">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-5">
                      <div>
                        <div className="text-[13px] uppercase tracking-[0.08em] text-[#434653]">
                          Current Price
                        </div>
                        <div className="mt-1 text-[38px] leading-11 tracking-[-0.04em] text-[#737784] line-through">
                          {recommendation.currentPrice}
                        </div>
                      </div>

                      <div className="pb-2 text-[36px] leading-none text-[#737784]">
                        →
                      </div>

                      <div className="text-right">
                        <div className="text-[13px] uppercase tracking-[0.08em] text-[#1d59c1]">
                          Recommended
                        </div>
                        <div className="mt-1 text-[48px] font-bold leading-12 tracking-tighter text-[#003c90]">
                          {recommendation.recommendedPrice}
                        </div>
                      </div>
                    </div>

                    <div className="mt-7">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e0e3e5]">
                        <div className="h-full w-[74%] rounded-full bg-[#003c90]" />
                      </div>
                      <div className="mt-2 text-center text-[11px] leading-4 text-[#737784]">
                        Demand Capture Probability
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-7">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                  <Icon name="psychology" className="text-[18px] text-[#434653]" />
                  Algorithm Reasoning
                </div>

                <div className="mt-4 rounded-[14px] bg-[#f2f4f6] px-4 py-4 text-[15px] leading-6 text-[#191c1e]">
                  <p>
                    <strong>Primary Driver:</strong> {recommendation.primaryDriver}
                  </p>
                  <p className="mt-2.5">
                    <strong>Market Context:</strong> {recommendation.marketContext}
                  </p>
                  <p className="mt-2.5">
                    <strong>Competitive Set:</strong> {recommendation.competitiveSet}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#e0e3e5] px-5 py-4">
              <button className="h-10 rounded-[10px] border border-[#737784] bg-white px-4 text-[14px] font-medium text-[#191c1e] hover:bg-[#f2f4f6]">
                Review Details
              </button>
              <button className="h-10 rounded-[10px] bg-[#003c90] px-4 text-[14px] font-medium text-white hover:bg-[#0f52ba]">
                <span className="mr-2 inline-flex align-middle">
                  <Icon name="check" className="text-[18px]" />
                </span>
                Accept All
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
              Urgent Alerts
            </h2>
            <button className="text-[15px] font-medium text-[#003c90] hover:underline">
              View All
            </button>
          </div>

          <div className="flex h-full flex-col rounded-[18px] border border-[#e0e3e5] bg-white p-4 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-4">
              {alerts.map((alert) => (
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

                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold leading-5.5 tracking-[-0.01em] text-[#191c1e]">
                        {alert.title}
                      </div>
                      <p className="mt-2 text-[15px] leading-6.5 text-[#434653]">
                        {alert.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="properties" className="pb-4">
        <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#191c1e]">
          Portfolio Snapshot: Revenue Pacing
        </h2>
        <div className="mt-4 rounded-[18px] border border-[#e0e3e5] bg-white p-5 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
          <PortfolioChart data={portfolioSeries} />
        </div>
      </section>
    </DashboardLayout>
  );
}