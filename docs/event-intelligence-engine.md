# Event Intelligence Engine

Part 2 turns raw intake output into canonical event objects the dashboard can eventually rank, de-duplicate, archive, and alert on.

## What Exists

- Supabase schema and run tracking for:
  - `canonical_events`
  - `event_raw_items`
  - `event_links`
  - `event_intelligence_runs`
  - `event_intelligence_run_items`
  - `event_manual_overrides`
- Deterministic clustering and update logic under `src/lib/event-intelligence`
- Internal inspection routes under `src/app/api/event-intelligence`
- Pure heuristic tests for token signatures, promoted links, primary-source correction, and split-vs-merge behavior
- A golden replay harness with 24 labeled scenarios under `src/lib/event-intelligence/evals`

## Core Behavior

- Input is `raw_items` plus `raw_item_links`
- Output is canonical events plus explainable raw-item membership decisions
- One raw item belongs to at most one event in v1
- Exact anchor links win over soft similarity
- Explicit quote/reply/share/thread IDs from intake are used before text-only inference when available
- Ambiguous cases prefer false splits over risky false merges
- Ambiguous near-matches are logged with runner-up IDs, scores, and an ambiguity reason
- `latest_seen_at` and `last_material_update_at` are tracked separately so later UI can say `no major change` honestly

## Event Tables

- `canonical_events`
  - event-level object with title, summary, lane, traits, primary raw item, material freshness, and clustering metadata
- `event_raw_items`
  - one row per raw-item-to-event assignment with role, method, score, and material-update flag
- `event_links`
  - promoted canonical links such as docs, repos, papers, opportunities, and event-level evidence
- `event_intelligence_runs`
  - top-level run audit record
- `event_intelligence_run_items`
  - per-item decision log including created/attached/skipped outcomes plus runner-up ambiguity detail
- `event_manual_overrides`
  - minimal repair log for merges, primary-pin overrides, and raw-item reassignments

## Internal Routes

- `POST /api/event-intelligence/run`
- `POST /api/event-intelligence/overrides`
- `GET /api/event-intelligence/runs`
- `GET /api/event-intelligence/runs/[runId]`
- `GET /api/event-intelligence/events/[eventId]`

Admin protection matches intake:
- set `INTAKE_ADMIN_KEY`
- send it as `x-intake-admin-key: <value>` or `Authorization: Bearer <value>`
- in non-production, the routes are open if `INTAKE_ADMIN_KEY` is unset

## Local Flow

1. Apply:
   - `supabase/migrations/202604051000_signal_intake_engine.sql`
   - `supabase/migrations/202604060001_intake_hardening.sql`
   - `supabase/migrations/202604060002_event_intelligence_engine.sql`
   - `supabase/migrations/202604060003_event_intelligence_followup.sql`
2. Seed trusted accounts with `supabase/seed.sql`
3. Run intake first so `raw_items` exist
4. Start the app with `pnpm dev`
5. Trigger `POST /api/event-intelligence/run`
6. Inspect:
   - `GET /api/event-intelligence/runs`
   - `GET /api/event-intelligence/runs/[runId]`
   - `GET /api/event-intelligence/events/[eventId]`

## Manual Repair Hooks

- `POST /api/event-intelligence/overrides`
- Supported actions:
  - `merge_event`
  - `pin_primary_raw_item`
  - `reassign_raw_item`
- Override rows are audited in `event_manual_overrides`
- `merge_event` reassigns the source event's memberships into the target event and marks the source as merged
- `pin_primary_raw_item` forces primary selection while the pinned raw item remains a member
- `reassign_raw_item` moves one raw item between events and refreshes both sides

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:intake`
- `pnpm eval:event-intelligence`
- `pnpm build`

## V1 Boundaries

- No embeddings or opaque clustering model
- No LLM event summaries
- No ranking, section assignment, archive UI, or alert generation yet
- No dashboard wiring to live canonical events yet
