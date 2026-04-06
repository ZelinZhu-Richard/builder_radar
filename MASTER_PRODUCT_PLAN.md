# Master Product Plan

## 1. Product Identity

### Working Name
Use a working name first. Good placeholders:
- SignalDesk
- Edge Terminal
- FirstHand
- Richard Terminal

Keep the repo and code neutral enough that you can rename later.

### One-Sentence Definition
A personal trust-first signal dashboard that monitors AI, builder, quant, opportunity, and performance signals, groups them into canonical events, explains what matters, and helps you act faster without wasting time scrolling.

### What This Product Is
It is:
- a signal dashboard
- a personal intelligence terminal
- a trust-first event tracker
- a workflow and opportunity assistant
- a semi-agent that prepares action, not fake autonomy

### What This Product Is Not
It is not:
- a generic chatbot
- a plain news feed
- a Twitter clone
- a motivational self-help app
- a noisy infinite scroll app
- a meme collector
- a general consumer social product

## 2. Primary User and Primary Promise

### User
You only. Single-user personal-first.

That means we optimize for:
- your interests
- your trust preferences
- your life stage
- your goals
- your feedback behavior

Do not build multi-user complexity early.

### Core Promise
Help you understand what actually matters in AI and adjacent builder space faster than scrolling X yourself.

### Secondary Promises
- surface first-hand and close-to-source information
- turn expert posts into useful workflows
- help you find real opportunities
- give you practical next actions
- keep a separate performance lane for study, health, and personal growth

## 3. Product Principles

These are hard rules.

### Rule 1
Think in events, not posts.

### Rule 2
Separate freshness, source proximity, and credibility.

### Rule 3
Trusted reposts are trusted amplification, not original source.

### Rule 4
Dashboard can tolerate broader recall than alerts.

### Rule 5
Alerts must be rare and high confidence.

### Rule 6
If nothing important changed, say no major change honestly.

### Rule 7
Implementation value beats viral value.

### Rule 8
Reproducible workflows rank above vague strategic advice.

### Rule 9
Quant is a secondary lane, not the heart of the product.

### Rule 10
Performance content must be practical and healthy, not body-image junk or fake hustle.

## 4. Product Structure

## Homepage
Homepage is your command center.

It should show only the top 3 items per section.

### Homepage Sections
1. Top Signals  
2. First-Hand / Breaking  
3. Workflows / Guides  
4. Opportunities  
5. Builder Radar  

### Separate Homepage Panel
Alerts panel should exist on homepage, but as a side panel, not one of the five main sections.

## Deeper Lanes or Tabs
- AI
- Quant
- Performance
- Alerts
- Archive
- Settings

## Why This Structure Works
Homepage gives fast command-center value.  
Deeper lanes let you explore without bloating the main page.

## 5. Information Model

This is the most important product concept.

The system should not center around individual posts.  
The system should center around canonical events.

### Canonical Event Definition
A canonical event is one real underlying thing happening in the world.

Examples:
- OpenAI releases a new model
- Karpathy posts a high-value workflow thread
- a research program opens applications
- a trusted builder shares a Claude Code plus Codex workflow
- a new AI evaluation framework starts getting serious attention
- a strong study method thread appears from a credible expert

### One Canonical Event Can Contain
- original X post
- official docs
- repo link
- paper
- direct participant thread
- trusted amplification
- commentary
- verification links
- your summary
- section assignment
- alerts eligibility
- one recommended action

## 6. Content Taxonomy

There are two layers.

## Layer A: Domains
These are the major subject areas.

- AI
- Quant
- Performance

## Layer B: Content Types
These describe what kind of item it is.

- Breaking
- First-hand
- Guide
- Workflow
- Meaningful post
- Opportunity
- Commentary
- Trusted amplification

This solves the earlier problem where “news” was too narrow.  
A meaningful post is valid content even if it is not breaking news.

## 7. Section Definitions

## 7.1 Top Signals
### Job
Show the 3 most important items overall right now.

### Ranking Priorities
- importance
- credibility
- source proximity
- novelty
- real-world usefulness

### Good Examples
- major model release
- major API or tool launch
- important research result with real implications
- a breakthrough workflow thread with unusual utility
- major opportunity with strong fit

### Bad Examples
- memes
- vague commentary about commentary
- hype without evidence
- duplicated event coverage

## 7.2 First-Hand / Breaking
### Job
Show fresh, close-to-source items.

### Includes
- official company/lab accounts
- official docs and changelogs
- original repo or paper author thread
- direct participant threads
- trusted amplification of strong primary sources

### Ranking Priorities
- freshness
- source proximity
- credibility
- evidence strength

### Important Note
Fresh does not mean first-hand.  
A two-hour-old rumor is still weaker than an eight-hour-old official release.

## 7.3 Workflows / Guides
### Job
Show things you can actually use.

### Includes
- AI usage guides
- expert workflows
- Claude Code plus Codex style workflows
- prompt or harness engineering when practical
- agent setup methods
- evaluation workflows
- implementation notes
- strategic threads if they contain real frameworks

### Subtypes
- Implementable
- Strategic

### Ranking Rule
Implementable should outrank Strategic by default.

### Implementable Requirements
At least one of:
- concrete steps
- real example
- code or repo
- tool stack details
- measurable result
- reproducible setup

### Strategic Requirements
Must contain:
- a clear mental model
- a decision framework
- real expert reasoning
- something applicable in your life

## 7.4 Opportunities
### Job
Show things you can apply for, join, contribute to, or attend.

### Includes
- internships
- research labs
- fellowships
- hackathons
- grants
- collabs
- programs
- events
- repos worth contributing to

### Fit Factors
- relevant to your age or stage
- valuable enough to justify time
- credible host
- clear next step
- deadline or urgency
- upside

### This Section Needs Its Own Ranking Logic
Do not rank opportunities with the same formula as news.

## 7.5 Builder Radar
### Job
Show adjacent but useful builder signals.

### Includes
- AI tools
- infra changes affecting AI builders
- new frameworks
- project ideas
- AI for education
- selected quant research or strategy only if genuinely useful

### Excludes
- generic founder chatter
- shallow tool lists
- buzzword-heavy garbage
- empty productivity bait

## 7.6 Performance Lane
This is not on homepage as a main block.  
It lives as its own deeper area.

### Includes
- study systems
- learning science
- healthy eating habits
- sleep
- focus
- discipline systems
- recovery
- stress reduction
- consistent exercise for performance

### Excludes
- crash diets
- body shaming
- over-restriction
- fake hustle content
- empty grindset posting

## 8. Navigation and UI

## Global Shell
Use hybrid navigation.

### Left Rail
Major navigation:
- Dashboard
- AI
- Quant
- Performance
- Alerts
- Archive
- Settings

### Top Bar
Context tools:
- global search
- current time window
- last updated
- new since last visit
- filters
- trusted account quick filter
- topic tags
- refresh action
- alert count

## Homepage Layout
### Hero Row
Top Signals, 3 large cards.

### Grid Below
- First-Hand / Breaking
- Workflows / Guides
- Opportunities
- Builder Radar

### Right Side Panel
- Alerts
- Action Queue
- Saved items count
- No major change status when relevant

## Design Style
- dark mode default
- Bloomberg-clean
- compact
- dense but not cramped
- serious
- restrained accent color
- high contrast for key badges only
- no giant rounded toy cards
- no excessive animation

## Card Anatomy
Each top card should show:
- title
- one short explanation
- why it matters
- section badge
- confidence badge
- source type badge
- action tag
- timestamp
- save / like / useless controls

## Badge System
Badges:
- first-hand
- verified
- trusted amplification
- opportunity
- workflow
- breaking
- strategic
- implementable
- new
- no major change

## 9. Personalization Model

This is a personal-first product.  
It should learn from your behavior.

## Explicit Feedback
Buttons:
- like
- save
- useless

### Meaning
Like:
increase topic and source weight slightly

Save:
strong positive signal, especially for guides and opportunities

Useless:
down-rank similar content, source, or phrasing patterns

## Passive Feedback
Track:
- opened item
- dwell time
- revisit count
- clicked source links
- dismissed item

## Personal Preference State
Store:
- followed accounts
- trusted accounts
- muted accounts
- boosted topics
- muted topics
- quant preference level
- performance preference level

## 10. Source Model

## Source Types
- official account
- direct participant
- trusted interpreter
- aggregator
- media
- recruiter or host
- educator
- builder
- community account

## Trust Tiers
You should have both:
- trust tier
- source class

### Trust Tiers
Tier 1:
official labs, top researchers, direct primary sources

Tier 2:
strong interpreters and builders

Tier 3:
discovery accounts and noisier but sometimes useful sources

## Source Proximity Levels
- primary source
- direct participant
- trusted rebroadcast
- commentary
- aggregated commentary
- low-value repetition

This matters more than popularity.

## 11. Ranking System

Do not use one giant universal formula.

Use section-specific ranking.

## Shared Dimensions
- importance
- freshness
- source proximity
- credibility
- novelty
- actionability
- learning value
- opportunity fit
- practicality
- evidence strength

## Top Signals
Recommended weights:
- importance 30
- credibility 25
- source proximity 15
- novelty 15
- actionability 15

## First-Hand / Breaking
- freshness 30
- source proximity 30
- credibility 25
- evidence strength 15

## Workflows / Guides
- actionability 25
- learning value 25
- reproducibility 25
- explanation quality 15
- credibility 10

## Opportunities
- fit 25
- deadline urgency 20
- upside 20
- credibility 20
- eligibility 15

## Builder Radar
- usefulness 25
- relevance 25
- novelty 20
- practicality 20
- credibility 10

## Performance
- practicality 30
- sustainability 20
- credibility 20
- relevance 15
- clarity 15

## Hard Blocks
Never top-rank:
- meme-only posts
- jokes with no value
- fake viral hype
- duplicate event clutter
- commentary about commentary unless unusually insightful

## 12. Alerts System

For now, alerts live in the dashboard panel only.  
Email comes later.

## Alert Purpose
Show only very important, high-confidence items.

## Alert Triggers
Examples:
- major model launch
- official major API change
- major research release with strong practical impact
- rare high-fit opportunity with deadline
- unusually strong workflow from a very trusted source
- serious AI safety issue with credible evidence

## Alert Blockers
No alert if:
- credibility is low
- it is duplicate commentary
- it is only viral
- there is no evidence
- it is funny but not useful

## Alert Quality Target
You said extremely low false positives.  
Treat that as aspiration, not fake guarantee.  
Start strict.

## 13. Data Model

Use Supabase Postgres.

## Core Tables

### users
- id
- email
- display_name
- created_at

### trusted_accounts
- id
- handle
- display_name
- source_class
- trust_tier
- topic_tags
- is_active
- created_at

### raw_items
- id
- source_type
- platform
- external_id
- author_handle
- author_name
- raw_text
- raw_url
- published_at
- collected_at
- metadata_json

### canonical_events
- id
- title
- summary
- domain
- content_type
- section_primary
- section_secondary
- status
- first_seen_at
- last_updated_at
- importance_score
- freshness_score
- source_proximity_score
- credibility_score
- novelty_score
- actionability_score
- learning_value_score
- opportunity_fit_score
- overall_score
- alert_score
- is_alert
- no_major_change_eligible

### event_links
- id
- event_id
- link_type
- url
- domain
- safety_status
- title
- notes

### event_sources
- id
- event_id
- raw_item_id
- source_role
- source_proximity_level
- is_primary
- is_trusted_amplification

### opportunities
- id
- event_id
- title
- host
- url
- deadline
- eligibility_notes
- fit_score
- upside_score
- effort_score
- status

### alerts
- id
- event_id
- alert_type
- status
- triggered_at
- dismissed_at

### user_feedback
- id
- user_id
- event_id
- feedback_type
- created_at

### saved_items
- id
- user_id
- event_id
- saved_at

### topic_preferences
- id
- user_id
- topic_name
- weight
- is_muted

### source_preferences
- id
- user_id
- trusted_account_id
- weight_override
- is_muted

## 14. Source Ingestion Pipeline

## Stage 1. Collect
Input sources:
- X posts and threads
- xAI web search results
- trusted account posts
- official docs and repos linked from posts
- opportunities from posts and linked pages

Later sources:
- GitHub
- RSS
- arXiv
- official program pages

## Stage 2. Normalize
- clean text
- standardize timestamps
- normalize URLs
- dedupe obvious duplicates
- attach source metadata

## Stage 3. Event Clustering
This is core.

Group multiple raw items into one event using:
- semantic similarity
- shared URLs
- named entities
- same launch or paper name
- same repo or doc link
- same opportunity host and title
- same time window

## Stage 4. Enrich
- fetch linked docs when safe
- pull repo name
- extract paper title
- attach host or organization
- detect deadlines
- detect content type
- detect domain

## Stage 5. Verify
- label evidence strength
- compare official source versus commentary
- attach verification links
- mark uncertain items honestly

## Stage 6. Score
Section-specific ranking.

## Stage 7. Render
Push top ranked events into homepage and lane pages.

## 15. URL and Link Safety

You explicitly care about unsafe links.  
Good.

## Rules
- never auto-open unknown links
- mark all links with safety status
- allowlist known domains
- quarantine suspicious domains
- show warnings for suspicious links
- never include suspicious links in later email features by default

## Safety States
- safe
- suspicious
- blocked
- unscanned

## 16. Pages and Routes

## Core Routes
- /
- /ai
- /quant
- /performance
- /alerts
- /archive
- /settings

## Event Routes
- /event/[id]

## Optional Later Routes
- /opportunities
- /sources
- /topics

## Page Responsibilities

### /
Dashboard with top 3 per section

### /ai
Expanded AI feed with filters

### /quant
Quant-specific lane, lower priority in ranking

### /performance
Study, health, focus, personal improvement lane

### /alerts
Rare, high-confidence important items

### /archive
Search and browse historical canonical events

### /settings
- manage trusted accounts
- manage topics
- manage source preferences
- refresh settings
- future email settings

## 17. Component System

## Layout Components
- AppShell
- LeftRail
- TopBar
- PageHeader
- SectionGrid

## Content Components
- EventCardLarge
- EventCardCompact
- SectionBlock
- AlertCard
- OpportunityCard
- BadgeRow
- RankingReason
- EmptyState
- NoMajorChangeCard

## Interaction Components
- SaveButton
- LikeButton
- UselessButton
- FilterChips
- TopicSelector
- TrustedAccountManager

## 18. Backend Structure

## App Layers
1. UI layer
2. API layer
3. Domain logic layer
4. Data layer
5. Jobs layer

## Suggested Folders
- app/
- components/
- lib/
- lib/domain/
- lib/ranking/
- lib/events/
- lib/sources/
- lib/safety/
- lib/preferences/
- lib/types/
- app/api/
- jobs/
- supabase/

## API Routes
Examples:
- /api/ingest/x
- /api/ingest/web
- /api/events/refresh
- /api/alerts/refresh
- /api/feedback
- /api/trusted-accounts
- /api/preferences

## 19. Scheduled Jobs

## MVP Schedule
Every 2 hours:
- collect new items
- normalize
- cluster into events
- enrich
- re-score
- refresh dashboard data
- refresh alerts panel

## Daily Job
- compute day overview
- snapshot top events of the day
- store summary

## Later Jobs
- email memo generation
- urgent email delivery
- deeper opportunity checks
- old-event freshness decay updates

## 20. Dashboard Behavior Rules

## Top 3 Rule
Only top 3 visible per section on homepage.

## One Event Per Section Rule
A section should not show multiple cards for the same canonical event unless there is a real new development.

## No Major Change Rule
If no meaningful new development exists, show it honestly.

## New Since Last Visit
Show how many meaningful events are new since your last session.

## Stable Ranking Rule
Do not reshuffle cards constantly unless there is a real reason.

## 21. Performance Lane Design Rules

This section must be useful and safe.

## What Counts
- study techniques with real mechanisms
- focus systems
- sustainable routines
- healthy eating habits
- sleep and energy
- practical exercise advice

## What Does Not Count
- extreme dieting
- body-image comparison
- guilt content
- fake grind-posting
- vague inspiration with no method

## Best Item Examples
- a credible thread on spaced repetition setup
- a practical meal template for stable energy
- a sleep routine that improves recovery and focus
- a weekly review system for reducing chaos

## 22. Opportunity Engine

This should be treated like its own subsystem.

## Opportunity Types
- internship
- fellowship
- lab opening
- hackathon
- competition
- grant
- event
- collab
- repo contribution opportunity

## Opportunity Fit Model
Score by:
- topic match
- age eligibility
- skill match
- upside
- deadline urgency
- effort
- location or remote
- credibility

## Opportunity Output
Each opportunity card should show:
- what it is
- why it fits you
- deadline
- effort level
- next step
- link safety status

## 23. Evaluation and Quality Control

This is mandatory if you do not want the app to become vibes-only software.

## Create a Labeled Evaluation Set
At least 100 to 200 historical items.  
Label:
- useful
- not useful
- urgent
- duplicate
- opportunity
- hype
- should have been in top 3
- should not have been surfaced

## Metrics
- precision of alerts
- missed important event rate
- duplicate event rate
- top 3 usefulness score
- opportunity relevance score
- feedback response improvement
- time to dashboard refresh

## Review Loop
Every week review:
- what was missed
- what was noisy
- which sources overperformed
- which categories drifted
- whether quant is still worth current weight

## 24. Phase Plan

## Phase 1. Foundation and MVP
Build:
- app shell
- homepage
- tabs
- core types
- trusted accounts model
- raw item ingestion
- canonical event model
- basic clustering
- basic scoring
- dashboard display
- alerts panel
- feedback buttons

## Phase 2. Smarter Event Intelligence
Build:
- better event clustering
- better verification
- source proximity model
- trusted amplification handling
- no major change logic
- archive and search

## Phase 3. Actionability
Build:
- workflows extraction
- opportunity fit engine
- action queue
- daily overview page
- save and follow-up flows

## Phase 4. Personal Operating System
Build:
- performance lane depth
- better preference learning
- richer topic controls
- stronger source management
- email memos
- maybe mobile later

## 25. Exact MVP Scope

If you want a disciplined MVP, it should include:

- hybrid navigation shell
- homepage with 5 sections
- alerts panel
- /ai, /quant, /performance, /alerts, /archive, /settings routes
- trusted account storage
- xAI-based source ingestion
- canonical events
- top 3 ranking per section
- feedback buttons
- archive basics
- no major change state

Do not fully build in MVP:
- advanced email delivery
- full autonomous alerting
- complicated multi-source crawling
- mobile app
- multi-user auth complexity
- overfancy analytics

## 26. Biggest Risks

### Risk 1
Weak event clustering.  
If this fails, the whole app feels repetitive.

### Risk 2
Category creep.  
If Builder Radar and Performance become vague, the product gets sloppy.

### Risk 3
Bad ranking explanations.  
If you cannot tell why an item ranked highly, trust drops.

### Risk 4
Quant takes over.  
Keep quant useful, not dominant.

### Risk 5
Fake freshness.  
Never pretend there was news when nothing meaningful changed.

## 27. Decisions Locked for Now

These are the assumptions to keep unless you intentionally change them.

- single user first
- homepage is command center
- 5 homepage sections
- alerts panel on homepage
- performance lives in its own lane, not homepage
- top 3 per section
- refresh every 2 hours
- think in events, not posts
- reposts are trusted amplification
- honest no major change state
- hybrid navigation
- pnpm
- Bloomberg-clean dark UI
- implementation value beats hype

## 28. Final Note on “Perfect”

This plan is detailed enough to build the real product with very little guessing.  
But perfection will still come from iteration, especially in:
- event clustering
- ranking
- alert strictness
- opportunity fit
- source weighting

Those are learned systems, not one-shot systems.

## 29. Recommended Placement in Project

Save this file as one of these:
- `docs/MASTER_PRODUCT_PLAN.md`
- `planning/MASTER_PRODUCT_PLAN.md`
- `project-docs/MASTER_PRODUCT_PLAN.md`

Best recommendation:
- `docs/MASTER_PRODUCT_PLAN.md`

Then later add:
- `docs/PRD.md`
- `docs/TECHNICAL_ARCHITECTURE.md`
- `docs/CODEX_PROMPTS.md`
- `AGENTS.md`

This master plan should be the long-form source of truth.  
`AGENTS.md` should be the short operational version for Codex and future agents.
