import type { SignalLane } from "./app";

export type SourceKind =
  | "research-lab"
  | "founder"
  | "operator"
  | "publication"
  | "market-data"
  | "maintainer";

export type TrustTier = "primary" | "verified" | "trusted" | "monitor";

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  trustTier: TrustTier;
  href: string;
  handle?: string;
  description: string;
  primaryLane: SignalLane;
}
