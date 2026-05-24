export type ShellCommand = {
  id: string;
  label: string;
  description: string;
  group: "Navigate" | "Actions" | "Export" | "Search";
  keywords?: string[];
  shortcut?: string;
  danger?: boolean;
  run: () => void;
};

export type ShellNotification = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "critical";
  time: string;
  unread: boolean;
  actionLabel?: string;
  href?: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "info" | "success" | "warning";
};

export type InsightSection = {
  title: string;
  summary: string;
  bullets: string[];
};

export type InsightPayload = {
  title: string;
  subtitle: string;
  confidence: string;
  rationale: string;
  sections: InsightSection[];
};

export type ComparisonRow = {
  id: string;
  name: string;
  region: string;
  adr: string;
  occupancy: string;
  pace: string;
  recommendation: string;
  signal: string;
};

export const shellNotifications: ShellNotification[] = [
  {
    id: "n1",
    title: "Weekend uplift triggered",
    description: "Oceanfront Suite lifted after demand strengthened on short lead-time dates.",
    severity: "success",
    time: "4m ago",
    unread: true,
    actionLabel: "Review",
    href: "/properties/mia-772-os",
  },
  {
    id: "n2",
    title: "Event-driven alert",
    description: "A downtown concert is likely to affect booking pace for the next 72 hours.",
    severity: "warning",
    time: "18m ago",
    unread: true,
    actionLabel: "See impact",
    href: "/dashboard?range=14d",
  },
  {
    id: "n3",
    title: "Rule completed",
    description: "Last Minute Discounting refreshed successfully for the selected listing.",
    severity: "info",
    time: "1h ago",
    unread: false,
    actionLabel: "View rule",
    href: "/properties/mia-772-os?tab=rules",
  },
];

export const dashboardActivity: ActivityItem[] = [
  {
    id: "a1",
    title: "Recommendation applied",
    detail: "Oceanfront Suite moved +6% above baseline after pickup strengthened.",
    time: "2 minutes ago",
    tone: "success",
  },
  {
    id: "a2",
    title: "Comp-set shifted",
    detail: "Two nearby listings lowered rates for a midweek gap fill window.",
    time: "14 minutes ago",
    tone: "warning",
  },
  {
    id: "a3",
    title: "Forecast refreshed",
    detail: "Demand forecast updated with stronger weekend confidence.",
    time: "39 minutes ago",
    tone: "info",
  },
];

export const recommendationInsight: InsightPayload = {
  title: "Why this recommendation was made",
  subtitle: "Oceanfront Suite",
  confidence: "High confidence",
  rationale:
    "The recommendation reflects stronger booking pace, supportive comp-set pricing, and a near-term demand spike tied to local events.",
  sections: [
    {
      title: "Local demand",
      summary: "Demand is up around the property’s lead window.",
      bullets: [
        "Weekend search activity is rising faster than the prior 14-day trend.",
        "Short lead-time inquiries are converting above portfolio average.",
      ],
    },
    {
      title: "Booking pace",
      summary: "Pace is ahead of target and the calendar has healthy fill.",
      bullets: [
        "The next 10 open nights are pacing 5.8% ahead of baseline.",
        "Midweek nights remain the best opportunity for incremental lift.",
      ],
    },
    {
      title: "Competitor behavior",
      summary: "Nearby comps have moved up without eroding occupancy.",
      bullets: [
        "Two competitors are now priced above current ADR with stable occupancy.",
        "The comp-set spread still leaves room to lift before resistance appears.",
      ],
    },
    {
      title: "Seasonality and events",
      summary: "Calendar context supports a premium over the next 7 days.",
      bullets: [
        "Seasonality favors stronger weekend rates in this market.",
        "A local event cluster is adding pressure to short-stay inventory.",
      ],
    },
  ],
};

export const comparisonRows: ComparisonRow[] = [
  {
    id: "mia-772-os",
    name: "Oceanfront Suite",
    region: "Miami Beach",
    adr: "$425",
    occupancy: "82%",
    pace: "+5.8%",
    recommendation: "+6%",
    signal: "Strong weekend demand",
  },
  {
    id: "sd-104-ac",
    name: "Pacific Loft",
    region: "San Diego",
    adr: "$385",
    occupancy: "79%",
    pace: "+3.2%",
    recommendation: "+4%",
    signal: "Healthy lead window",
  },
  {
    id: "austin-209-bw",
    name: "Downtown Studio",
    region: "Austin",
    adr: "$219",
    occupancy: "68%",
    pace: "-1.4%",
    recommendation: "-2%",
    signal: "Need fill for weekdays",
  },
  {
    id: "nash-441-ks",
    name: "Music Row Condo",
    region: "Nashville",
    adr: "$298",
    occupancy: "74%",
    pace: "+1.8%",
    recommendation: "+3%",
    signal: "Event-driven demand",
  },
];