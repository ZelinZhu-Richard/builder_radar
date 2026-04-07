create table if not exists public.canonical_events (
  id uuid primary key default gen_random_uuid(),
  stable_key text not null,
  title text not null,
  summary text,
  primary_lane text not null check (primary_lane in ('ai', 'quant', 'performance', 'builders')),
  lane_hints text[] not null default '{}'::text[],
  event_traits text[] not null default '{}'::text[],
  event_kind_hint text,
  status text not null check (status in ('new', 'developing', 'steady', 'archived')),
  primary_raw_item_id uuid not null references public.raw_items(id),
  primary_source_role text not null check (
    primary_source_role in (
      'primary_source',
      'direct_participant',
      'trusted_amplification',
      'commentary',
      'low_value_repetition'
    )
  ),
  first_seen_at timestamptz not null,
  latest_seen_at timestamptz not null,
  last_material_update_at timestamptz not null,
  member_count integer not null default 1,
  material_update_count integer not null default 1,
  cluster_explanation_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_raw_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.canonical_events(id) on delete cascade,
  raw_item_id uuid not null references public.raw_items(id) on delete cascade,
  source_role text not null check (
    source_role in (
      'primary_source',
      'direct_participant',
      'trusted_amplification',
      'commentary',
      'low_value_repetition'
    )
  ),
  is_primary boolean not null default false,
  is_material_update boolean not null default false,
  assignment_method text not null check (
    assignment_method in (
      'existing_membership',
      'exact_anchor_link',
      'stable_key',
      'soft_match',
      'new_event'
    )
  ),
  assignment_score integer not null default 0,
  reason_summary text,
  metadata_json jsonb not null default '{}'::jsonb,
  first_attached_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.canonical_events(id) on delete cascade,
  raw_item_link_id uuid references public.raw_item_links(id) on delete set null,
  source_raw_item_id uuid references public.raw_items(id) on delete set null,
  raw_url text not null,
  normalized_url text not null,
  domain text,
  title text,
  link_role text not null check (
    link_role in (
      'primary',
      'official_doc',
      'repo',
      'paper',
      'evidence',
      'citation',
      'opportunity',
      'unknown'
    )
  ),
  provenance_count integer not null default 1,
  is_canonical boolean not null default false,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  metadata_json jsonb not null default '{}'::jsonb
);

create table if not exists public.event_intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('incremental', 'full', 'manual_replay')),
  trigger_source text not null check (trigger_source in ('cron', 'manual', 'api', 'dev')),
  status text not null check (status in ('running', 'succeeded', 'partial', 'failed')),
  candidate_raw_items integer not null default 0,
  processed_items integer not null default 0,
  events_created integer not null default 0,
  events_updated integer not null default 0,
  items_attached integer not null default 0,
  items_skipped integer not null default 0,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  error_summary text,
  config_snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_intelligence_run_items (
  id uuid primary key default gen_random_uuid(),
  event_intelligence_run_id uuid not null references public.event_intelligence_runs(id) on delete cascade,
  raw_item_id uuid not null references public.raw_items(id) on delete cascade,
  event_id uuid references public.canonical_events(id) on delete set null,
  resolution_action text not null check (
    resolution_action in (
      'created_event',
      'attached_existing',
      'attached_existing_material',
      'skipped_low_value',
      'skipped_error'
    )
  ),
  assigned_role text check (
    assigned_role in (
      'primary_source',
      'direct_participant',
      'trusted_amplification',
      'commentary',
      'low_value_repetition'
    )
  ),
  assignment_method text check (
    assignment_method in (
      'existing_membership',
      'exact_anchor_link',
      'stable_key',
      'soft_match',
      'new_event'
    )
  ),
  assignment_score integer,
  notes text,
  decision_json jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists canonical_events_stable_key_unique
  on public.canonical_events (stable_key);

create index if not exists canonical_events_primary_lane_idx
  on public.canonical_events (primary_lane);

create index if not exists canonical_events_status_idx
  on public.canonical_events (status);

create index if not exists canonical_events_latest_seen_idx
  on public.canonical_events (latest_seen_at desc);

create index if not exists canonical_events_last_material_update_idx
  on public.canonical_events (last_material_update_at desc);

create index if not exists canonical_events_lane_hints_idx
  on public.canonical_events using gin (lane_hints);

create unique index if not exists event_raw_items_raw_item_unique
  on public.event_raw_items (raw_item_id);

create unique index if not exists event_raw_items_primary_unique
  on public.event_raw_items (event_id)
  where is_primary = true;

create index if not exists event_raw_items_event_id_idx
  on public.event_raw_items (event_id);

create index if not exists event_raw_items_source_role_idx
  on public.event_raw_items (source_role);

create unique index if not exists event_links_event_url_role_unique
  on public.event_links (event_id, normalized_url, link_role);

create index if not exists event_links_event_id_idx
  on public.event_links (event_id);

create index if not exists event_links_normalized_url_idx
  on public.event_links (normalized_url);

create index if not exists event_links_link_role_idx
  on public.event_links (link_role);

create index if not exists event_intelligence_runs_started_at_idx
  on public.event_intelligence_runs (started_at desc);

create index if not exists event_intelligence_runs_status_idx
  on public.event_intelligence_runs (status);

create index if not exists event_intelligence_run_items_run_id_idx
  on public.event_intelligence_run_items (event_intelligence_run_id);

create index if not exists event_intelligence_run_items_raw_item_idx
  on public.event_intelligence_run_items (raw_item_id);

create index if not exists event_intelligence_run_items_event_id_idx
  on public.event_intelligence_run_items (event_id);

drop trigger if exists canonical_events_set_updated_at on public.canonical_events;
create trigger canonical_events_set_updated_at
before update on public.canonical_events
for each row
execute function public.set_updated_at();

drop trigger if exists event_raw_items_set_updated_at on public.event_raw_items;
create trigger event_raw_items_set_updated_at
before update on public.event_raw_items
for each row
execute function public.set_updated_at();
