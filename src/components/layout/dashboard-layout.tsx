"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { CommandPalette, type CommandPaletteAction } from "@/components/app-shell/app-command-palette";
import { NotificationCenter } from "@/components/app-shell/notification-center";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type LayoutNotification = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "critical";
  unread: boolean;
  time: string;
  href?: string;
  actionLabel?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Properties", href: "/properties", icon: "home_work" },
  { label: "Pricing Calendar", href: "/pricing-calendar", icon: "calendar_month" },
  { label: "Market Insights", href: "/market-insights", icon: "monitoring" },
  { label: "Alerts", href: "/alerts", icon: "notifications" },
  { label: "Reports", href: "/reports", icon: "bar_chart" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

const initialNotifications: LayoutNotification[] = [
  {
    id: "notif-1",
    title: "Price gap detected",
    description: "Oceanfront Suite is running below comp set average for the weekend.",
    severity: "critical",
    unread: true,
    time: "2m ago",
    href: "/properties/mia-772-os",
    actionLabel: "Review property",
  },
  {
    id: "notif-2",
    title: "Recommendation updated",
    description: "A new seasonal weighting has been applied to the dashboard recommendation.",
    severity: "info",
    unread: true,
    time: "18m ago",
    href: "/dashboard?panel=explanation",
    actionLabel: "Explain",
  },
  {
    id: "notif-3",
    title: "Export ready",
    description: "Your latest portfolio export is ready to download.",
    severity: "success",
    unread: false,
    time: "1h ago",
    href: "/properties",
    actionLabel: "Open portfolio",
  },
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<LayoutNotification[]>(initialNotifications);

  const isActive = useMemo(() => {
    return (href: string) => {
      if (href === "/dashboard") {
        return pathname === "/dashboard" || pathname === "/";
      }

      if (href === "/properties") {
        return pathname === "/properties" || pathname.startsWith("/properties/");
      }

      return pathname === href || pathname.startsWith(`${href}/`);
    };
  }, [pathname]);

  const commandActions = useMemo<CommandPaletteAction[]>(
    () => [
      {
        id: "nav-dashboard",
        group: "Navigate",
        label: "Go to Dashboard",
        description: "Open the portfolio overview and live activity feed.",
        icon: "dashboard",
        keywords: ["overview", "home", "portfolio"],
        onSelect: () => router.push("/dashboard"),
      },
      {
        id: "nav-properties",
        group: "Navigate",
        label: "Go to Properties",
        description: "Browse the portfolio and compare listings.",
        icon: "home_work",
        keywords: ["portfolio", "listings", "compare"],
        onSelect: () => router.push("/properties"),
      },
      {
        id: "nav-compare",
        group: "Navigate",
        label: "Open compare view",
        description: "Load a ready-made three-property comparison.",
        icon: "compare_arrows",
        keywords: ["compare", "properties", "comparison"],
        onSelect: () => router.push("/properties?compare=mia-772-os,sd-104-ac,nash-441-ks"),
      },
      {
        id: "search-properties",
        group: "Properties",
        label: "Search properties",
        description: "Open the portfolio page and use the property filters.",
        icon: "search",
        keywords: ["search", "properties", "portfolio"],
        onSelect: () => router.push("/properties"),
      },
      {
        id: "property-oceanfront",
        group: "Properties",
        label: "Open Oceanfront Suite",
        description: "Jump to the Miami Beach property detail page.",
        icon: "home_work",
        keywords: ["oceanfront", "miami", "suite"],
        onSelect: () => router.push("/properties/mia-772-os"),
      },
      {
        id: "property-pacific",
        group: "Properties",
        label: "Open Pacific Loft",
        description: "Review the San Diego listing and its pricing signals.",
        icon: "home_work",
        keywords: ["pacific", "loft", "san diego"],
        onSelect: () => router.push("/properties/sd-104-ac"),
      },
      {
        id: "property-downtown",
        group: "Properties",
        label: "Open Downtown Studio",
        description: "Review the Austin listing and its pace.",
        icon: "home_work",
        keywords: ["downtown", "studio", "austin"],
        onSelect: () => router.push("/properties/austin-209-bw"),
      },
      {
        id: "property-music-row",
        group: "Properties",
        label: "Open Music Row Condo",
        description: "Review the Nashville listing and event-driven demand.",
        icon: "home_work",
        keywords: ["music row", "nashville", "condo"],
        onSelect: () => router.push("/properties/nash-441-ks"),
      },
      {
        id: "view-rules",
        group: "Actions",
        label: "View Oceanfront rules",
        description: "Jump straight to the rules tab on the property page.",
        icon: "rule",
        keywords: ["rules", "policy", "automation"],
        onSelect: () => router.push("/properties/mia-772-os?tab=Rules"),
      },
      {
        id: "explain-recommendation",
        group: "Actions",
        label: "Explain recommendation",
        description: "Open the AI pricing drawer for the latest recommendation.",
        icon: "psychology",
        keywords: ["explain", "ai", "recommendation", "pricing"],
        onSelect: () => router.push("/dashboard?panel=explanation"),
      },
      {
        id: "apply-recommendation",
        group: "Actions",
        label: "Apply recommendation",
        description: "Open the confirmation flow for the current recommendation.",
        icon: "bolt",
        keywords: ["apply", "confirm", "recommendation"],
        onSelect: () => router.push("/dashboard?action=apply"),
      },
      {
        id: "export-report",
        group: "Reports",
        label: "Open portfolio export tools",
        description: "Jump to the portfolio page where export controls live.",
        icon: "description",
        keywords: ["export", "report", "csv", "pdf"],
        onSelect: () => {
          appToast.message({
            title: "Opening portfolio export tools",
            description: "Use the export controls on the Properties page to download a report snapshot.",
          });
          router.push("/properties");
        },
      },
    ],
    [router]
  );

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, []);

  useEffect(() => {
    setCommandPaletteOpen(false);
  }, [pathname]);

  const handleMarkRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const handleDismiss = (id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  const handleDismissAll = () => {
    setNotifications([]);
  };

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
            type="button"
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
            const active = isActive(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-[14px] px-4 py-4 transition-colors",
                  active
                    ? "bg-[#e0e3e5] text-[#003c90]"
                    : "text-[#54647a] hover:bg-[#e0e3e5]"
                )}
                style={active ? { borderRight: "4px solid #003c90" } : undefined}
              >
                <Icon
                  name={item.icon}
                  className={cn("text-[22px]", active ? "text-[#003c90]" : "text-[#54647a]")}
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
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#434653] hover:bg-[#eceef0] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex h-11 w-full max-w-120 items-center justify-between rounded-[10px] border border-[#c3c6d5] bg-white px-4 text-left text-[15px] text-[#434653] outline-none transition hover:border-[#003c90] hover:bg-[#fbfcfe] focus:border-[#003c90]"
              aria-haspopup="dialog"
              aria-label="Open command palette"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Search className="h-5 w-5 shrink-0 text-[#434653]" />
                <span className="truncate">Search properties, pages, or actions</span>
              </span>

              <span className="hidden rounded-md border border-[#d9dee4] bg-[#f8fafc] px-2 py-1 text-[12px] font-semibold text-[#434653] sm:inline-flex">
                ⌘K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#191c1e] hover:bg-[#eceef0]"
              aria-label="Open notifications"
            >
              <Icon name="notifications" className="text-[24px]" />
              {notifications.some((item) => item.unread) ? (
                <span className="absolute right-2.75 top-2.75 h-2 w-2 rounded-full bg-[#ba1a1a]" />
              ) : null}
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#191c1e] hover:bg-[#eceef0]"
            >
              <Icon name="account_circle" className="text-[24px]" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-8">
          <div className="mx-auto flex w-full max-w-370 flex-col gap-8">{children}</div>
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        actions={commandActions}
      />

      <NotificationCenter
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications as never}
        onMarkRead={handleMarkRead}
        onDismiss={handleDismiss}
        onDismissAll={handleDismissAll}
      />
    </div>
  );
}