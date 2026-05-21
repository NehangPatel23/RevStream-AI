"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Properties", href: "/dashboard#properties", icon: "home_work" },
  { label: "Pricing Calendar", href: "/pricing-calendar", icon: "calendar_month" },
  { label: "Market Insights", href: "/market-insights", icon: "monitoring" },
  { label: "Alerts", href: "/alerts", icon: "notifications" },
  { label: "Reports", href: "/reports", icon: "bar_chart" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("material-symbols-outlined select-none", className)}>
      {name}
    </span>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const activeHref = useMemo(() => {
    if (pathname?.startsWith("/pricing-calendar")) return "/pricing-calendar";
    if (pathname?.startsWith("/market-insights")) return "/market-insights";
    if (pathname?.startsWith("/alerts")) return "/alerts";
    if (pathname?.startsWith("/reports")) return "/reports";
    if (pathname?.startsWith("/settings")) return "/settings";
    return "/dashboard";
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-[#191c1e]">
      <aside
        className={cn(
          "hidden h-screen shrink-0 flex-col border-r border-[#e0e3e5] bg-[#eceef0] transition-all duration-200 md:flex",
          collapsed ? "w-24" : "w-70"
        )}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-8">
          <div className={cn("flex items-start gap-3", collapsed && "justify-center")}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0f52ba] text-white shadow-sm">
              <span className="text-[22px] font-bold leading-none">R</span>
            </div>

            {!collapsed && (
              <div className="pt-0.5">
                <div className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#003c90]">
                  RevStream AI
                </div>
                <div className="text-[12px] font-semibold uppercase tracking-wider text-[#434653]">
                  Enterprise Tier
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed((v) => !v)}
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#434653] hover:bg-[#e0e3e5]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon
              name={collapsed ? "chevron_right" : "chevron_left"}
              className="text-[22px]"
            />
          </button>
        </div>

        <nav className="mt-10 flex flex-1 flex-col gap-1 px-4">
          {navItems.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-[14px] px-4 py-4 transition-colors",
                  isActive
                    ? "bg-[#e0e3e5] text-[#003c90]"
                    : "text-[#54647a] hover:bg-[#e0e3e5]"
                )}
                style={isActive ? { borderRight: "4px solid #003c90" } : undefined}
              >
                <Icon
                  name={item.icon}
                  className={cn(
                    "text-[22px]",
                    isActive ? "text-[#003c90]" : "text-[#54647a]"
                  )}
                />
                {!collapsed && (
                  <span className="text-[12px] font-semibold uppercase tracking-wider">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="border-t border-[#e0e3e5] px-6 py-6">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[#434653]">
                Portfolio Summary
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[28px] font-bold leading-none tracking-[-0.02em] text-[#191c1e]">
                    $2.4M
                  </div>
                  <div className="mt-2 text-[14px] text-[#1d59c1]">
                    +12.4% vs Last Month
                  </div>
                </div>
                <Icon name="trending_up" className="text-[26px] text-[#1d59c1]" />
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-18 items-center justify-between border-b border-[#c3c6d5] bg-[#f8fafc] px-6 md:px-8">
          <div className="flex flex-1 items-center gap-3">
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#434653] hover:bg-[#eceef0] md:hidden">
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative w-full max-w-120">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#434653]" />
              <input
                placeholder="Search properties, markets, or alerts..."
                className="h-11 w-full rounded-[10px] border border-[#c3c6d5] bg-white pl-12 pr-4 text-[16px] text-[#191c1e] outline-none placeholder:text-[#434653] focus:border-[#003c90]"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#191c1e] hover:bg-[#eceef0]">
              <Icon name="notifications" className="text-[24px]" />
              <span className="absolute right-2.75 top-2.75 h-2 w-2 rounded-full bg-[#ba1a1a]" />
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#191c1e] hover:bg-[#eceef0]">
              <Icon name="account_circle" className="text-[24px]" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-8">
          <div className="mx-auto flex w-full max-w-370 flex-col gap-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}