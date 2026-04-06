import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { IntakeQuerySource } from "@/types";
import type {
  InspectRawItemsFilters,
  PersistedRawItemCounts,
  PersistedRawItemResult,
  QueryIssueSummary,
  RawItemInspection,
  NormalizedRawItem,
} from "./types";

type IntakeRunInsert = Database["public"]["Tables"]["intake_runs"]["Insert"];
type IntakeRunUpdate = Database["public"]["Tables"]["intake_runs"]["Update"];
type IntakeRunQueryInsert = Database["public"]["Tables"]["intake_run_queries"]["Insert"];
type IntakeRunQueryUpdate = Database["public"]["Tables"]["intake_run_queries"]["Update"];
type IntakeRunQueryRow = Database["public"]["Tables"]["intake_run_queries"]["Row"];

type IntakeRunItemRow = Database["public"]["Tables"]["intake_run_items"]["Row"];
type RawItemRow = Database["public"]["Tables"]["raw_items"]["Row"];
type RawItemInsert = Database["public"]["Tables"]["raw_items"]["Insert"];
type RawItemUpdate = Database["public"]["Tables"]["raw_items"]["Update"];
type RawItemLinkRow = Database["public"]["Tables"]["raw_item_links"]["Row"];

function stableStringify(value: unknown) {
  return JSON.stringify(value);
}

function sortStrings(values: string[]) {
  return [...values].sort();
}

function normalizeComparableString(value: string | null | undefined) {
  return value ?? null;
}

function hasMaterialChanges(existing: RawItemRow, item: NormalizedRawItem) {
  return (
    normalizeComparableString(existing.external_id) !==
      normalizeComparableString(item.externalId) ||
    existing.dedupe_key !== item.dedupeKey ||
    normalizeComparableString(existing.matched_trusted_account_id) !==
      normalizeComparableString(item.matchedTrustedAccountId) ||
    normalizeComparableString(existing.author_handle) !==
      normalizeComparableString(item.authorHandle) ||
    normalizeComparableString(existing.author_normalized_handle) !==
      normalizeComparableString(item.authorNormalizedHandle) ||
    normalizeComparableString(existing.author_name) !==
      normalizeComparableString(item.authorName) ||
    normalizeComparableString(existing.author_url) !==
      normalizeComparableString(item.authorUrl) ||
    normalizeComparableString(existing.title) !== normalizeComparableString(item.title) ||
    normalizeComparableString(existing.raw_text) !==
      normalizeComparableString(item.rawText) ||
    normalizeComparableString(existing.normalized_text) !==
      normalizeComparableString(item.normalizedText) ||
    existing.raw_url !== item.rawUrl ||
    existing.normalized_url !== item.normalizedUrl ||
    normalizeComparableString(existing.published_at) !==
      normalizeComparableString(item.publishedAt) ||
    normalizeComparableString(existing.language_code) !==
      normalizeComparableString(item.languageCode) ||
    stableStringify(sortStrings(existing.lane_hints)) !==
      stableStringify(sortStrings(item.laneHints)) ||
    normalizeComparableString(existing.item_kind_hint) !==
      normalizeComparableString(item.itemKindHint) ||
    existing.is_from_trusted_account !== item.isFromTrustedAccount ||
    existing.is_repost !== item.isRepost ||
    existing.is_quote !== item.isQuote ||
    existing.is_reply !== item.isReply ||
    stableStringify(existing.raw_payload_json) !== stableStringify(item.rawPayloadJson) ||
    stableStringify(existing.metadata_json) !== stableStringify(item.metadataJson)
  );
}

function toRawItemInsert(
  item: NormalizedRawItem,
  runId: string,
): RawItemInsert {
  return {
    source_type: item.sourceType,
    platform: item.platform,
    external_id: item.externalId ?? null,
    dedupe_key: item.dedupeKey,
    matched_trusted_account_id: item.matchedTrustedAccountId ?? null,
    author_handle: item.authorHandle ?? null,
    author_normalized_handle: item.authorNormalizedHandle ?? null,
    author_name: item.authorName ?? null,
    author_url: item.authorUrl ?? null,
    title: item.title ?? null,
    raw_text: item.rawText ?? null,
    normalized_text: item.normalizedText ?? null,
    raw_url: item.rawUrl,
    normalized_url: item.normalizedUrl,
    published_at: item.publishedAt ?? null,
    collected_at: item.collectedAt,
    language_code: item.languageCode ?? null,
    lane_hints: item.laneHints,
    item_kind_hint: item.itemKindHint ?? null,
    is_from_trusted_account: item.isFromTrustedAccount,
    is_repost: item.isRepost,
    is_quote: item.isQuote,
    is_reply: item.isReply,
    raw_payload_json: item.rawPayloadJson as Json,
    metadata_json: item.metadataJson as Json,
    first_seen_run_id: runId,
  };
}

function toRawItemUpdate(item: NormalizedRawItem): RawItemUpdate {
  return {
    matched_trusted_account_id: item.matchedTrustedAccountId ?? null,
    author_handle: item.authorHandle ?? null,
    author_normalized_handle: item.authorNormalizedHandle ?? null,
    author_name: item.authorName ?? null,
    author_url: item.authorUrl ?? null,
    title: item.title ?? null,
    raw_text: item.rawText ?? null,
    normalized_text: item.normalizedText ?? null,
    raw_url: item.rawUrl,
    normalized_url: item.normalizedUrl,
    published_at: item.publishedAt ?? null,
    collected_at: item.collectedAt,
    language_code: item.languageCode ?? null,
    lane_hints: item.laneHints,
    item_kind_hint: item.itemKindHint ?? null,
    is_from_trusted_account: item.isFromTrustedAccount,
    is_repost: item.isRepost,
    is_quote: item.isQuote,
    is_reply: item.isReply,
    raw_payload_json: item.rawPayloadJson as Json,
    metadata_json: item.metadataJson as Json,
    updated_at: new Date().toISOString(),
  };
}

function buildObservationNotes(item: NormalizedRawItem) {
  const notes: string[] = [];

  if (item.metadataJson.querySource) {
    notes.push(`query_source:${String(item.metadataJson.querySource)}`);
  }

  if (item.itemKindHint) {
    notes.push(`item_kind:${item.itemKindHint}`);
  }

  return notes.length > 0 ? notes.join("|") : null;
}

function isUniqueViolation(error: PostgrestError | null) {
  return error?.code === "23505";
}

function asObject(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function extractQueryIssues(value: Json | null): QueryIssueSummary[] {
  const summary = asObject(value);
  const skippedItems = summary.skippedItems;

  if (!Array.isArray(skippedItems)) {
    return [];
  }

  return skippedItems
    .filter(
      (issue): issue is Record<string, unknown> =>
        typeof issue === "object" && issue !== null && !Array.isArray(issue),
    )
    .map((issue) => ({
      code:
        typeof issue.code === "string"
          ? (issue.code as QueryIssueSummary["code"])
          : "invalid_item_shape",
      message:
        typeof issue.message === "string"
          ? issue.message
          : "Unknown intake issue.",
      itemIndex:
        typeof issue.itemIndex === "number" ? issue.itemIndex : null,
    }));
}

async function findExistingRawItem(
  supabase: SupabaseClient<Database>,
  item: NormalizedRawItem,
) {
  if (item.externalId) {
    const { data, error } = await supabase
      .from("raw_items")
      .select("*")
      .eq("platform", item.platform)
      .eq("external_id", item.externalId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to look up existing raw item by external id: ${error.message}`);
    }

    if (data) {
      return data;
    }
  }

  const { data, error } = await supabase
    .from("raw_items")
    .select("*")
    .eq("dedupe_key", item.dedupeKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up existing raw item by dedupe key: ${error.message}`);
  }

  return data;
}

async function upsertRawItemLinks(
  supabase: SupabaseClient<Database>,
  rawItemId: string,
  links: NormalizedRawItem["extractedLinks"],
) {
  if (links.length === 0) {
    return;
  }

  const { error } = await supabase.from("raw_item_links").upsert(
    links.map((link) => ({
      raw_item_id: rawItemId,
      discovered_via: link.discoveredVia,
      link_role: link.linkRole,
      raw_url: link.rawUrl,
      normalized_url: link.normalizedUrl,
      domain: link.domain ?? null,
      title: link.title ?? null,
      position: link.position ?? null,
    })),
    {
      onConflict: "raw_item_id,normalized_url,link_role",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(`Failed to upsert raw item links: ${error.message}`);
  }
}

async function insertRunObservation(
  supabase: SupabaseClient<Database>,
  {
    intakeRunId,
    intakeRunQueryId,
    rawItemId,
    providerResultRank,
    persistenceAction,
    matchedTrustedAccountId,
    notes,
  }: {
    intakeRunId: string;
    intakeRunQueryId: string;
    rawItemId: string;
    providerResultRank: number;
    persistenceAction: PersistedRawItemResult["persistenceAction"];
    matchedTrustedAccountId?: string | null;
    notes?: string | null;
  },
) {
  const { error } = await supabase.from("intake_run_items").insert({
    intake_run_id: intakeRunId,
    intake_run_query_id: intakeRunQueryId,
    raw_item_id: rawItemId,
    provider_result_rank: providerResultRank,
    persistence_action: persistenceAction,
    matched_trusted_account_id: matchedTrustedAccountId ?? null,
    notes: notes ?? null,
  });

  if (error) {
    throw new Error(`Failed to insert intake run observation: ${error.message}`);
  }
}

export async function createIntakeRun(
  supabase: SupabaseClient<Database>,
  payload: IntakeRunInsert,
) {
  const { data, error } = await supabase
    .from("intake_runs")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create intake run: ${error.message}`);
  }

  return data;
}

export async function updateIntakeRun(
  supabase: SupabaseClient<Database>,
  intakeRunId: string,
  payload: IntakeRunUpdate,
) {
  const { data, error } = await supabase
    .from("intake_runs")
    .update(payload)
    .eq("id", intakeRunId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update intake run: ${error.message}`);
  }

  return data;
}

export async function createIntakeRunQuery(
  supabase: SupabaseClient<Database>,
  payload: IntakeRunQueryInsert,
) {
  const { data, error } = await supabase
    .from("intake_run_queries")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create intake run query: ${error.message}`);
  }

  return data;
}

export async function updateIntakeRunQuery(
  supabase: SupabaseClient<Database>,
  intakeRunQueryId: string,
  payload: IntakeRunQueryUpdate,
) {
  const { data, error } = await supabase
    .from("intake_run_queries")
    .update(payload)
    .eq("id", intakeRunQueryId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update intake run query: ${error.message}`);
  }

  return data;
}

async function insertRawItem(
  supabase: SupabaseClient<Database>,
  item: NormalizedRawItem,
  intakeRunId: string,
) {
  const { data, error } = await supabase
    .from("raw_items")
    .insert(toRawItemInsert(item, intakeRunId))
    .select("*")
    .single();

  return { data, error };
}

export async function persistNormalizedItem(
  supabase: SupabaseClient<Database>,
  {
    intakeRunId,
    intakeRunQueryId,
    providerResultRank,
    item,
  }: {
    intakeRunId: string;
    intakeRunQueryId: string;
    providerResultRank: number;
    item: NormalizedRawItem;
  },
): Promise<PersistedRawItemResult & PersistedRawItemCounts> {
  let existing = await findExistingRawItem(supabase, item);
  let rawItemId: string;
  let persistenceAction: PersistedRawItemResult["persistenceAction"];
  const notes = buildObservationNotes(item);

  if (!existing) {
    const insertResult = await insertRawItem(supabase, item, intakeRunId);

    if (insertResult.error && !isUniqueViolation(insertResult.error)) {
      throw new Error(`Failed to insert raw item: ${insertResult.error.message}`);
    }

    if (insertResult.data) {
      rawItemId = insertResult.data.id;
      persistenceAction = "inserted";
    } else {
      existing = await findExistingRawItem(supabase, item);

      if (!existing) {
        throw new Error("Raw item insert conflicted, but no existing item could be resolved.");
      }

      rawItemId = existing.id;
      persistenceAction = "unchanged";
    }
  } else {
    rawItemId = existing.id;
    persistenceAction = "unchanged";
  }

  let updatedCount = 0;
  let dedupedCount = 0;
  let insertedCount = 0;

  if (persistenceAction === "inserted") {
    insertedCount = 1;
  } else if (existing) {
    dedupedCount = 1;
    const materialChanges = hasMaterialChanges(existing, item);

    if (materialChanges) {
      const { data, error } = await supabase
        .from("raw_items")
        .update(toRawItemUpdate(item))
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        throw new Error(`Failed to update raw item: ${error.message}`);
      }

      rawItemId = data.id;
      persistenceAction = "updated";
      updatedCount = 1;
    }
  }

  await upsertRawItemLinks(supabase, rawItemId, item.extractedLinks);
  await insertRunObservation(supabase, {
    intakeRunId,
    intakeRunQueryId,
    rawItemId,
    providerResultRank,
    persistenceAction,
    matchedTrustedAccountId: item.matchedTrustedAccountId,
    notes,
  });

  return {
    rawItemId,
    matchedTrustedAccountId: item.matchedTrustedAccountId,
    persistenceAction,
    notes,
    insertedCount,
    updatedCount,
    dedupedCount,
  };
}

export async function listRecentIntakeRuns(
  supabase: SupabaseClient<Database>,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("intake_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list intake runs: ${error.message}`);
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
    .in("raw_item_id", rawItemIds)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to load raw item links: ${error.message}`);
  }

  return data ?? [];
}

function mapLinksByRawItem(links: RawItemLinkRow[]) {
  const linkMap = new Map<string, RawItemLinkRow[]>();

  for (const link of links) {
    const existing = linkMap.get(link.raw_item_id) ?? [];
    existing.push(link);
    linkMap.set(link.raw_item_id, existing);
  }

  return linkMap;
}

export async function getIntakeRunDetails(
  supabase: SupabaseClient<Database>,
  intakeRunId: string,
) {
  const [
    { data: run, error: runError },
    { data: queries, error: queryError },
    { data: observations, error: observationError },
  ] = await Promise.all([
    supabase.from("intake_runs").select("*").eq("id", intakeRunId).maybeSingle(),
    supabase
      .from("intake_run_queries")
      .select("*")
      .eq("intake_run_id", intakeRunId)
      .order("started_at", { ascending: true }),
    supabase
      .from("intake_run_items")
      .select("*")
      .eq("intake_run_id", intakeRunId)
      .order("observed_at", { ascending: true }),
  ]);

  if (runError) {
    throw new Error(`Failed to load intake run: ${runError.message}`);
  }

  if (queryError) {
    throw new Error(`Failed to load intake run queries: ${queryError.message}`);
  }

  if (observationError) {
    throw new Error(`Failed to load intake run observations: ${observationError.message}`);
  }

  const rawItemIds = Array.from(
    new Set((observations ?? []).map((observation) => observation.raw_item_id)),
  );

  const [rawItemsResult, rawItemLinks] = await Promise.all([
    rawItemIds.length > 0
      ? supabase.from("raw_items").select("*").in("id", rawItemIds)
      : Promise.resolve({ data: [] as RawItemRow[], error: null }),
    loadRawItemLinks(supabase, rawItemIds),
  ]);

  if (rawItemsResult.error) {
    throw new Error(`Failed to load raw items for intake run: ${rawItemsResult.error.message}`);
  }

  const rawItems = rawItemsResult.data ?? [];
  const rawItemMap = new Map(rawItems.map((item) => [item.id, item]));
  const linkMap = mapLinksByRawItem(rawItemLinks);

  return {
    run,
    queries: (queries ?? []).map((query) => ({
      ...query,
      issues: extractQueryIssues(query.response_summary_json),
    })),
    items: (observations ?? []).map((observation) => ({
      ...observation,
      raw_item: rawItemMap.get(observation.raw_item_id) ?? null,
      raw_item_links: linkMap.get(observation.raw_item_id) ?? [],
    })),
  };
}

function mapObservationsByRawItem(
  observations: IntakeRunItemRow[],
  querySourceByQueryId: Map<string, IntakeQuerySource>,
) {
  const observationMap = new Map<string, RawItemInspection["observations"]>();

  for (const observation of observations) {
    const existing = observationMap.get(observation.raw_item_id) ?? [];
    existing.push({
      querySource: querySourceByQueryId.get(observation.intake_run_query_id) ?? null,
      observedAt: observation.observed_at,
      notes: observation.notes,
    });
    observationMap.set(observation.raw_item_id, existing);
  }

  return observationMap;
}

export async function listInspectableRawItems(
  supabase: SupabaseClient<Database>,
  filters: InspectRawItemsFilters,
) {
  const recentSince =
    typeof filters.recentHours === "number"
      ? new Date(Date.now() - filters.recentHours * 60 * 60 * 1000).toISOString()
      : null;
  const scanLimit = filters.querySource
    ? Math.max(filters.limit * 10, 100)
    : filters.limit;

  let query = supabase
    .from("raw_items")
    .select("*")
    .order("collected_at", { ascending: false })
    .limit(scanLimit);

  if (filters.platform) {
    query = query.eq("platform", filters.platform);
  }

  if (filters.trustedOnly) {
    query = query.eq("is_from_trusted_account", true);
  }

  if (recentSince) {
    query = query.gte("collected_at", recentSince);
  }

  const { data: rawItems, error } = await query;

  if (error) {
    throw new Error(`Failed to list raw items: ${error.message}`);
  }

  const candidateItems = rawItems ?? [];
  const rawItemIds = candidateItems.map((item) => item.id);
  const [links, observationsResult] = await Promise.all([
    loadRawItemLinks(supabase, rawItemIds),
    rawItemIds.length > 0
      ? supabase
          .from("intake_run_items")
          .select("*")
          .in("raw_item_id", rawItemIds)
          .order("observed_at", { ascending: false })
      : Promise.resolve({ data: [] as IntakeRunItemRow[], error: null }),
  ]);

  if (observationsResult.error) {
    throw new Error(`Failed to load raw item observations: ${observationsResult.error.message}`);
  }

  const observations = observationsResult.data ?? [];
  const queryIds = Array.from(
    new Set(observations.map((observation) => observation.intake_run_query_id)),
  );

  const queryResult =
    queryIds.length > 0
      ? await supabase
          .from("intake_run_queries")
          .select("id, query_source")
          .in("id", queryIds)
      : { data: [] as Pick<IntakeRunQueryRow, "id" | "query_source">[], error: null };

  if (queryResult.error) {
    throw new Error(`Failed to load intake query metadata: ${queryResult.error.message}`);
  }

  const querySourceByQueryId = new Map(
    (queryResult.data ?? []).map((queryRow) => [
      queryRow.id,
      queryRow.query_source as IntakeQuerySource,
    ]),
  );
  const observationMap = mapObservationsByRawItem(observations, querySourceByQueryId);
  const linkMap = mapLinksByRawItem(links);

  const filteredItems = candidateItems.filter((item) => {
    if (!filters.querySource) {
      return true;
    }

    const itemObservations = observationMap.get(item.id) ?? [];
    return itemObservations.some(
      (observation) => observation.querySource === filters.querySource,
    );
  });

  return filteredItems.slice(0, filters.limit).map((item) => ({
    rawItem: item as Record<string, unknown>,
    links: (linkMap.get(item.id) ?? []) as Array<Record<string, unknown>>,
    observations: observationMap.get(item.id) ?? [],
  }));
}
