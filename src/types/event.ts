import type { DashboardSectionKey, SignalLane } from "./app";
import type { Item } from "./item";
import type { Opportunity } from "./opportunity";
import type { Source } from "./source";

export type EventStatus = "new" | "developing" | "steady";

export interface EventScore {
  signal: number;
  confidence: number;
  urgency: number;
  composite: number;
}

export interface TrustedAmplification {
  sourceId: string;
  itemId: string;
  note: string;
}

export interface Event {
  id: string;
  lane: SignalLane;
  primarySection: DashboardSectionKey;
  title: string;
  summary: string;
  status: EventStatus;
  canonicalSourceId: string;
  primaryItemId: string;
  supportingItemIds: string[];
  trustedAmplification: TrustedAmplification[];
  score: EventScore;
  tags: string[];
  updatedAt: string;
  changedSinceLastCycle: boolean;
  opportunityId?: string;
}

export interface HydratedEvent extends Event {
  canonicalSource: Source;
  primaryItem: Item;
  supportingItems: Item[];
  amplificationSources: Source[];
  opportunity?: Opportunity;
}
