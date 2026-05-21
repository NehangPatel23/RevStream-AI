export const kpis = [
  {
    label: "Total Revenue (MTD)",
    value: "$2.4M",
    change: "+12.4% vs Last Month",
    trend: "up",
    icon: "payments",
  },
  {
    label: "Avg Occupancy",
    value: "84.2%",
    change: "+3.1% vs Last Month",
    trend: "up",
    icon: "hotel",
  },
  {
    label: "RevPAR",
    value: "$142.50",
    change: "-1.2% vs Last Month",
    trend: "down",
    icon: "show_chart",
  },
] as const;

export const recommendations = [
  {
    title: "Oceanfront Suite - Weekend Surge",
    property: "Azure Cove Resort",
    dates: "Oct 12 - Oct 14",
    currentPrice: "$450",
    recommendedPrice: "$585",
    confidence: 92,
    primaryDriver: "Local event announcement (Coastal Music Festival) detected.",
    marketContext: "20% surge in neighborhood search velocity over the last 6 hours.",
    competitiveSet: "3 nearby competitors have raised rates by avg 18%.",
  },
] as const;

export const alerts = [
  {
    title: "Demand Spike: Coachella Weekend",
    detail:
      "Unusual search volume detected for Desert Oasis property. Immediate rate review suggested.",
    tone: "red",
    icon: "warning",
  },
  {
    title: "Price Gap: Oceanfront Suite",
    detail:
      "Current rates are 15% below competitive set average for upcoming holiday weekend.",
    tone: "blue",
    icon: "payments",
  },
  {
    title: "Algorithm Update Applied",
    detail:
      "New seasonal weights have been incorporated into the baseline pricing model.",
    tone: "gray",
    icon: "info",
  },
] as const;

export const portfolioSeries = [
  { name: "Mon", revenue: 5.1, occupancy: 72 },
  { name: "Tue", revenue: 5.8, occupancy: 74 },
  { name: "Wed", revenue: 5.4, occupancy: 73 },
  { name: "Thu", revenue: 6.6, occupancy: 77 },
  { name: "Fri", revenue: 7.1, occupancy: 80 },
  { name: "Sat", revenue: 7.8, occupancy: 84 },
  { name: "Sun", revenue: 7.0, occupancy: 81 },
] as const;