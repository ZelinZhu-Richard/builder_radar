<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Build Radar Agent Guide

This file is the short operational guide for Codex and future coding agents working in this repository. Use it as the default product and engineering guardrail when making changes.

## 1. Product Mission

Build Radar is a personal trust-first AI edge dashboard. Its job is to help a single user understand what actually matters across AI, builder, quant, opportunities, and performance faster than manual scrolling.

This app is:
- a signal dashboard
- a personal intelligence terminal
- an event-first ranking system
- a workflow and opportunity assistant

This app is not:
- a generic chatbot
- a random news feed
- a social feed clone
- a meme collector
- a motivational self-help app
- a noisy infinite-scroll consumer product

Default product stance:
- Optimize for trust, usefulness, and actionability.
- Optimize for a single informed user, not broad consumer engagement.
- Prefer helping the user decide what matters over trying to generate artificial activity.

## 2. Core Product Rules

Treat these as hard rules unless the user explicitly changes product direction.

- Think in canonical events, not isolated posts.
- Separate freshness, source proximity, and credibility. They are not the same signal.
- Treat trusted reposts as trusted amplification, not original source.
- The dashboard can tolerate broader recall than alerts.
- Alerts must be high-confidence, rare, and tied to an actual decision or follow-up.
- If nothing materially changed, show `no major change` honestly.
- Avoid fake urgency.
- Avoid duplicate event clutter.
- Implementation value beats virality.
- Reproducible workflows rank above vague strategic commentary by default.

Practical consequence:
- Multiple posts about the same real-world development should usually collapse into one canonical event with evidence and amplification attached.
- Do not create separate cards just because several accounts repeated the same thing.

## 3. Information Architecture

The app is dashboard-first. The homepage is the command center and should show only the top 3 items per section.

Homepage sections:
- `Top Signals`: the most important cross-lane items right now.
- `First-Hand / Breaking`: fresh items close to the original source, with evidence strength prioritized over rumor velocity.
- `Workflows / Guides`: practical, implementable methods, demos, and reproducible operating knowledge.
- `Opportunities`: things the user can apply for, join, attend, contribute to, or act on.
- `Builder Radar`: durable adjacent tooling, infra, frameworks, and builder-relevant signals.

Deeper lanes:
- `AI`: models, tooling, labs, workflows, evals, and builder-adjacent AI developments.
- `Quant`: tactical windows, breadth changes, factor behavior, and market-linked opportunities.
- `Performance / Health / Personal Growth`: practical performance inputs only when useful and grounded.
- `Alerts`: rare high-confidence escalations and active watches.
- `Archive`: canonical event history, prior cycles, and later diff views.
- `Settings`: trust model, ranking controls, filters, and personal preferences.

Current repo shape:
- Routes and shell live under `src/app/(dashboard)`.
- Shared domain types live in `src/types`.
- Navigation and route metadata live in `src/lib/navigation.ts`.
- Mock event shaping lives in `src/lib/mock`.
- Reusable UI lives in `src/components`.

## 4. Ranking Philosophy

Do not use one giant global formula for everything. Ranking is section-specific.

Shared dimensions to consider:
- importance
- freshness
- source proximity
- credibility
- actionability
- learning value
- opportunity fit
- practicality

Section guidance:
- `Top Signals`: favor importance, trust, source proximity, and actual usefulness.
- `First-Hand / Breaking`: favor freshness plus source proximity and credibility; fresh rumor should still lose to older official evidence.
- `Workflows / Guides`: favor direct demos, reproducible methods, code, concrete steps, and measurable outcomes.
- `Workflows / Guides`: high-level expert strategy is allowed, but it should rank below concrete implementation by default.
- `Opportunities`: rank separately from news-like content; fit, upside, credibility, clarity of next step, and urgency matter more than chatter.
- `Builder Radar`: favor durable tool and infra shifts that help builders act, ship, debug, or learn faster.

Ranking output should be legible:
- When possible, show why an item ranked where it did.
- Prefer explicit ranking reasons over opaque “smart score” behavior.

## 5. Content Inclusion And Exclusion Rules

Include:
- AI tools
- AI workflows
- AI usage guides
- meaningful posts with real implementation value
- opportunities such as internships, labs, hackathons, grants, collabs, repos, and events
- performance content only when it is practical, grounded, and useful

Exclude or strongly down-rank:
- memes
- joke-only posts
- vague hype
- generic founder chatter
- fake hustle content
- shallow listicles
- low-substance productivity bait
- duplicated event coverage
- commentary about commentary with no new evidence

Default filter:
- If a post does not help the user understand, build, decide, learn, or act, it probably does not deserve prominent placement.

## 6. UI And UX Rules

The interface should feel:
- Bloomberg-clean
- dense
- calm
- serious
- dark-mode-first

Design rules:
- Maintain strong visual hierarchy.
- Prefer compact cards over oversized consumer layouts.
- Use restrained accent color and high-contrast emphasis only when it serves signal clarity.
- Empty states must be honest and useful.
- `No major change` is a valid first-class state.
- Avoid giant rounded toy-card aesthetics.
- Avoid playful, noisy, or hyper-animated presentation.

Badge vocabulary should support:
- `first-hand`
- `verified`
- `trusted amplification`
- `opportunity`
- `workflow`
- `breaking`

UI behavior guidance:
- Make it obvious what is primary source vs amplification.
- Make it obvious when something is actionable vs informational.
- Prefer fewer dense cards over more shallow cards.

## 7. Engineering Rules

- Use TypeScript strictly.
- Keep shared domain types centralized in `src/types`.
- Prefer small reusable components.
- Keep ranking, grouping, and normalization logic out of presentation components where possible.
- Prefer obvious file and folder names over clever abstractions.
- Avoid duplication in types, mocks, and ranking logic.
- Document tricky logic with concise comments, not essays.
- Do not introduce abstractions unless they clearly reduce complexity or duplication.
- Keep the project easy for future agents to inspect and extend.
- If product logic changes, evolve the shared domain model first instead of hiding new concepts in page-level code.

Current structure expectations:
- App shell and routing belong in `src/app/(dashboard)` and `src/components/layout`.
- Dashboard rendering belongs in `src/components/dashboard`.
- Shared UI primitives belong in `src/components/ui`.
- Shared navigation and route metadata belong in `src/lib/navigation.ts`.
- Shared mock/event shaping belongs in `src/lib/mock`.

## 8. Data Model Guidance

Expected core entities:
- `source`
- `item`
- `event`
- `section`
- `opportunity`
- `alert`
- `user_feedback`
- `trusted_account`
- `citation` or evidence link

Definitions:
- `source`: canonical publisher or origin with trust tier, source class, and lane relevance.
- `item`: raw observed input such as a post, guide, article, release note, or job post.
- `event`: canonical grouped real-world development composed from one or more items.
- `section`: ranked collection of events shaped for a homepage block or lane view.
- `opportunity`: actionable opening with upside, urgency, fit, and a clear next step.
- `alert`: rare escalation or watch state tied to a concrete follow-up.
- `user_feedback`: explicit signal like like/save/useless or similar future feedback.
- `trusted_account`: user-level trust preference or allowlist concept for ranking and filtering.
- `citation` or evidence link: supporting proof for an event, claim, or ranking reason.

Current repo note:
- `source`, `item`, `event`, `section`, `opportunity`, `alert`, and `user_feedback` already have central type files in `src/types`.
- `trusted_account` is not yet modeled centrally.
- Citation or evidence-link concepts are only partially implied today and should become explicit when ingestion and ranking mature.

## 9. Agent Workflow Expectations

- Inspect before editing.
- Plan before major implementation.
- State assumptions clearly.
- Do not silently change product logic, ranking philosophy, or section meaning.
- Preserve product intent when refactoring.
- When uncertain, choose the simpler architecture that preserves extensibility.
- After coding, summarize what changed, why it changed, and what should happen next.

When touching product logic:
- Check `MASTER_PRODUCT_PLAN.md` for long-form intent.
- Keep `AGENTS.md` as the short operational version.
- If you must diverge from these rules, say so explicitly in your summary.

When touching UI:
- Preserve the dashboard-first, dense, serious posture.
- Do not “improve” the app by making it more playful, social, or generic-consumer.

## 10. Near-Term Roadmap Context

Current phase:
- foundation
- MVP

Current priorities:
- scaffolding
- canonical event model
- ranking foundations
- dashboard experience
- opportunities support

Do not prematurely build:
- full multi-user complexity
- over-abstracted ranking infrastructure
- every future settings surface
- full archive intelligence before ingestion exists
- broad autonomous agent behavior without clear product need

Build for future expansion, but do not build the whole future now.
