export type AppRouteKey =
  | "overview"
  | "ai"
  | "quant"
  | "performance"
  | "alerts"
  | "archive"
  | "settings";

export type SignalLane = "ai" | "quant" | "performance" | "builders";

export type DashboardSectionKey =
  | "top-signals"
  | "first-hand-breaking"
  | "workflows-guides"
  | "opportunities"
  | "builder-radar";

export type RankingStrategy =
  | "composite-signal"
  | "first-hand-velocity"
  | "workflow-value"
  | "opportunity-window"
  | "builder-traction";
