# Build Radar

Trust-first AI edge dashboard scaffold built with Next.js App Router, TypeScript, and Tailwind CSS.

## Current Scope

- Hybrid dashboard shell with a persistent desktop sidebar and page-level lane tabs
- Reusable design system primitives for section cards, event cards, badges, score pills, alert panels, and honest empty states
- Typed domain layer for sources, items, events, sections, opportunities, alerts, and user feedback
- Static mock data shaped around canonical events rather than isolated posts
- Homepage overview plus placeholder routes for `ai`, `quant`, `performance`, `alerts`, `archive`, and `settings`
- Signal Intake Engine Part 1 for raw-signal collection, normalization, Supabase persistence, and run-level observability
- Event Intelligence Engine Part 2 for canonical event creation, raw-item clustering, promoted evidence links, and event-level run observability

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test:intake
pnpm eval:event-intelligence
pnpm build
```

## Notes

- Refresh target is modeled as a 2-hour cycle.
- Ranking, section assignment, alert decisions, and dashboard wiring still sit downstream from canonical events and are not part of the current runtime surface.
- Intake setup, mock/live workflows, raw-item inspection, and trusted-account admin notes live in `docs/intake-engine.md`.
- Event Intelligence setup, routes, and local debug notes live in `docs/event-intelligence-engine.md`.
