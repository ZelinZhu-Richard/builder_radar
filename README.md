# Build Radar

Trust-first AI edge dashboard scaffold built with Next.js App Router, TypeScript, and Tailwind CSS.

## Current Scope

- Hybrid dashboard shell with a persistent desktop sidebar and page-level lane tabs
- Reusable design system primitives for section cards, event cards, badges, score pills, alert panels, and honest empty states
- Typed domain layer for sources, items, events, sections, opportunities, alerts, and user feedback
- Static mock data shaped around canonical events rather than isolated posts
- Homepage overview plus placeholder routes for `ai`, `quant`, `performance`, `alerts`, `archive`, and `settings`

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Notes

- Refresh target is modeled as a 2-hour cycle.
- Live Supabase, Resend, and xAI integrations are intentionally deferred.
- The current scaffold is designed to be extended with real ingestion, ranking, and delivery logic without restructuring the app shell.
