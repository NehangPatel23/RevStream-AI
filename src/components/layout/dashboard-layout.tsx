"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileBarChart2,
  Home,
  LayoutGrid,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/use-persistent-state";
import {
  dashboardActivity,
  recommendationInsight,
  shellNotifications,
  type ShellCommand,
} from "@/lib/app-shell";
import { AppCommandPalette } from "@/components/app-shell/app-command-palette";
import { NotificationCenter } from "@/components/app-shell/notification-center";
import { InsightDrawer } from "@/components/insights/insight-drawer";
import { appToast } from "@/lib/toast";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutGrid className="h-5 w-5" /> },
  { label: "Properties", href: "/properties", icon: <Home className="h-5 w-5" /> },
  { label: "Reports", href: "/reports", icon: <FileBarChart2 className="h-5 w-5" /> },
  { label: "Settings", href: "/settings", icon: <Settings className="h-5 w-5" /> },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = usePersistentState("revstream.sidebar.collapsed", false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [notifications, setNotifications] = useState(shellNotifications);

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, [notifications]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    if (href === "/properties") return pathname === "/properties" || pathname.startsWith("/properties/");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const commands: ShellCommand[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Go to dashboard",
        description: "Open the portfolio overview.",
        group: "Navigate",
        keywords: ["home", "overview"],
        shortcut: "G D",
        run: () => router.push("/dashboard"),
      },
      {
        id: "properties",
        label: "Open properties",
        description: "Browse the portfolio list and comparison view.",
        group: "Navigate",
        keywords: ["portfolio", "list"],
        shortcut: "G P",
        run: () => router.push("/properties"),
      },
      {
        id: "property-page",
        label: "Open Oceanfront Suite",
        description: "Jump into the main property detail page.",
        group: "Navigate",
        keywords: ["property", "detail", "miami"],
        run: () => router.push("/properties/mia-772-os"),
      },
      {
        id: "apply",
        label: "Apply recommendation",
        description: "Open the AI explanation and apply the selected recommendation.",
        group: "Actions",
        keywords: ["recommendation", "pricing"],
        run: () => setInsightOpen(true),
      },
      {
        id: "rules",
        label: "View rules",
        description: "Inspect active pricing rules for the selected property.",
        group: "Actions",
        keywords: ["pricing", "rules"],
        run: () => router.push("/properties/mia-772-os?tab=rules"),
      },
      {
        id: "export-pdf",
        label: "Export PDF report",
        description: "Prepare a shareable report export.",
        group: "Export",
        keywords: ["download", "report"],
        run: () => {
          appToast.message({
            title: "Use Export PDF in the page actions",
            description: "The command palette can route you to the export surface.",
          });
          router.push("/dashboard");
        },
      },
      {
        id: "search",
        label: "Search properties",
        description: "Search the portfolio and related actions.",
        group: "Search",
        keywords: ["find", "lookup"],
        shortcut: "Cmd K",
        run: () => router.push("/properties"),
      },
    ],
    [router]
  );

  const markNotificationRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  const dismissAllNotifications = () => setNotifications([]);

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

            {!collapsed ? (
              <div className="pt-0.5">
                <div className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#003c90]">
                  RevStream AI
                </div>
                <div className="text-[12px] font-semibold uppercase tracking-wider text-[#434653]">
                  Enterprise Tier
                </div>
              </div>
            ) : null}
          </div>

          <button
            onClick={() => setCollapsed((value) => !value)}
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#434653] transition hover:bg-[#e0e3e5] focus:outline-none focus:ring-2 focus:ring-[#003c90] focus:ring-offset-2"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
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
                  "group flex items-center gap-3 rounded-[14px] px-4 py-4 transition-colors focus:outline-none focus:ring-2 focus:ring-[#003c90] focus:ring-inset",
                  active ? "bg-[#e0e3e5] text-[#003c90]" : "text-[#54647a] hover:bg-[#e0e3e5]"
                )}
              >
                <span className={cn(active ? "text-[#003c90]" : "text-[#54647a]")}>{item.icon}</span>
                {!collapsed ? (
                  <span className="text-[12px] font-semibold uppercase tracking-wider">
                    {item.label}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {!collapsed ? (
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
                  <div className="mt-2 text-[14px] text-[#1d59c1]">+12.4% vs last month</div>
                </div>
                <span className="material-symbols-outlined text-[26px] text-[#1d59c1]">
                  trending_up
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-18 items-center justify-between border-b border-[#c3c6d5] bg-[#f8fafc] px-6 md:px-8">
          <div className="flex flex-1 items-center gap-3">
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#434653] hover:bg-[#eceef0] md:hidden">
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="relative w-full max-w-120 text-left"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#434653]" />
              <span className="flex h-11 w-full items-center rounded-[10px] border border-[#c3c6d5] bg-white pl-12 pr-16 text-[16px] text-[#737784] outline-none">
                Search properties, markets, or alerts...
              </span>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[#c3c6d5] bg-[#f8fafc] px-2 py-1 text-[11px] font-semibold text-[#434653]">
                Cmd K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInsightOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-full border border-[#c3c6d5] bg-white px-4 text-[14px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6] lg:inline-flex"
            >
              Explain recommendation
            </button>

            <button
              type="button"
              onClick={() => setNotificationOpen(true)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#191c1e] transition hover:bg-[#eceef0]"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount ? (
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ba1a1a]" />
              ) : null}
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-8">
          <div className="mx-auto flex w-full max-w-370 flex-col gap-8">{children}</div>
        </main>
      </div>

      <AppCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        commands={commands}
      />

      <NotificationCenter
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        notifications={notifications}
        onMarkRead={markNotificationRead}
        onDismiss={dismissNotification}
        onDismissAll={dismissAllNotifications}
      />

      <InsightDrawer
        open={insightOpen}
        onOpenChange={setInsightOpen}
        insight={recommendationInsight}
      />
    </div>
  );
}