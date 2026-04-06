import type { AppRouteKey } from "@/types";

export interface RouteMetric {
  label: string;
  value: string;
  detail: string;
}

export interface RouteDefinition {
  key: AppRouteKey;
  label: string;
  shortLabel: string;
  href: string;
  description: string;
}

export const APP_NAME = "Build Radar";

export const ROUTE_GROUPS: Array<{
  label: string;
  items: RouteDefinition[];
}> = [
  {
    label: "Dashboard",
    items: [
      {
        key: "overview",
        label: "Overview",
        shortLabel: "Overview",
        href: "/",
        description: "Cross-lane signal board ranked by composite edge.",
      },
      {
        key: "ai",
        label: "AI",
        shortLabel: "AI",
        href: "/ai",
        description: "Model, tooling, and workflow signals worth immediate attention.",
      },
      {
        key: "quant",
        label: "Quant",
        shortLabel: "Quant",
        href: "/quant",
        description: "Regime shifts, factor moves, and market-linked opportunities.",
      },
      {
        key: "performance",
        label: "Performance",
        shortLabel: "Performance",
        href: "/performance",
        description: "Health, recovery, and personal growth signals with compounding impact.",
      },
    ],
  },
  {
    label: "Ops",
    items: [
      {
        key: "alerts",
        label: "Alerts",
        shortLabel: "Alerts",
        href: "/alerts",
        description: "Escalations, watches, and follow-up tasks across the board.",
      },
      {
        key: "archive",
        label: "Archive",
        shortLabel: "Archive",
        href: "/archive",
        description: "Canonical event history, prior cycles, and diffs.",
      },
      {
        key: "settings",
        label: "Settings",
        shortLabel: "Settings",
        href: "/settings",
        description: "Trust model, ranking weights, delivery rules, and personal filters.",
      },
    ],
  },
];

export const LANE_TABS = ROUTE_GROUPS.flatMap((group) => group.items);

export const ROUTE_META: Record<
  AppRouteKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    metrics: RouteMetric[];
  }
> = {
  overview: {
    eyebrow: "Trust-first dashboard",
    title: "Canonical event board",
    description:
      "High-value signals ranked as events, not isolated posts, with honest no-change states when the board is quiet.",
    metrics: [
      {
        label: "Refresh target",
        value: "2h",
        detail: "Shorter only when a first-hand signal forces a cycle break.",
      },
      {
        label: "Ranking model",
        value: "Event-first",
        detail: "Signal, confidence, and urgency drive the board before engagement does.",
      },
      {
        label: "Coverage",
        value: "AI / Quant / Performance",
        detail: "Plus alerts, archive, and settings for the operating layer.",
      },
    ],
  },
  ai: {
    eyebrow: "Lane",
    title: "AI",
    description:
      "Model, tooling, and builder-adjacent developments that change workflow leverage, distribution, or cost structure.",
    metrics: [
      {
        label: "Focus",
        value: "Builders + infra",
        detail: "Bias toward first-hand releases, guides, and pricing shifts.",
      },
      {
        label: "Ranking",
        value: "Edge > noise",
        detail: "A launch only stays visible if it materially changes what you can do next.",
      },
    ],
  },
  quant: {
    eyebrow: "Lane",
    title: "Quant",
    description:
      "Signals where pricing, breadth, or factor behavior suggest a tactical opening or a regime change worth watching.",
    metrics: [
      {
        label: "Focus",
        value: "Tactical windows",
        detail: "Signals prioritize asymmetric setups over passive commentary.",
      },
      {
        label: "Input mix",
        value: "Letter + tape",
        detail: "Structured notes are grouped with trusted confirmations.",
      },
    ],
  },
  performance: {
    eyebrow: "Lane",
    title: "Performance",
    description:
      "A calm lane by design. If recovery, focus, or growth inputs do not materially change, the product should say so plainly.",
    metrics: [
      {
        label: "Focus",
        value: "Compounding habits",
        detail: "Sleep, training load, focus blocks, and execution quality.",
      },
      {
        label: "Honesty mode",
        value: "No major change",
        detail: "The lane does not manufacture urgency when the signal is flat.",
      },
    ],
  },
  alerts: {
    eyebrow: "Operations",
    title: "Alerts",
    description:
      "Escalations, active watches, and follow-up obligations generated from the ranked event layer.",
    metrics: [
      {
        label: "Priority",
        value: "Actionable only",
        detail: "Alerts should map to a decision, task, or watch state.",
      },
      {
        label: "Noise control",
        value: "Grouped",
        detail: "Duplicate reporting stays under the canonical event that triggered the alert.",
      },
    ],
  },
  archive: {
    eyebrow: "Operations",
    title: "Archive",
    description:
      "Historical event views, old refresh cycles, and diff tools will live here once ingestion and retention are wired.",
    metrics: [
      {
        label: "Status",
        value: "Scaffolded",
        detail: "Navigation and empty-state patterns are ready for future history views.",
      },
    ],
  },
  settings: {
    eyebrow: "Operations",
    title: "Settings",
    description:
      "Trust tiers, ranking rules, and personal delivery controls should remain explicit and adjustable.",
    metrics: [
      {
        label: "Status",
        value: "Structure ready",
        detail: "The page reserves space for source policy, weights, and notification preferences.",
      },
    ],
  },
};
