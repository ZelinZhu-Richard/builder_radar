alter table public.raw_items
  add column if not exists quoted_external_id text,
  add column if not exists replied_to_external_id text,
  add column if not exists shared_external_id text,
  add column if not exists parent_thread_external_id text;

create index if not exists raw_items_quoted_external_id_idx
  on public.raw_items (quoted_external_id);

create index if not exists raw_items_replied_to_external_id_idx
  on public.raw_items (replied_to_external_id);

create index if not exists raw_items_shared_external_id_idx
  on public.raw_items (shared_external_id);

create index if not exists raw_items_parent_thread_external_id_idx
  on public.raw_items (parent_thread_external_id);

alter table public.canonical_events
  alter column stable_key drop not null;

alter table public.canonical_events
  add column if not exists merged_into_event_id uuid references public.canonical_events(id) on delete set null,
  add column if not exists primary_raw_item_override_id uuid references public.raw_items(id) on delete set null;

drop index if exists public.canonical_events_stable_key_unique;

create unique index if not exists canonical_events_stable_key_unique
  on public.canonical_events (stable_key)
  where stable_key is not null;

create index if not exists canonical_events_merged_into_event_idx
  on public.canonical_events (merged_into_event_id);

alter table public.event_intelligence_run_items
  add column if not exists runner_up_event_id uuid references public.canonical_events(id) on delete set null,
  add column if not exists runner_up_score integer,
  add column if not exists ambiguity_flag boolean not null default false,
  add column if not exists ambiguity_reason text;

create index if not exists event_intelligence_run_items_runner_up_event_idx
  on public.event_intelligence_run_items (runner_up_event_id);

create index if not exists event_intelligence_run_items_ambiguity_flag_idx
  on public.event_intelligence_run_items (ambiguity_flag);

create table if not exists public.event_manual_overrides (
  id uuid primary key default gen_random_uuid(),
  action_type text not null check (
    action_type in ('merge_event', 'pin_primary_raw_item', 'reassign_raw_item')
  ),
  event_id uuid references public.canonical_events(id) on delete set null,
  target_event_id uuid references public.canonical_events(id) on delete set null,
  raw_item_id uuid references public.raw_items(id) on delete set null,
  primary_raw_item_id uuid references public.raw_items(id) on delete set null,
  reason text not null,
  payload_json jsonb not null default '{}'::jsonb,
  applied_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists event_manual_overrides_action_type_idx
  on public.event_manual_overrides (action_type);

create index if not exists event_manual_overrides_event_id_idx
  on public.event_manual_overrides (event_id);

create index if not exists event_manual_overrides_target_event_id_idx
  on public.event_manual_overrides (target_event_id);

create index if not exists event_manual_overrides_raw_item_id_idx
  on public.event_manual_overrides (raw_item_id);
