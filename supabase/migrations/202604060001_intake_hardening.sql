alter table if exists public.intake_runs
  add column if not exists raw_items_skipped integer not null default 0;

alter table if exists public.intake_run_queries
  add column if not exists skipped_count integer not null default 0;

alter table if exists public.intake_run_queries
  drop constraint if exists intake_run_queries_status_check;

alter table if exists public.intake_run_queries
  add constraint intake_run_queries_status_check
  check (status in ('running', 'succeeded', 'partial', 'failed'));
