export type OpportunityKind = "product" | "workflow" | "market" | "talent";

export type OpportunityUrgency = "monitor" | "active" | "time-sensitive";

export interface Opportunity {
  id: string;
  eventId: string;
  kind: OpportunityKind;
  urgency: OpportunityUrgency;
  title: string;
  upside: string;
  nextStep: string;
  timeframe: string;
}
