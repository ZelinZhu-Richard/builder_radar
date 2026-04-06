import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { SignalLane, SourceKind, TrustTier, TrustedAccount } from "@/types";

type TrustedAccountInsert =
  Database["public"]["Tables"]["trusted_accounts"]["Insert"];
type TrustedAccountUpdate =
  Database["public"]["Tables"]["trusted_accounts"]["Update"];

const VALID_SOURCE_KINDS = new Set<SourceKind>([
  "research-lab",
  "founder",
  "operator",
  "publication",
  "market-data",
  "maintainer",
]);

const VALID_TRUST_TIERS = new Set<TrustTier>([
  "primary",
  "verified",
  "trusted",
  "monitor",
]);

const VALID_LANES = new Set<SignalLane>([
  "ai",
  "builders",
  "quant",
  "performance",
]);

export interface CreateTrustedAccountInput {
  handle: string;
  externalAccountId?: string | null;
  displayName?: string | null;
  profileUrl?: string | null;
  sourceKind: SourceKind;
  trustTier: TrustTier;
  laneHints: SignalLane[];
  topicTags?: string[];
  ingestPriority?: number;
  isActive?: boolean;
  notes?: string | null;
}

export type UpdateTrustedAccountInput = Partial<CreateTrustedAccountInput>;

function hasOwnKey<T extends object>(value: T, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeHandle(handle: string) {
  const normalizedHandle = handle.trim().replace(/^@+/, "").toLowerCase();

  if (!normalizedHandle) {
    throw new Error("Trusted account handle is required.");
  }

  return {
    handle: `@${normalizedHandle}`,
    normalizedHandle,
  };
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeTopicTags(topicTags: string[] | undefined) {
  return Array.from(
    new Set(
      (topicTags ?? [])
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    ),
  );
}

function normalizeLaneHints(laneHints: SignalLane[]) {
  const uniqueLaneHints = Array.from(new Set(laneHints));

  if (uniqueLaneHints.length === 0) {
    throw new Error("Trusted account laneHints must include at least one lane.");
  }

  for (const lane of uniqueLaneHints) {
    if (!VALID_LANES.has(lane)) {
      throw new Error(`Unsupported trusted account lane: ${lane}`);
    }
  }

  return uniqueLaneHints;
}

function normalizePriority(value: number | undefined) {
  if (value == null) {
    return 100;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Trusted account ingestPriority must be a positive integer.");
  }

  return value;
}

function assertSourceKind(value: string): SourceKind {
  if (!VALID_SOURCE_KINDS.has(value as SourceKind)) {
    throw new Error(`Unsupported trusted account sourceKind: ${value}`);
  }

  return value as SourceKind;
}

function assertTrustTier(value: string): TrustTier {
  if (!VALID_TRUST_TIERS.has(value as TrustTier)) {
    throw new Error(`Unsupported trusted account trustTier: ${value}`);
  }

  return value as TrustTier;
}

function mapTrustedAccountRow(
  row: Database["public"]["Tables"]["trusted_accounts"]["Row"],
): TrustedAccount {
  return {
    id: row.id,
    platform: row.platform,
    externalAccountId: row.external_account_id,
    handle: row.handle,
    normalizedHandle: row.normalized_handle,
    displayName: row.display_name,
    profileUrl: row.profile_url,
    sourceKind: row.source_kind as TrustedAccount["sourceKind"],
    trustTier: row.trust_tier as TrustedAccount["trustTier"],
    laneHints: row.lane_hints as TrustedAccount["laneHints"],
    topicTags: row.topic_tags,
    ingestPriority: row.ingest_priority,
    isActive: row.is_active,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTrustedAccountInsert(
  input: CreateTrustedAccountInput,
): TrustedAccountInsert {
  const normalized = normalizeHandle(input.handle);

  return {
    platform: "x",
    external_account_id: normalizeOptionalText(input.externalAccountId),
    handle: normalized.handle,
    normalized_handle: normalized.normalizedHandle,
    display_name: normalizeOptionalText(input.displayName),
    profile_url:
      normalizeOptionalText(input.profileUrl) ??
      `https://x.com/${normalized.normalizedHandle}`,
    source_kind: assertSourceKind(input.sourceKind),
    trust_tier: assertTrustTier(input.trustTier),
    lane_hints: normalizeLaneHints(input.laneHints),
    topic_tags: normalizeTopicTags(input.topicTags),
    ingest_priority: normalizePriority(input.ingestPriority),
    is_active: input.isActive ?? true,
    notes: normalizeOptionalText(input.notes),
  };
}

function toTrustedAccountUpdate(
  input: UpdateTrustedAccountInput,
): TrustedAccountUpdate {
  const payload: TrustedAccountUpdate = {};
  const normalizedHandleInput =
    hasOwnKey(input, "handle") && typeof input.handle === "string"
      ? normalizeHandle(input.handle)
      : null;

  if (normalizedHandleInput) {
    payload.handle = normalizedHandleInput.handle;
    payload.normalized_handle = normalizedHandleInput.normalizedHandle;
  }

  if (hasOwnKey(input, "externalAccountId")) {
    payload.external_account_id = normalizeOptionalText(input.externalAccountId);
  }

  if (hasOwnKey(input, "displayName")) {
    payload.display_name = normalizeOptionalText(input.displayName);
  }

  if (hasOwnKey(input, "profileUrl")) {
    payload.profile_url = normalizeOptionalText(input.profileUrl);
  } else if (normalizedHandleInput) {
    payload.profile_url = `https://x.com/${normalizedHandleInput.normalizedHandle}`;
  }

  if (hasOwnKey(input, "sourceKind") && input.sourceKind) {
    payload.source_kind = assertSourceKind(input.sourceKind);
  }

  if (hasOwnKey(input, "trustTier") && input.trustTier) {
    payload.trust_tier = assertTrustTier(input.trustTier);
  }

  if (hasOwnKey(input, "laneHints") && input.laneHints) {
    payload.lane_hints = normalizeLaneHints(input.laneHints);
  }

  if (hasOwnKey(input, "topicTags")) {
    payload.topic_tags = normalizeTopicTags(input.topicTags);
  }

  if (hasOwnKey(input, "ingestPriority") && input.ingestPriority != null) {
    payload.ingest_priority = normalizePriority(input.ingestPriority);
  }

  if (hasOwnKey(input, "isActive") && typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  if (hasOwnKey(input, "notes")) {
    payload.notes = normalizeOptionalText(input.notes);
  }

  return payload;
}

export async function listTrustedAccounts(
  supabase: SupabaseClient<Database>,
  { includeInactive = true }: { includeInactive?: boolean } = {},
) {
  let query = supabase
    .from("trusted_accounts")
    .select("*")
    .order("ingest_priority", { ascending: true })
    .order("normalized_handle", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load trusted accounts: ${error.message}`);
  }

  return (data ?? []).map(mapTrustedAccountRow);
}

export async function listActiveTrustedAccounts(
  supabase: SupabaseClient<Database>,
) {
  return listTrustedAccounts(supabase, { includeInactive: false });
}

export async function createTrustedAccount(
  supabase: SupabaseClient<Database>,
  input: CreateTrustedAccountInput,
) {
  const { data, error } = await supabase
    .from("trusted_accounts")
    .insert(toTrustedAccountInsert(input))
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create trusted account: ${error.message}`);
  }

  return mapTrustedAccountRow(data);
}

export async function updateTrustedAccount(
  supabase: SupabaseClient<Database>,
  accountId: string,
  input: UpdateTrustedAccountInput,
) {
  const payload = toTrustedAccountUpdate(input);

  if (Object.keys(payload).length === 0) {
    throw new Error("Trusted account update payload is empty.");
  }

  const { data, error } = await supabase
    .from("trusted_accounts")
    .update(payload)
    .eq("id", accountId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update trusted account: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapTrustedAccountRow(data);
}

export function buildTrustedAccountHandleMap(accounts: TrustedAccount[]) {
  return new Map(accounts.map((account) => [account.normalizedHandle, account]));
}
