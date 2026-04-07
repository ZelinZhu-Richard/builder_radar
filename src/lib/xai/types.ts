import type { SignalLane } from "@/types";
import type { RawProviderResult, ValidatedProviderResult } from "@/lib/intake/types";

export interface XaiUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  reasoning_tokens?: number;
}

export interface XaiCitation {
  title?: string;
  url?: string;
  text?: string;
}

export interface XaiResponsesApiResponse {
  id?: string;
  model?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: XaiUsage;
  citations?: XaiCitation[];
}

export type XaiProviderResult<TItem> = RawProviderResult<TItem>;

export type XaiPostType = "original" | "repost" | "quote" | "reply";

export interface ValidatedXaiXSearchItem {
  externalId: string | null;
  quotedPostId: string | null;
  repliedToPostId: string | null;
  sharedPostId: string | null;
  parentThreadId: string | null;
  authorHandle: string | null;
  authorName: string | null;
  authorProfileUrl: string | null;
  permalinkUrl: string;
  rawText: string | null;
  publishedAt: string | null;
  postType: XaiPostType;
  linkedUrls: string[];
  laneHints: SignalLane[];
  relevanceNote: string | null;
}

export interface ValidatedXaiWebSearchItem {
  title: string | null;
  url: string;
  domain: string | null;
  sourceName: string | null;
  rawText: string | null;
  publishedAt: string | null;
  linkedUrls: string[];
  laneHints: SignalLane[];
  relevanceNote: string | null;
}

export type ValidatedXaiXSearchResult = ValidatedProviderResult<ValidatedXaiXSearchItem>;
export type ValidatedXaiWebSearchResult = ValidatedProviderResult<ValidatedXaiWebSearchItem>;
