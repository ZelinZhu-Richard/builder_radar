export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      trusted_accounts: {
        Row: {
          id: string;
          platform: "x";
          external_account_id: string | null;
          handle: string;
          normalized_handle: string;
          display_name: string | null;
          profile_url: string | null;
          source_kind: string;
          trust_tier: string;
          lane_hints: string[];
          topic_tags: string[];
          ingest_priority: number;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform?: "x";
          external_account_id?: string | null;
          handle: string;
          normalized_handle: string;
          display_name?: string | null;
          profile_url?: string | null;
          source_kind: string;
          trust_tier: string;
          lane_hints?: string[];
          topic_tags?: string[];
          ingest_priority?: number;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trusted_accounts"]["Insert"]>;
        Relationships: [];
      };
      intake_runs: {
        Row: {
          id: string;
          run_type: string;
          trigger_source: string;
          status: string;
          refresh_window_start: string | null;
          refresh_window_end: string | null;
          started_at: string;
          finished_at: string | null;
          accounts_considered: number;
          queries_planned: number;
          queries_succeeded: number;
          queries_failed: number;
          raw_items_seen: number;
          raw_items_inserted: number;
          raw_items_updated: number;
          raw_items_deduped: number;
          raw_items_skipped: number;
          error_summary: string | null;
          config_snapshot_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_type: string;
          trigger_source: string;
          status: string;
          refresh_window_start?: string | null;
          refresh_window_end?: string | null;
          started_at?: string;
          finished_at?: string | null;
          accounts_considered?: number;
          queries_planned?: number;
          queries_succeeded?: number;
          queries_failed?: number;
          raw_items_seen?: number;
          raw_items_inserted?: number;
          raw_items_updated?: number;
          raw_items_deduped?: number;
          raw_items_skipped?: number;
          error_summary?: string | null;
          config_snapshot_json?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["intake_runs"]["Insert"]>;
        Relationships: [];
      };
      intake_run_queries: {
        Row: {
          id: string;
          intake_run_id: string;
          query_source: string;
          lane_hint: string | null;
          trusted_account_id: string | null;
          query_text: string;
          provider: string;
          provider_request_id: string | null;
          cursor: string | null;
          status: string;
          started_at: string;
          finished_at: string | null;
          result_count: number;
          inserted_count: number;
          updated_count: number;
          deduped_count: number;
          skipped_count: number;
          error_message: string | null;
          request_payload_json: Json;
          response_summary_json: Json;
        };
        Insert: {
          id?: string;
          intake_run_id: string;
          query_source: string;
          lane_hint?: string | null;
          trusted_account_id?: string | null;
          query_text: string;
          provider?: string;
          provider_request_id?: string | null;
          cursor?: string | null;
          status: string;
          started_at?: string;
          finished_at?: string | null;
          result_count?: number;
          inserted_count?: number;
          updated_count?: number;
          deduped_count?: number;
          skipped_count?: number;
          error_message?: string | null;
          request_payload_json?: Json;
          response_summary_json?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["intake_run_queries"]["Insert"]>;
        Relationships: [];
      };
      raw_items: {
        Row: {
          id: string;
          source_type: string;
          platform: string;
          external_id: string | null;
          dedupe_key: string;
          matched_trusted_account_id: string | null;
          author_handle: string | null;
          author_normalized_handle: string | null;
          author_name: string | null;
          author_url: string | null;
          title: string | null;
          raw_text: string | null;
          normalized_text: string | null;
          raw_url: string;
          normalized_url: string;
          published_at: string | null;
          collected_at: string;
          language_code: string | null;
          lane_hints: string[];
          item_kind_hint: string | null;
          is_from_trusted_account: boolean;
          is_repost: boolean;
          is_quote: boolean;
          is_reply: boolean;
          raw_payload_json: Json;
          metadata_json: Json;
          first_seen_run_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_type: string;
          platform: string;
          external_id?: string | null;
          dedupe_key: string;
          matched_trusted_account_id?: string | null;
          author_handle?: string | null;
          author_normalized_handle?: string | null;
          author_name?: string | null;
          author_url?: string | null;
          title?: string | null;
          raw_text?: string | null;
          normalized_text?: string | null;
          raw_url: string;
          normalized_url: string;
          published_at?: string | null;
          collected_at: string;
          language_code?: string | null;
          lane_hints?: string[];
          item_kind_hint?: string | null;
          is_from_trusted_account?: boolean;
          is_repost?: boolean;
          is_quote?: boolean;
          is_reply?: boolean;
          raw_payload_json?: Json;
          metadata_json?: Json;
          first_seen_run_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["raw_items"]["Insert"]>;
        Relationships: [];
      };
      raw_item_links: {
        Row: {
          id: string;
          raw_item_id: string;
          discovered_via: string;
          link_role: string;
          raw_url: string;
          normalized_url: string;
          domain: string | null;
          title: string | null;
          position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          raw_item_id: string;
          discovered_via: string;
          link_role: string;
          raw_url: string;
          normalized_url: string;
          domain?: string | null;
          title?: string | null;
          position?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["raw_item_links"]["Insert"]>;
        Relationships: [];
      };
      intake_run_items: {
        Row: {
          id: string;
          intake_run_id: string;
          intake_run_query_id: string;
          raw_item_id: string;
          provider_result_rank: number | null;
          persistence_action: string;
          matched_trusted_account_id: string | null;
          notes: string | null;
          observed_at: string;
        };
        Insert: {
          id?: string;
          intake_run_id: string;
          intake_run_query_id: string;
          raw_item_id: string;
          provider_result_rank?: number | null;
          persistence_action: string;
          matched_trusted_account_id?: string | null;
          notes?: string | null;
          observed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["intake_run_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
