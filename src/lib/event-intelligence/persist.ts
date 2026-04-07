import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { EventAssignmentMethod } from "@/types";
import {
  buildEventRefreshResult,
  buildPromotedEventLinks,
} from "./heuristics";
import type {
  ApplyEventManualOverrideOptions,
  CandidateEventContext,
  CanonicalEventRow,
  EventIntelligenceRawItemCandidate,
  EventLinkRow,
  EventRawItemRow,
  EventRoleDecision,
  PromotedEventLinkCandidate,
  RawItemLinkRow,
  RawItemRow,
} from "./types";

type CanonicalEventInsert = Database["public"]["Tables"]["canonical_events"]["Insert"];
type CanonicalEventUpdate = Database["public"]["Tables"]["canonical_events"]["Update"];
type EventIntelligenceRunInsert =
  Database["public"]["Tables"]["event_intelligence_runs"]["Insert"];
type EventIntelligenceRunUpdate =
  Database["public"]["Tables"]["event_intelligence_runs"]["Update"];
type EventRawItemInsert = Database["public"]["Tables"]["event_raw_items"]["Insert"];
type EventRawItemUpdate = Database["public"]["Tables"]["event_raw_items"]["Update"];
type EventLinkInsert = Database["public"]["Tables"]["event_links"]["Insert"];
type EventLinkUpdate = Database["public"]["Tables"]["event_links"]["Update"];
type EventIntelligenceRunItemInsert =
  Database["public"]["Tables"]["event_intelligence_run_items"]["Insert"];
type EventManualOverrideInsert =
  Database["public"]["Tables"]["event_manual_overrides"]["Insert"];

function stableStringify(value: unknown) {
  return JSON.stringify(value);
}

function normalizeNullableString(value: string | null | undefined) {
  return value ?? null;
}

function asObject(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function mergeJsonObject(
  value: Json | null,
  patch: Record<string, unknown>,
) {
  return {
    ...asObject(value),
    ...patch,
  };
}

function normalizeStringArray(values: string[]) {
  return [...values].sort();
}

function roleMapFromMemberships(memberships: EventRawItemRow[]) {
  return new Map<string, EventRoleDecision>(
    memberships.map((membership) => [
      membership.raw_item_id,
      {
        sourceRole: membership.source_role as EventRoleDecision["sourceRole"],
        isMaterialUpdate: membership.is_material_update,
        isLowValue: membership.source_role === "low_value_repetition",
        reasonSummary: membership.reason_summary ?? "",
      },
    ]),
  );
}

function toPromotedLinks(eventLinks: EventLinkRow[]): PromotedEventLinkCandidate[] {
  return eventLinks.map((link) => ({
    rawItemLinkId: link.raw_item_link_id,
    sourceRawItemId: link.source_raw_item_id ?? "",
    rawUrl: link.raw_url,
    normalizedUrl: link.normalized_url,
    domain: link.domain,
    title: link.title,
    linkRole: link.link_role as PromotedEventLinkCandidate["linkRole"],
    isCanonical: link.is_canonical,
    reason: "event_link",
  }));
}

function hasEventChanges(event: CanonicalEventRow, payload: CanonicalEventUpdate) {
  return (
    event.stable_key !== payload.stable_key ||
    event.title !== payload.title ||
    normalizeNullableString(event.summary) !== normalizeNullableString(payload.summary) ||
    event.primary_lane !== payload.primary_lane ||
    stableStringify(normalizeStringArray(event.lane_hints)) !==
      stableStringify(normalizeStringArray(payload.lane_hints ?? [])) ||
    stableStringify(normalizeStringArray(event.event_traits)) !==
      stableStringify(normalizeStringArray(payload.event_traits ?? [])) ||
    normalizeNullableString(event.event_kind_hint) !==
      normalizeNullableString(payload.event_kind_hint) ||
    event.status !== payload.status ||
    event.primary_raw_item_id !== payload.primary_raw_item_id ||
    event.primary_source_role !== payload.primary_source_role ||
    event.latest_seen_at !== payload.latest_seen_at ||
    event.last_material_update_at !== payload.last_material_update_at ||
    event.member_count !== payload.member_count ||
    event.material_update_count !== payload.material_update_count ||
    stableStringify(event.cluster_explanation_json) !==
      stableStringify(payload.cluster_explanation_json) ||
    stableStringify(event.metadata_json) !== stableStringify(payload.metadata_json)
  );
}

function hasMembershipChanges(existing: EventRawItemRow, payload: EventRawItemUpdate) {
  return (
    existing.event_id !== payload.event_id ||
    existing.source_role !== payload.source_role ||
    existing.is_primary !== payload.is_primary ||
    existing.is_material_update !== payload.is_material_update ||
    existing.assignment_method !== payload.assignment_method ||
    existing.assignment_score !== payload.assignment_score ||
    normalizeNullableString(existing.reason_summary) !==
      normalizeNullableString(payload.reason_summary) ||
    stableStringify(existing.metadata_json) !== stableStringify(payload.metadata_json)
  );
}

function mergeEventLinkMetadata(existing: Json | null, rawItemId: string) {
  const metadata = asObject(existing);
  const rawItemIds = Array.isArray(metadata.sourceRawItemIds)
    ? metadata.sourceRawItemIds.filter((value): value is string => typeof value === "string")
    : [];

  if (rawItemIds.includes(rawItemId)) {
    return {
      metadataJson: {
        ...metadata,
        sourceRawItemIds: rawItemIds,
      },
      provenanceIncrement: 0,
    };
  }

  return {
    metadataJson: {
      ...metadata,
      sourceRawItemIds: [...rawItemIds, rawItemId],
    },
    provenanceIncrement: 1,
  };
}

async function loadRawItems(
  supabase: SupabaseClient<Database>,
  rawItemIds: string[],
) {
  if (rawItemIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("raw_items")
    .select("*")
    .in("id", rawItemIds);

  if (error) {
    throw new Error(`Failed to load raw items: ${error.message}`);
  }

  return data ?? [];
}

async function loadRawItemLinks(
  supabase: SupabaseClient<Database>,
  rawItemIds: string[],
) {
  if (rawItemIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("raw_item_links")
    .select("*")
    .in("raw_item_id", rawItemIds);

  if (error) {
    throw new Error(`Failed to load raw item links: ${error.message}`);
  }

  return data ?? [];
}

function mapRawItemLinksByRawItem(rawItemLinks: RawItemLinkRow[]) {
  const map = new Map<string, RawItemLinkRow[]>();

  for (const link of rawItemLinks) {
    const existing = map.get(link.raw_item_id) ?? [];
    existing.push(link);
    map.set(link.raw_item_id, existing);
  }

  return map;
}

export async function createEventIntelligenceRun(
  supabase: SupabaseClient<Database>,
  payload: EventIntelligenceRunInsert,
) {
  const { data, error } = await supabase
    .from("event_intelligence_runs")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create event intelligence run: ${error.message}`);
  }

  return data;
}

export async function updateEventIntelligenceRun(
  supabase: SupabaseClient<Database>,
  runId: string,
  payload: EventIntelligenceRunUpdate,
) {
  const { data, error } = await supabase
    .from("event_intelligence_runs")
    .update(payload)
    .eq("id", runId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update event intelligence run: ${error.message}`);
  }

  return data;
}

export async function insertEventIntelligenceRunItem(
  supabase: SupabaseClient<Database>,
  payload: EventIntelligenceRunItemInsert,
) {
  const { error } = await supabase.from("event_intelligence_run_items").insert(payload);

  if (error) {
    throw new Error(`Failed to insert event intelligence run item: ${error.message}`);
  }
}

export async function getLastSuccessfulEventIntelligenceRun(
  supabase: SupabaseClient<Database>,
) {
  const { data, error } = await supabase
    .from("event_intelligence_runs")
    .select("*")
    .eq("status", "succeeded")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load prior event intelligence run: ${error.message}`);
  }

  return data;
}

export async function loadCandidateRawItems(
  supabase: SupabaseClient<Database>,
  {
    runType,
  }: {
    runType: "incremental" | "full" | "manual_replay";
  },
): Promise<EventIntelligenceRawItemCandidate[]> {
  const [lastSuccessfulRun, rawItemsResult, membershipsResult] = await Promise.all([
    runType === "full" ? Promise.resolve(null) : getLastSuccessfulEventIntelligenceRun(supabase),
    supabase.from("raw_items").select("*").order("collected_at", { ascending: true }),
    supabase.from("event_raw_items").select("*"),
  ]);

  if (rawItemsResult.error) {
    throw new Error(`Failed to load raw items for event intelligence: ${rawItemsResult.error.message}`);
  }

  if (membershipsResult.error) {
    throw new Error(
      `Failed to load raw-item memberships for event intelligence: ${membershipsResult.error.message}`,
    );
  }

  const rawItems = rawItemsResult.data ?? [];
  const memberships = membershipsResult.data ?? [];
  const membershipByRawItemId = new Map(
    memberships.map((membership) => [membership.raw_item_id, membership]),
  );
  const rawItemLinks = await loadRawItemLinks(
    supabase,
    rawItems.map((item) => item.id),
  );
  const linksByRawItem = mapRawItemLinksByRawItem(rawItemLinks);
  const lastFinishedAt = lastSuccessfulRun?.finished_at ?? null;

  return rawItems
    .map((rawItem) => ({
      rawItem,
      rawItemLinks: linksByRawItem.get(rawItem.id) ?? [],
      existingMembership: membershipByRawItemId.get(rawItem.id) ?? null,
    }))
    .filter((candidate) => {
      if (runType === "full") {
        return true;
      }

      if (!candidate.existingMembership) {
        return true;
      }

      if (!lastFinishedAt) {
        return true;
      }

      return candidate.rawItem.updated_at > lastFinishedAt;
    });
}

export async function loadAllEventContexts(
  supabase: SupabaseClient<Database>,
) {
  const [eventsResult, membershipsResult, eventLinksResult] = await Promise.all([
    supabase
      .from("canonical_events")
      .select("*")
      .is("merged_into_event_id", null)
      .order("updated_at", { ascending: false }),
    supabase.from("event_raw_items").select("*"),
    supabase.from("event_links").select("*"),
  ]);

  if (eventsResult.error) {
    throw new Error(`Failed to load canonical events: ${eventsResult.error.message}`);
  }

  if (membershipsResult.error) {
    throw new Error(`Failed to load event memberships: ${membershipsResult.error.message}`);
  }

  if (eventLinksResult.error) {
    throw new Error(`Failed to load event links: ${eventLinksResult.error.message}`);
  }

  const events = eventsResult.data ?? [];
  const memberships = membershipsResult.data ?? [];
  const eventLinks = eventLinksResult.data ?? [];
  const rawItemIds = Array.from(
    new Set([
      ...events.map((event) => event.primary_raw_item_id),
      ...memberships.map((membership) => membership.raw_item_id),
    ]),
  );
  const rawItems = await loadRawItems(supabase, rawItemIds);
  const rawItemById = new Map(rawItems.map((rawItem) => [rawItem.id, rawItem]));
  const membershipsByEventId = new Map<string, EventRawItemRow[]>();
  const eventLinksByEventId = new Map<string, EventLinkRow[]>();

  for (const membership of memberships) {
    const existing = membershipsByEventId.get(membership.event_id) ?? [];
    existing.push(membership);
    membershipsByEventId.set(membership.event_id, existing);
  }

  for (const eventLink of eventLinks) {
    const existing = eventLinksByEventId.get(eventLink.event_id) ?? [];
    existing.push(eventLink);
    eventLinksByEventId.set(eventLink.event_id, existing);
  }

  return new Map<string, CandidateEventContext>(
    events.map((event) => {
      const eventMemberships = membershipsByEventId.get(event.id) ?? [];
      const eventRawItems = eventMemberships
        .map((membership) => rawItemById.get(membership.raw_item_id))
        .filter((rawItem): rawItem is RawItemRow => Boolean(rawItem));

      return [
        event.id,
        {
          event,
          primaryRawItem: rawItemById.get(event.primary_raw_item_id) ?? null,
          memberships: eventMemberships,
          rawItems: eventRawItems,
          eventLinks: eventLinksByEventId.get(event.id) ?? [],
        },
      ];
    }),
  );
}

export async function loadEventContext(
  supabase: SupabaseClient<Database>,
  eventId: string,
) {
  const { data: event, error: eventError } = await supabase
    .from("canonical_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Failed to load canonical event: ${eventError.message}`);
  }

  if (!event) {
    return null;
  }

  const [{ data: memberships, error: membershipError }, { data: eventLinks, error: linkError }] =
    await Promise.all([
      supabase.from("event_raw_items").select("*").eq("event_id", eventId),
      supabase.from("event_links").select("*").eq("event_id", eventId),
    ]);

  if (membershipError) {
    throw new Error(`Failed to load event memberships: ${membershipError.message}`);
  }

  if (linkError) {
    throw new Error(`Failed to load event links: ${linkError.message}`);
  }

  const rawItems = await loadRawItems(
    supabase,
    Array.from(
      new Set([
        event.primary_raw_item_id,
        ...(memberships ?? []).map((membership) => membership.raw_item_id),
      ]),
    ),
  );
  const rawItemById = new Map(rawItems.map((rawItem) => [rawItem.id, rawItem]));

  return {
    event,
    primaryRawItem: rawItemById.get(event.primary_raw_item_id) ?? null,
    memberships: memberships ?? [],
    rawItems,
    eventLinks: eventLinks ?? [],
  } satisfies CandidateEventContext;
}

export async function createCanonicalEvent(
  supabase: SupabaseClient<Database>,
  payload: CanonicalEventInsert,
) {
  const { data, error } = await supabase
    .from("canonical_events")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create canonical event: ${error.message}`);
  }

  return data;
}

export async function updateCanonicalEvent(
  supabase: SupabaseClient<Database>,
  eventId: string,
  payload: CanonicalEventUpdate,
) {
  const { data, error } = await supabase
    .from("canonical_events")
    .update(payload)
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update canonical event: ${error.message}`);
  }

  return data;
}

export async function upsertEventMembership(
  supabase: SupabaseClient<Database>,
  payload: EventRawItemInsert,
) {
  const { data: existing, error: existingError } = await supabase
    .from("event_raw_items")
    .select("*")
    .eq("raw_item_id", payload.raw_item_id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to look up event membership: ${existingError.message}`);
  }

  if (!existing) {
    const { data, error } = await supabase
      .from("event_raw_items")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to insert event membership: ${error.message}`);
    }

    return data;
  }

  if (existing.event_id !== payload.event_id) {
    throw new Error(
      `Raw item ${payload.raw_item_id} is already assigned to a different canonical event.`,
    );
  }

  const updatePayload: EventRawItemUpdate = {
    event_id: payload.event_id,
    source_role: payload.source_role,
    is_primary: payload.is_primary,
    is_material_update: payload.is_material_update,
    assignment_method: payload.assignment_method,
    assignment_score: payload.assignment_score,
    reason_summary: payload.reason_summary,
    metadata_json: payload.metadata_json,
  };

  if (!hasMembershipChanges(existing, updatePayload)) {
    return existing;
  }

  const { data, error } = await supabase
    .from("event_raw_items")
    .update(updatePayload)
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update event membership: ${error.message}`);
  }

  return data;
}

export async function setPrimaryEventMembership(
  supabase: SupabaseClient<Database>,
  eventId: string,
  primaryRawItemId: string,
) {
  const { error: resetError } = await supabase
    .from("event_raw_items")
    .update({ is_primary: false })
    .eq("event_id", eventId)
    .eq("is_primary", true);

  if (resetError) {
    throw new Error(`Failed to reset primary event memberships: ${resetError.message}`);
  }

  const { error: setError } = await supabase
    .from("event_raw_items")
    .update({ is_primary: true })
    .eq("event_id", eventId)
    .eq("raw_item_id", primaryRawItemId);

  if (setError) {
    throw new Error(`Failed to set primary event membership: ${setError.message}`);
  }
}

export async function upsertEventLinks(
  supabase: SupabaseClient<Database>,
  eventId: string,
  promotedLinks: PromotedEventLinkCandidate[],
) {
  const { data: existingRows, error: existingError } = await supabase
    .from("event_links")
    .select("*")
    .eq("event_id", eventId);

  if (existingError) {
    throw new Error(`Failed to load existing event links: ${existingError.message}`);
  }

  const existingByKey = new Map(
    (existingRows ?? []).map((row) => [`${row.normalized_url}|${row.link_role}`, row]),
  );

  for (const promotedLink of promotedLinks) {
    const key = `${promotedLink.normalizedUrl}|${promotedLink.linkRole}`;
    const existing = existingByKey.get(key);

    if (!existing) {
      const insertPayload: EventLinkInsert = {
        event_id: eventId,
        raw_item_link_id: promotedLink.rawItemLinkId ?? null,
        source_raw_item_id: promotedLink.sourceRawItemId,
        raw_url: promotedLink.rawUrl,
        normalized_url: promotedLink.normalizedUrl,
        domain: promotedLink.domain ?? null,
        title: promotedLink.title ?? null,
        link_role: promotedLink.linkRole,
        provenance_count: 1,
        is_canonical: promotedLink.isCanonical,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        metadata_json: {
          reason: promotedLink.reason,
          sourceRawItemIds: [promotedLink.sourceRawItemId],
        } as Json,
      };

      const { data, error } = await supabase
        .from("event_links")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        throw new Error(`Failed to insert event link: ${error.message}`);
      }

      existingByKey.set(key, data);
      continue;
    }

    const { metadataJson, provenanceIncrement } = mergeEventLinkMetadata(
      existing.metadata_json,
      promotedLink.sourceRawItemId,
    );
    const updatePayload: EventLinkUpdate = {
      raw_item_link_id: existing.raw_item_link_id ?? promotedLink.rawItemLinkId ?? null,
      source_raw_item_id: existing.source_raw_item_id ?? promotedLink.sourceRawItemId,
      raw_url: existing.raw_url,
      normalized_url: existing.normalized_url,
      domain: existing.domain ?? promotedLink.domain ?? null,
      title: existing.title ?? promotedLink.title ?? null,
      provenance_count: existing.provenance_count + provenanceIncrement,
      is_canonical: existing.is_canonical || promotedLink.isCanonical,
      last_seen_at: new Date().toISOString(),
      metadata_json: metadataJson as Json,
    };

    const { data, error } = await supabase
      .from("event_links")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update event link: ${error.message}`);
    }

    existingByKey.set(key, data);
  }
}

export async function refreshCanonicalEventState(
  supabase: SupabaseClient<Database>,
  {
    eventId,
    breakingWindowHours,
    latestAssignmentMethod,
  }: {
    eventId: string;
    breakingWindowHours: number;
    latestAssignmentMethod: EventAssignmentMethod;
  },
) {
  const context = await loadEventContext(supabase, eventId);

  if (!context) {
    throw new Error(`Canonical event ${eventId} not found for refresh.`);
  }

  const refreshResult = buildEventRefreshResult({
    existingEvent: context.event,
    rawItems: context.rawItems,
    roleByRawItemId: roleMapFromMemberships(context.memberships),
    promotedLinks: toPromotedLinks(context.eventLinks),
    now: new Date(),
    breakingWindowHours,
    latestAssignmentMethod,
  });
  const updatePayload: CanonicalEventUpdate = {
    stable_key: refreshResult.stableKey,
    title: refreshResult.title,
    summary: refreshResult.summary,
    primary_lane: refreshResult.primaryLane,
    lane_hints: refreshResult.laneHints,
    event_traits: refreshResult.eventTraits,
    event_kind_hint: refreshResult.eventKindHint,
    status: refreshResult.status,
    primary_raw_item_id: refreshResult.primaryRawItemId,
    primary_source_role: refreshResult.primarySourceRole,
    latest_seen_at: refreshResult.latestSeenAt,
    last_material_update_at: refreshResult.lastMaterialUpdateAt,
    member_count: refreshResult.memberCount,
    material_update_count: refreshResult.materialUpdateCount,
    cluster_explanation_json: refreshResult.clusterExplanationJson as Json,
    metadata_json: refreshResult.metadataJson as Json,
  };

  const changed = hasEventChanges(context.event, updatePayload);
  const event = changed
    ? await updateCanonicalEvent(supabase, eventId, updatePayload)
    : context.event;

  await setPrimaryEventMembership(supabase, eventId, refreshResult.primaryRawItemId);

  return {
    event,
    changed,
  };
}

export async function createCanonicalEventFromSeed(
  supabase: SupabaseClient<Database>,
  {
    rawItem,
    rawItemLinks,
    roleDecision,
    breakingWindowHours,
  }: {
    rawItem: RawItemRow;
    rawItemLinks: RawItemLinkRow[];
    roleDecision: EventRoleDecision;
    breakingWindowHours: number;
  },
) {
  const promotedLinks = buildPromotedEventLinks(rawItem, rawItemLinks);
  const roleByRawItemId = new Map([[rawItem.id, roleDecision]]);
  const refreshResult = buildEventRefreshResult({
    rawItems: [rawItem],
    roleByRawItemId,
    promotedLinks,
    now: new Date(),
    breakingWindowHours,
    latestAssignmentMethod: "new_event",
  });

  const event = await createCanonicalEvent(supabase, {
    stable_key: refreshResult.stableKey,
    title: refreshResult.title,
    summary: refreshResult.summary,
    primary_lane: refreshResult.primaryLane,
    lane_hints: refreshResult.laneHints,
    event_traits: refreshResult.eventTraits,
    event_kind_hint: refreshResult.eventKindHint,
    status: refreshResult.status,
    primary_raw_item_id: refreshResult.primaryRawItemId,
    primary_source_role: refreshResult.primarySourceRole,
    first_seen_at: rawItem.collected_at,
    latest_seen_at: refreshResult.latestSeenAt,
    last_material_update_at: refreshResult.lastMaterialUpdateAt,
    member_count: refreshResult.memberCount,
    material_update_count: refreshResult.materialUpdateCount,
    cluster_explanation_json: refreshResult.clusterExplanationJson as Json,
    metadata_json: refreshResult.metadataJson as Json,
  });

  return {
    event,
    promotedLinks,
  };
}

async function createEventManualOverride(
  supabase: SupabaseClient<Database>,
  payload: EventManualOverrideInsert,
) {
  const { data, error } = await supabase
    .from("event_manual_overrides")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create event manual override: ${error.message}`);
  }

  return data;
}

async function loadEventMembershipByRawItemId(
  supabase: SupabaseClient<Database>,
  rawItemId: string,
) {
  const { data, error } = await supabase
    .from("event_raw_items")
    .select("*")
    .eq("raw_item_id", rawItemId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load event membership for raw item: ${error.message}`);
  }

  return data;
}

async function reassignEventMembership(
  supabase: SupabaseClient<Database>,
  {
    rawItemId,
    targetEventId,
    sourceEventId,
  }: {
    rawItemId: string;
    targetEventId: string;
    sourceEventId: string;
  },
) {
  const membership = await loadEventMembershipByRawItemId(supabase, rawItemId);

  if (!membership) {
    throw new Error(`Raw item ${rawItemId} is not assigned to any canonical event.`);
  }

  const { data, error } = await supabase
    .from("event_raw_items")
    .update({
      event_id: targetEventId,
      is_primary: false,
      metadata_json: mergeJsonObject(membership.metadata_json, {
        manualOverride: true,
        manualReassignedFromEventId: sourceEventId,
        manualReassignedToEventId: targetEventId,
      }) as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to reassign raw item membership: ${error.message}`);
  }

  return data;
}

export async function applyEventManualOverride(
  supabase: SupabaseClient<Database>,
  options: ApplyEventManualOverrideOptions & {
    breakingWindowHours: number;
  },
) {
  const payloadJson = options.payloadJson ?? {};

  switch (options.actionType) {
    case "pin_primary_raw_item": {
      if (!options.eventId || !options.primaryRawItemId) {
        throw new Error("pin_primary_raw_item requires eventId and primaryRawItemId.");
      }

      const context = await loadEventContext(supabase, options.eventId);
      if (!context) {
        throw new Error(`Canonical event ${options.eventId} was not found.`);
      }

      if (context.event.merged_into_event_id) {
        throw new Error(`Canonical event ${options.eventId} is already merged.`);
      }

      const isMember = context.memberships.some(
        (membership) => membership.raw_item_id === options.primaryRawItemId,
      );

      if (!isMember) {
        throw new Error(
          `Raw item ${options.primaryRawItemId} is not a member of canonical event ${options.eventId}.`,
        );
      }

      await updateCanonicalEvent(supabase, options.eventId, {
        primary_raw_item_override_id: options.primaryRawItemId,
      });
      await refreshCanonicalEventState(supabase, {
        eventId: options.eventId,
        breakingWindowHours: options.breakingWindowHours,
        latestAssignmentMethod: "existing_membership",
      });
      const override = await createEventManualOverride(supabase, {
        action_type: options.actionType,
        event_id: options.eventId,
        primary_raw_item_id: options.primaryRawItemId,
        reason: options.reason,
        payload_json: payloadJson as Json,
      });

      return {
        override,
        affectedEventIds: [options.eventId],
      };
    }

    case "merge_event": {
      if (!options.eventId || !options.targetEventId) {
        throw new Error("merge_event requires eventId and targetEventId.");
      }

      if (options.eventId === options.targetEventId) {
        throw new Error("merge_event requires different source and target events.");
      }

      const [sourceContext, targetContext] = await Promise.all([
        loadEventContext(supabase, options.eventId),
        loadEventContext(supabase, options.targetEventId),
      ]);

      if (!sourceContext || !targetContext) {
        throw new Error("Both source and target canonical events must exist.");
      }

      if (targetContext.event.merged_into_event_id) {
        throw new Error(`Target event ${options.targetEventId} is already merged.`);
      }

      for (const membership of sourceContext.memberships) {
        await reassignEventMembership(supabase, {
          rawItemId: membership.raw_item_id,
          sourceEventId: sourceContext.event.id,
          targetEventId: targetContext.event.id,
        });
      }

      await updateCanonicalEvent(supabase, sourceContext.event.id, {
        merged_into_event_id: targetContext.event.id,
        status: "archived",
        member_count: 0,
        material_update_count: 0,
        primary_raw_item_override_id: null,
        metadata_json: mergeJsonObject(sourceContext.event.metadata_json, {
          mergedIntoEventId: targetContext.event.id,
          mergeReason: options.reason,
          manualOverride: true,
        }) as Json,
      });

      await refreshCanonicalEventState(supabase, {
        eventId: targetContext.event.id,
        breakingWindowHours: options.breakingWindowHours,
        latestAssignmentMethod: "existing_membership",
      });
      const override = await createEventManualOverride(supabase, {
        action_type: options.actionType,
        event_id: sourceContext.event.id,
        target_event_id: targetContext.event.id,
        reason: options.reason,
        payload_json: payloadJson as Json,
      });

      return {
        override,
        affectedEventIds: [sourceContext.event.id, targetContext.event.id],
      };
    }

    case "reassign_raw_item": {
      if (!options.rawItemId || !options.targetEventId) {
        throw new Error("reassign_raw_item requires rawItemId and targetEventId.");
      }

      const membership = await loadEventMembershipByRawItemId(supabase, options.rawItemId);
      if (!membership) {
        throw new Error(`Raw item ${options.rawItemId} is not assigned to any canonical event.`);
      }

      if (membership.event_id === options.targetEventId) {
        throw new Error(`Raw item ${options.rawItemId} already belongs to ${options.targetEventId}.`);
      }

      const [sourceContext, targetContext] = await Promise.all([
        loadEventContext(supabase, membership.event_id),
        loadEventContext(supabase, options.targetEventId),
      ]);

      if (!sourceContext || !targetContext) {
        throw new Error("Both source and target canonical events must exist.");
      }

      if (targetContext.event.merged_into_event_id) {
        throw new Error(`Target event ${options.targetEventId} is already merged.`);
      }

      if (sourceContext.memberships.length <= 1) {
        throw new Error(
          `Cannot reassign the only raw item in canonical event ${sourceContext.event.id}. Merge the event instead.`,
        );
      }

      await reassignEventMembership(supabase, {
        rawItemId: options.rawItemId,
        sourceEventId: sourceContext.event.id,
        targetEventId: targetContext.event.id,
      });

      if (sourceContext.event.primary_raw_item_override_id === options.rawItemId) {
        await updateCanonicalEvent(supabase, sourceContext.event.id, {
          primary_raw_item_override_id: null,
        });
      }

      await Promise.all([
        refreshCanonicalEventState(supabase, {
          eventId: sourceContext.event.id,
          breakingWindowHours: options.breakingWindowHours,
          latestAssignmentMethod: "existing_membership",
        }),
        refreshCanonicalEventState(supabase, {
          eventId: targetContext.event.id,
          breakingWindowHours: options.breakingWindowHours,
          latestAssignmentMethod: "existing_membership",
        }),
      ]);

      const override = await createEventManualOverride(supabase, {
        action_type: options.actionType,
        event_id: sourceContext.event.id,
        target_event_id: targetContext.event.id,
        raw_item_id: options.rawItemId,
        reason: options.reason,
        payload_json: payloadJson as Json,
      });

      return {
        override,
        affectedEventIds: [sourceContext.event.id, targetContext.event.id],
      };
    }
  }
}

export async function listRecentEventIntelligenceRuns(
  supabase: SupabaseClient<Database>,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("event_intelligence_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list event intelligence runs: ${error.message}`);
  }

  return data ?? [];
}

export async function getEventIntelligenceRunDetails(
  supabase: SupabaseClient<Database>,
  runId: string,
) {
  const [{ data: run, error: runError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase.from("event_intelligence_runs").select("*").eq("id", runId).maybeSingle(),
      supabase
        .from("event_intelligence_run_items")
        .select("*")
        .eq("event_intelligence_run_id", runId)
        .order("processed_at", { ascending: true }),
    ]);

  if (runError) {
    throw new Error(`Failed to load event intelligence run: ${runError.message}`);
  }

  if (itemsError) {
    throw new Error(`Failed to load event intelligence run items: ${itemsError.message}`);
  }

  const runItems = items ?? [];
  const rawItemIds = Array.from(new Set(runItems.map((item) => item.raw_item_id)));
  const eventIds = Array.from(
    new Set(runItems.flatMap((item) => (item.event_id ? [item.event_id] : []))),
  );
  const [rawItems, events] = await Promise.all([
    loadRawItems(supabase, rawItemIds),
    eventIds.length > 0
      ? supabase.from("canonical_events").select("*").in("id", eventIds)
      : Promise.resolve({ data: [] as CanonicalEventRow[], error: null }),
  ]);

  if (events.error) {
    throw new Error(`Failed to load canonical events for run detail: ${events.error.message}`);
  }

  const rawItemLinks = await loadRawItemLinks(supabase, rawItemIds);
  const rawItemById = new Map(rawItems.map((rawItem) => [rawItem.id, rawItem]));
  const eventById = new Map((events.data ?? []).map((event) => [event.id, event]));
  const rawItemLinksByRawItemId = mapRawItemLinksByRawItem(rawItemLinks);

  return {
    run,
    items: runItems.map((item) => ({
      ...item,
      raw_item: rawItemById.get(item.raw_item_id) ?? null,
      raw_item_links: rawItemLinksByRawItemId.get(item.raw_item_id) ?? [],
      event: item.event_id ? eventById.get(item.event_id) ?? null : null,
    })),
  };
}

export async function getCanonicalEventDetails(
  supabase: SupabaseClient<Database>,
  eventId: string,
) {
  const context = await loadEventContext(supabase, eventId);

  if (!context) {
    return {
      event: null,
      primaryRawItem: null,
      memberships: [],
      rawItemLinks: [],
      eventLinks: [],
      manualOverrides: [],
    };
  }

  const [{ data: manualOverrides, error: manualOverridesError }, rawItemLinks] = await Promise.all([
    supabase
      .from("event_manual_overrides")
      .select("*")
      .or(`event_id.eq.${eventId},target_event_id.eq.${eventId}`)
      .order("created_at", { ascending: false }),
    loadRawItemLinks(
      supabase,
      context.rawItems.map((rawItem) => rawItem.id),
    ),
  ]);

  if (manualOverridesError) {
    throw new Error(`Failed to load event manual overrides: ${manualOverridesError.message}`);
  }

  const rawItemLinksByRawItemId = mapRawItemLinksByRawItem(rawItemLinks);

  return {
    event: context.event,
    primaryRawItem: context.primaryRawItem,
    memberships: context.memberships.map((membership) => ({
      ...membership,
      raw_item:
        context.rawItems.find((rawItem) => rawItem.id === membership.raw_item_id) ?? null,
      raw_item_links: rawItemLinksByRawItemId.get(membership.raw_item_id) ?? [],
    })),
    eventLinks: context.eventLinks,
    manualOverrides: manualOverrides ?? [],
  };
}
