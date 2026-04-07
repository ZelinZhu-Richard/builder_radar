# Signal Intake Engine

Part 1 of intake is intentionally narrow: collect raw signal, normalize it, persist it, and make each run debuggable.

## What Exists

- Supabase schema and seed data for:
  - `trusted_accounts`
  - `intake_runs`
  - `intake_run_queries`
  - `raw_items`
  - `raw_item_links`
  - `intake_run_items`
- Server-only intake orchestration under `src/lib/intake`
- Internal API routes under `src/app/api/intake`
- Live xAI adapter plus mock adapter for local development

## Environment

Required for live runs:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
XAI_API_KEY=
```

Live mode is explicit:
- if `INTAKE_USE_MOCK=true`, intake uses the mock xAI adapter
- if `INTAKE_USE_MOCK=false`, `XAI_API_KEY` must be present or the run fails fast
- Supabase is required in both modes because mock mode still exercises the real persistence path

Useful defaults:

```bash
XAI_BASE_URL=https://api.x.ai/v1
XAI_MODEL=grok-4-1-fast
INTAKE_LOOKBACK_HOURS=8
INTAKE_MAX_ITEMS_PER_QUERY=5
INTAKE_USE_MOCK=true
INTAKE_LOG_LEVEL=debug
INTAKE_RAW_PAYLOAD_MODE=summary
INTAKE_RAW_PAYLOAD_MAX_BYTES=16384
INTAKE_ADMIN_KEY=
```

Raw payload storage defaults to sanitized summaries. Full payload capture is opt-in:
- `INTAKE_RAW_PAYLOAD_MODE=summary` stores a compact debug summary in `raw_payload_json`
- `INTAKE_RAW_PAYLOAD_MODE=full` stores full provider items only when they fit under `INTAKE_RAW_PAYLOAD_MAX_BYTES`
- oversized payloads fall back to summary storage with `payloadTruncated=true`

## Database Setup

- Run the migration in `supabase/migrations/202604051000_signal_intake_engine.sql`
- Run the follow-up hardening migration in `supabase/migrations/202604060003_event_intelligence_followup.sql`
- Apply the trusted-account seed in `supabase/seed.sql`

## Internal Routes

- `POST /api/intake/run`
- `POST /api/intake/x`
- `POST /api/intake/web`
- `GET /api/intake/runs`
- `GET /api/intake/runs/[runId]`
- `GET /api/intake/raw-items`
- `GET /api/intake/trusted-accounts`
- `POST /api/intake/trusted-accounts`
- `PATCH /api/intake/trusted-accounts/[accountId]`

If `INTAKE_ADMIN_KEY` is set, send it as either:
- `x-intake-admin-key: <value>`
- `Authorization: Bearer <value>`

In non-production environments, the routes are allowed without that key if `INTAKE_ADMIN_KEY` is unset.

## Mock Mode

Set `INTAKE_USE_MOCK=true` to exercise the full orchestration path without live xAI calls.

Mock mode still expects Supabase to exist, because Part 1 is designed to validate the real persistence and run-audit path.

Sample mock provider results live in `src/lib/intake/fixtures.ts`.

## Live Mode

Set:
- `INTAKE_USE_MOCK=false`
- `XAI_API_KEY=<your key>`

If live mode is selected without `XAI_API_KEY`, intake fails fast before making a request.

## Local Smoke Test

1. Apply `supabase/migrations/202604051000_signal_intake_engine.sql`
2. Apply `supabase/seed.sql`
3. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `INTAKE_USE_MOCK=true`
4. Run `pnpm dev`
5. Trigger:
   - `POST /api/intake/x`
   - or `POST /api/intake/web`
   - or `POST /api/intake/run`
6. Inspect:
   - `GET /api/intake/runs`
   - `GET /api/intake/runs/[runId]`
   - `GET /api/intake/raw-items`
   - `GET /api/intake/trusted-accounts`

## Debug Workflow

1. Trigger `POST /api/intake/run`
2. Read the returned `intakeRunId`
3. Inspect `GET /api/intake/runs/[runId]`
4. Check:
   - query success vs failure
   - query `partial` status vs full failure
   - inserted vs updated vs deduped counts
   - skipped malformed items and `skipped_count`
   - stored quote, reply, share, and parent-thread IDs on `raw_items`
   - stored raw item URLs and author handles
   - whether `raw_payload_json` stored a summary or capped full payload
   - extracted `raw_item_links`
5. Use `GET /api/intake/raw-items?limit=20&recentHours=24` to inspect recent normalized items directly
6. Optional filters:
   - `platform=x|web`
   - `trustedOnly=true`
   - `querySource=trusted_account_x|x_search|web_search`

## V1 Boundaries

- No canonical event clustering yet
- No ranking yet
- No alert decisioning yet
- No trusted-account CRUD UI yet
- Trusted-account management is route-level only for now
- No deep safety analysis for linked URLs yet
- Skipped malformed items are surfaced through query summaries, not stored as standalone raw-item rows
