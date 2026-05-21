import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const properties = [
  {
    id: "mia-772-os",
    name: "Oceanfront Suite",
    city: "Miami Beach",
    region: "Miami Beach",
    status: "Active Listing",
    currentRate: "$425",
    occupancy: "82%",
    revenue: "$14,250",
  },
  {
    id: "sd-104-ac",
    name: "Pacific Loft",
    city: "San Diego",
    region: "Gaslamp Quarter",
    status: "Active Listing",
    currentRate: "$385",
    occupancy: "79%",
    revenue: "$11,820",
  },
  {
    id: "austin-209-bw",
    name: "Downtown Studio",
    city: "Austin",
    region: "Downtown",
    status: "Paused",
    currentRate: "$219",
    occupancy: "68%",
    revenue: "$7,430",
  },
];

export default function PropertiesPage() {
  return (
    <DashboardLayout>
      <section className="flex flex-col gap-3">
        <h1 className="text-[56px] font-bold leading-[1.02] tracking-[-0.03em] text-[#191c1e]">
          Properties
        </h1>
        <p className="text-[16px] leading-6 text-[#434653]">
          Browse your portfolio and open a property to review pricing strategy, competitors,
          calendar demand, and rule settings.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className="rounded-[18px] border border-[#e0e3e5] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition hover:-translate-y-px hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
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
                className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${
                  property.status === "Active Listing"
                    ? "bg-[#d0e1fb] text-[#003c90]"
                    : "bg-[#eceef0] text-[#737784]"
                }`}
              >
                {property.status}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[#e0e3e5] pt-5">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                  Rate
                </div>
                <div className="mt-1 text-[24px] font-bold leading-7 tracking-[-0.03em] text-[#191c1e]">
                  {property.currentRate}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                  Occupancy
                </div>
                <div className="mt-1 text-[24px] font-bold leading-7 tracking-[-0.03em] text-[#191c1e]">
                  {property.occupancy}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653]">
                  Revenue
                </div>
                <div className="mt-1 text-[24px] font-bold leading-7 tracking-[-0.03em] text-[#191c1e]">
                  {property.revenue}
                </div>
              </div>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#003c90]">
              Open property
              <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
            </div>
          </Link>
        ))}
      </section>
    </DashboardLayout>
  );
}