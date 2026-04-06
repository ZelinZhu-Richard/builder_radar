create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.trusted_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'x' check (platform in ('x')),
  external_account_id text,
  handle text not null,
  normalized_handle text not null,
  display_name text,
  profile_url text,
  source_kind text not null check (
    source_kind in ('research-lab', 'founder', 'operator', 'publication', 'market-data', 'maintainer')
  ),
  trust_tier text not null check (
    trust_tier in ('primary', 'verified', 'trusted', 'monitor')
  ),
  lane_hints text[] not null default '{}'::text[],
  topic_tags text[] not null default '{}'::text[],
  ingest_priority integer not null default 100,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.intake_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('full', 'x_only', 'web_only', 'manual_replay')),
  trigger_source text not null check (trigger_source in ('cron', 'manual', 'api', 'dev')),
  status text not null check (status in ('running', 'succeeded', 'partial', 'failed')),
  refresh_window_start timestamptz,
  refresh_window_end timestamptz,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  accounts_considered integer not null default 0,
  queries_planned integer not null default 0,
  queries_succeeded integer not null default 0,
  queries_failed integer not null default 0,
  raw_items_seen integer not null default 0,
  raw_items_inserted integer not null default 0,
  raw_items_updated integer not null default 0,
  raw_items_deduped integer not null default 0,
  error_summary text,
  config_snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.raw_items (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('x_post', 'web_result')),
  platform text not null check (platform in ('x', 'web')),
  external_id text,
  dedupe_key text not null,
  matched_trusted_account_id uuid references public.trusted_accounts(id) on delete set null,
  author_handle text,
  author_normalized_handle text,
  author_name text,
  author_url text,
  title text,
  raw_text text,
  normalized_text text,
  raw_url text not null,
  normalized_url text not null,
  published_at timestamptz,
  collected_at timestamptz not null,
  language_code text,
  lane_hints text[] not null default '{}'::text[],
  item_kind_hint text,
  is_from_trusted_account boolean not null default false,
  is_repost boolean not null default false,
  is_quote boolean not null default false,
  is_reply boolean not null default false,
  raw_payload_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  first_seen_run_id uuid references public.intake_runs(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.intake_run_queries (
  id uuid primary key default gen_random_uuid(),
  intake_run_id uuid not null references public.intake_runs(id) on delete cascade,
  query_source text not null check (query_source in ('trusted_account_x', 'x_search', 'web_search')),
  lane_hint text check (lane_hint in ('ai', 'quant', 'performance', 'builders')),
  trusted_account_id uuid references public.trusted_accounts(id) on delete set null,
  query_text text not null,
  provider text not null default 'xai',
  provider_request_id text,
  cursor text,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  result_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  deduped_count integer not null default 0,
  error_message text,
  request_payload_json jsonb not null default '{}'::jsonb,
  response_summary_json jsonb not null default '{}'::jsonb
);

create table if not exists public.raw_item_links (
  id uuid primary key default gen_random_uuid(),
  raw_item_id uuid not null references public.raw_items(id) on delete cascade,
  discovered_via text not null check (discovered_via in ('body', 'provider_field', 'web_result')),
  link_role text not null check (link_role in ('primary', 'evidence', 'citation', 'quote', 'media', 'profile', 'unknown')),
  raw_url text not null,
  normalized_url text not null,
  domain text,
  title text,
  position integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.intake_run_items (
  id uuid primary key default gen_random_uuid(),
  intake_run_id uuid not null references public.intake_runs(id) on delete cascade,
  intake_run_query_id uuid not null references public.intake_run_queries(id) on delete cascade,
  raw_item_id uuid not null references public.raw_items(id) on delete cascade,
  provider_result_rank integer,
  persistence_action text not null check (persistence_action in ('inserted', 'updated', 'unchanged', 'skipped')),
  matched_trusted_account_id uuid references public.trusted_accounts(id) on delete set null,
  notes text,
  observed_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists trusted_accounts_platform_handle_unique
  on public.trusted_accounts (platform, normalized_handle);

create index if not exists trusted_accounts_is_active_idx
  on public.trusted_accounts (is_active);

create index if not exists trusted_accounts_trust_tier_idx
  on public.trusted_accounts (trust_tier);

create index if not exists trusted_accounts_ingest_priority_idx
  on public.trusted_accounts (ingest_priority);

create index if not exists intake_runs_started_at_idx
  on public.intake_runs (started_at desc);

create index if not exists intake_runs_status_idx
  on public.intake_runs (status);

create unique index if not exists raw_items_dedupe_key_unique
  on public.raw_items (dedupe_key);

create unique index if not exists raw_items_platform_external_id_unique
  on public.raw_items (platform, external_id)
  where external_id is not null;

create index if not exists raw_items_matched_trusted_account_idx
  on public.raw_items (matched_trusted_account_id);

create index if not exists raw_items_published_at_idx
  on public.raw_items (published_at desc);

create index if not exists raw_items_collected_at_idx
  on public.raw_items (collected_at desc);

create index if not exists raw_items_lane_hints_idx
  on public.raw_items using gin (lane_hints);

create index if not exists intake_run_queries_run_id_idx
  on public.intake_run_queries (intake_run_id);

create index if not exists intake_run_queries_trusted_account_idx
  on public.intake_run_queries (trusted_account_id);

create index if not exists intake_run_queries_status_idx
  on public.intake_run_queries (status);

create index if not exists raw_item_links_raw_item_idx
  on public.raw_item_links (raw_item_id);

create index if not exists raw_item_links_domain_idx
  on public.raw_item_links (domain);

create unique index if not exists raw_item_links_unique
  on public.raw_item_links (raw_item_id, normalized_url, link_role);

create index if not exists intake_run_items_run_id_idx
  on public.intake_run_items (intake_run_id);

create index if not exists intake_run_items_query_id_idx
  on public.intake_run_items (intake_run_query_id);

create index if not exists intake_run_items_raw_item_idx
  on public.intake_run_items (raw_item_id);

create unique index if not exists intake_run_items_query_raw_item_unique
  on public.intake_run_items (intake_run_query_id, raw_item_id);

drop trigger if exists trusted_accounts_set_updated_at on public.trusted_accounts;
create trigger trusted_accounts_set_updated_at
before update on public.trusted_accounts
for each row
execute function public.set_updated_at();

drop trigger if exists raw_items_set_updated_at on public.raw_items;
create trigger raw_items_set_updated_at
before update on public.raw_items
for each row
execute function public.set_updated_at();
