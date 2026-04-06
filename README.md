# Build Radar

Trust-first AI edge dashboard scaffold built with Next.js App Router, TypeScript, and Tailwind CSS.

## Current Scope

- Hybrid dashboard shell with a persistent desktop sidebar and page-level lane tabs
- Reusable design system primitives for section cards, event cards, badges, score pills, alert panels, and honest empty states
- Typed domain layer for sources, items, events, sections, opportunities, alerts, and user feedback
- Static mock data shaped around canonical events rather than isolated posts
- Homepage overview plus placeholder routes for `ai`, `quant`, `performance`, `alerts`, `archive`, and `settings`
- Signal Intake Engine Part 1 for raw-signal collection, normalization, Supabase persistence, and run-level observability

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Notes

- Refresh target is modeled as a 2-hour cycle.
- Event intelligence, ranking, and alert decisions still sit downstream from intake and are not part of the current persistence layer.
- Intake setup, mock/live workflows, raw-item inspection, and trusted-account admin notes live in `docs/intake-engine.md`.
