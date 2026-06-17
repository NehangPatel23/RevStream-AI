"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ExportActions } from "@/components/shared/export-actions";
import { PropertyCompare } from "@/components/shared/property-compare";
import { comparisonRows } from "@/lib/app-shell";
import { cn } from "@/lib/utils";

const properties = [
  {
    id: "mia-772-os",
    name: "Oceanfront Suite",
    city: "Miami Beach",
    region: "Miami Beach",
    status: "Active Listing",
    currentRate: "$425",
    adr: "$425",
    occupancy: "82%",
    pace: "+5.8%",
    recommendation: "+6%",
    signal: "Strong weekend demand",
    revenue: "$14,250",
  },
  {
    id: "sd-104-ac",
    name: "Pacific Loft",
    city: "San Diego",
    region: "Gaslamp Quarter",
    status: "Active Listing",
    currentRate: "$385",
    adr: "$385",
    occupancy: "79%",
    pace: "+3.2%",
    recommendation: "+4%",
    signal: "Healthy lead window",
    revenue: "$11,820",
  },
  {
    id: "austin-209-bw",
    name: "Downtown Studio",
    city: "Austin",
    region: "Downtown",
    status: "Paused",
    currentRate: "$219",
    adr: "$219",
    occupancy: "68%",
    pace: "-1.4%",
    recommendation: "-2%",
    signal: "Needs weekday fill",
    revenue: "$7,430",
  },
  {
    id: "nash-441-ks",
    name: "Music Row Condo",
    city: "Nashville",
    region: "Music Row",
    status: "Active Listing",
    currentRate: "$298",
    adr: "$298",
    occupancy: "74%",
    pace: "+1.8%",
    recommendation: "+3%",
    signal: "Event-driven demand",
    revenue: "$9,610",
  },
];

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
        {label}
      </div>
      <div className="mt-1 text-[24px] font-bold leading-7 tracking-[-0.03em] text-[#191c1e]">
        {value}
      </div>
    </div>
  );
}

function PropertiesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();

  const [isHydrated, setIsHydrated] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [market, setMarket] = useState(searchParams.get("market") ?? "all");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recommendation");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setIsHydrated(true);

    const nextCompare = (searchParams.get("compare") ?? "")
      .split(",")
      .filter(Boolean);

    setCompareIds(nextCompare);
  }, [searchParamsString, searchParams]);

  const updateUrl = (next: { q?: string; market?: string; sort?: string; compare?: string[] }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.q !== undefined) {
      next.q ? params.set("q", next.q) : params.delete("q");
    }

    if (next.market !== undefined) {
      next.market && next.market !== "all"
        ? params.set("market", next.market)
        : params.delete("market");
    }

    if (next.sort !== undefined) {
      next.sort ? params.set("sort", next.sort) : params.delete("sort");
    }

    if (next.compare !== undefined) {
      next.compare.length ? params.set("compare", next.compare.join(",")) : params.delete("compare");
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return [...properties]
      .filter((item) => {
        const matchesQuery =
          !q ||
          [item.name, item.city, item.region, item.signal, item.status]
            .join(" ")
            .toLowerCase()
            .includes(q);

        const matchesMarket = market === "all" || item.city.toLowerCase().includes(market);
        return matchesQuery && matchesMarket;
      })
      .sort((a, b) => {
        if (sort === "occupancy") return Number(b.occupancy) - Number(a.occupancy);
        if (sort === "adr") return Number(b.adr.replace(/\$/g, "")) - Number(a.adr.replace(/\$/g, ""));
        return Number(b.recommendation.replace(/\+|%/g, "")) - Number(a.recommendation.replace(/\+|%/g, ""));
      });
  }, [market, query, sort]);

  const compareItems = useMemo(
    () => comparisonRows.filter((row) => compareIds.includes(row.id)).slice(0, 4),
    [compareIds]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      const exists = current.includes(id);
      const next = exists ? current.filter((item) => item !== id) : [...current, id].slice(0, 4);
      updateUrl({ compare: next });
      return next;
    });
  };

  const removeCompare = (id: string) => {
    setCompareIds((current) => {
      const next = current.filter((item) => item !== id);
      updateUrl({ compare: next });
      return next;
    });
  };

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${pathname}${
    searchParamsString ? `?${searchParamsString}` : ""
  }`;

  return (
    <DashboardLayout>
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[56px] font-bold leading-[1.02] tracking-[-0.03em] text-[#191c1e]">
              Properties
            </h1>
            <p className="mt-3 text-[16px] leading-6 text-[#434653]">
              Browse the portfolio, compare properties, and open a listing for a deeper pricing review.
            </p>
          </div>

          <ExportActions title="Portfolio" shareUrl={shareUrl} />
        </div>

        <div className="grid gap-3 rounded-[18px] border border-[#e0e3e5] bg-white p-4 md:grid-cols-3">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              updateUrl({ q: event.target.value });
            }}
            placeholder="Search properties..."
            className="h-11 rounded-xl border border-[#c3c6d5] px-4 text-[15px] outline-none transition focus:border-[#003c90]"
          />
          <select
            value={market}
            onChange={(event) => {
              setMarket(event.target.value);
              updateUrl({ market: event.target.value });
            }}
            className="h-11 rounded-xl border border-[#c3c6d5] bg-white px-4 text-[15px] outline-none transition focus:border-[#003c90]"
          >
            <option value="all">All markets</option>
            <option value="miami">Miami</option>
            <option value="san">San Diego</option>
            <option value="austin">Austin</option>
            <option value="nashville">Nashville</option>
          </select>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              updateUrl({ sort: event.target.value });
            }}
            className="h-11 rounded-xl border border-[#c3c6d5] bg-white px-4 text-[15px] outline-none transition focus:border-[#003c90]"
          >
            <option value="recommendation">Sort by recommendation</option>
            <option value="occupancy">Sort by occupancy</option>
            <option value="adr">Sort by ADR</option>
          </select>
        </div>
      </section>

      {isHydrated && compareItems.length ? (
        <PropertyCompare items={compareItems} onRemove={removeCompare} />
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((property) => {
          const isSelected = compareIds.includes(property.id);

          return (
            <article
              key={property.id}
              className="group relative rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition hover:-translate-y-px hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[22px] font-semibold leading-7 tracking-[-0.02em] text-[#191c1e]">
                    {property.name}
                  </div>
                  <div className="mt-2 text-[14px] leading-5.5 text-[#434653]">
                    {property.city} • {property.region}
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-[12px] font-semibold",
                    property.status === "Active Listing"
                      ? "bg-[#d0e1fb] text-[#003c90]"
                      : "bg-[#eceef0] text-[#737784]"
                  )}
                >
                  {property.status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[#e0e3e5] pt-5">
                <Metric label="ADR" value={property.adr} />
                <Metric label="Occupancy" value={property.occupancy} />
                <Metric label="Pace" value={property.pace} />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                    Recommendation
                  </div>
                  <div className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#003c90]">
                    {property.recommendation}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCompare(property.id)}
                  className="inline-flex h-9 items-center rounded-full border border-[#c3c6d5] px-3 text-[13px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
                >
                  {isSelected ? "Remove from compare" : "Compare"}
                </button>
              </div>

              <div className="mt-4 rounded-[14px] bg-[#f8fafc] p-3 text-[13px] text-[#434653]">
                {property.signal}
              </div>

              <Link
                href={`/properties/${property.id}`}
                className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#003c90]"
              >
                Open property
                <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
              </Link>
            </article>
          );
        })}
      </section>
    </DashboardLayout>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageSkeleton cardCount={4} showLargePanel={false} showSidePanel={false} />
        </DashboardLayout>
      }
    >
      <PropertiesPageContent />
    </Suspense>
  );
}