import type { DashboardSectionKey } from "./app";

export type FeedbackKind =
  | "signal-quality"
  | "ranking"
  | "missed-event"
  | "noise";

export type FeedbackSentiment = "upvote" | "downvote" | "flag" | "note";

export interface UserFeedback {
  id: string;
  createdAt: string;
  kind: FeedbackKind;
  sentiment: FeedbackSentiment;
  sectionId?: DashboardSectionKey;
  eventId?: string;
  notes?: string;
}
