import type { DashboardSectionKey, RankingStrategy } from "./app";
import type { HydratedEvent } from "./event";

export interface Section {
  id: DashboardSectionKey;
  title: string;
  description: string;
  rankStrategy: RankingStrategy;
  href: string;
  eventIds: string[];
}

export interface HydratedSection extends Omit<Section, "eventIds"> {
  events: HydratedEvent[];
}
