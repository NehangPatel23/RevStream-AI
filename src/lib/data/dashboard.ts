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
  { name: "Oct 1", actual: 12200, target: 14850, occupancy: 74 },
  { name: "Oct 4", actual: 15800, target: 15100, occupancy: 76 },
  { name: "Oct 8", actual: 16700, target: 15950, occupancy: 78 },
  { name: "Oct 11", actual: 15100, target: 16300, occupancy: 79 },
  { name: "Oct 15", actual: 17650, target: 16800, occupancy: 81 },
  { name: "Oct 18", actual: 18100, target: 17250, occupancy: 82 },
  { name: "Oct 22", actual: 18800, target: 17900, occupancy: 84 },
  { name: "Oct 25", actual: 19200, target: 18300, occupancy: 85 },
  { name: "Oct 29", actual: 18750, target: 18850, occupancy: 86 },
  { name: "Nov 1", actual: 17100, target: 19200, occupancy: 87 },
];