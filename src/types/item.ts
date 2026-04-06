import type { SignalLane } from "./app";

export type ItemKind =
  | "post"
  | "article"
  | "release-note"
  | "guide"
  | "market-note"
  | "job-post";

export interface Item {
  id: string;
  sourceId: string;
  kind: ItemKind;
  title: string;
  summary: string;
  href: string;
  publishedAt: string;
  observedAt: string;
  lane: SignalLane;
  eventId?: string;
  isFirstHand: boolean;
}
