-- Baseline trusted-account seed for local development and early MVP intake.
-- Keep this set small, high-signal, and lane-diverse.

insert into public.trusted_accounts (
  handle,
  normalized_handle,
  display_name,
  profile_url,
  source_kind,
  trust_tier,
  lane_hints,
  topic_tags,
  ingest_priority,
  notes
)
values
  (
    '@modellab',
    'modellab',
    'Model Lab Notes',
    'https://x.com/modellab',
    'research-lab',
    'primary',
    array['ai']::text[],
    array['benchmarks', 'evals', 'models']::text[],
    10,
    'Primary lab-style release and benchmark account.'
  ),
  (
    '@inferencedesk',
    'inferencedesk',
    'Inference Founder Desk',
    'https://x.com/inferencedesk',
    'founder',
    'primary',
    array['ai']::text[],
    array['infra', 'pricing', 'agents']::text[],
    20,
    'High-value infra and pricing signal.'
  ),
  (
    '@appliedops',
    'appliedops',
    'Applied Operator Desk',
    'https://x.com/appliedops',
    'operator',
    'verified',
    array['ai', 'builders']::text[],
    array['workflows', 'operations', 'validation']::text[],
    30,
    'Trusted operator signal and implementation validation.'
  ),
  (
    '@northset',
    'northset',
    'North Set Letter',
    'https://x.com/northset',
    'publication',
    'verified',
    array['quant']::text[],
    array['breadth', 'regime', 'market']::text[],
    40,
    'Quant lane tactical signal.'
  ),
  (
    '@systemsbuilder',
    'systemsbuilder',
    'Systems Builder',
    'https://x.com/systemsbuilder',
    'maintainer',
    'primary',
    array['builders', 'ai']::text[],
    array['tooling', 'agents', 'memory']::text[],
    15,
    'Builder-facing releases and design-partner opportunities.'
  ),
  (
    '@performancelab',
    'performancelab',
    'Performance Lab',
    'https://x.com/performancelab',
    'operator',
    'verified',
    array['performance']::text[],
    array['recovery', 'focus', 'study']::text[],
    50,
    'Practical performance lane signal.'
  )
on conflict (platform, normalized_handle)
do update set
  handle = excluded.handle,
  display_name = excluded.display_name,
  profile_url = excluded.profile_url,
  source_kind = excluded.source_kind,
  trust_tier = excluded.trust_tier,
  lane_hints = excluded.lane_hints,
  topic_tags = excluded.topic_tags,
  ingest_priority = excluded.ingest_priority,
  notes = excluded.notes,
  is_active = true;
