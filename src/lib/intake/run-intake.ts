import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { IntakeQueryStatus } from "@/types";
import { validateWebSearchProviderResult, validateXSearchProviderResult } from "@/lib/xai/validate";
import { getXaiSearchClient } from "@/lib/xai/client";
import { buildExecutableQueries } from "./build-queries";
import {
  buildIntakeWindow,
  getIntakeConfig,
  resolveUseMockProvider,
  snapshotRuntimeConfig,
} from "./config";
import { createIntakeLogger } from "./logger";
import { normalizeWebResult } from "./normalize/web-result";
import { normalizeXPostResult } from "./normalize/x-post";
import {
  createIntakeRun,
  createIntakeRunQuery,
  persistNormalizedItem,
  updateIntakeRun,
  updateIntakeRunQuery,
} from "./persist";
import { buildTrustedAccountHandleMap, listActiveTrustedAccounts } from "./trusted-accounts";
import type {
  IntakeRunSummary,
  QueryProcessingResult,
  RunIntakeOptions,
  ValidatedProviderResult,
} from "./types";

function deriveRunType(mode: NonNullable<RunIntakeOptions["mode"]>) {
  if (mode === "x") {
    return "x_only";
  }

  if (mode === "web") {
    return "web_only";
  }

  return "full";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown intake failure";
}

function getQueryStatus({
  successfulItemCount,
  skippedCount,
}: {
  successfulItemCount: number;
  skippedCount: number;
}): IntakeQueryStatus {
  if (successfulItemCount === 0 && skippedCount > 0) {
    return "failed";
  }

  if (successfulItemCount > 0 && skippedCount > 0) {
    return "partial";
  }

  return "succeeded";
}

function buildStoredIssueSummary(
  issues: QueryProcessingResult["issues"],
): Json {
  return issues.slice(0, 25).map((issue) => ({
    code: issue.code,
    message: issue.message,
    itemIndex: issue.itemIndex ?? null,
    field: issue.field ?? null,
  }));
}

function buildRunIssueLabel(
  queryId: string,
  status: IntakeQueryStatus,
  errorMessage: string | null,
  skippedCount = 0,
) {
  const base = `${queryId}:${status}`;

  if (status === "partial") {
    return `${base}:skipped=${skippedCount}`;
  }

  if (status === "failed" && errorMessage) {
    return `${base}:${errorMessage}`;
  }

  return base;
}

async function processValidatedItems<TItem>({
  supabase,
  validatedItems,
  intakeRunId,
  intakeRunQueryId,
  normalizeItem,
  queryLogger,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  validatedItems: ValidatedProviderResult<TItem>;
  intakeRunId: string;
  intakeRunQueryId: string;
  normalizeItem: (validatedItem: ValidatedProviderResult<TItem>["items"][number]) => ReturnType<typeof normalizeWebResult>;
  queryLogger: ReturnType<typeof createIntakeLogger>;
}): Promise<QueryProcessingResult> {
  let insertedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;
  let skippedCount = validatedItems.issues.length;
  let successfulItemCount = 0;
  const issues = [...validatedItems.issues];

  for (const validatedItem of validatedItems.items) {
    let normalizedItem: ReturnType<typeof normalizeWebResult>;

    try {
      normalizedItem = normalizeItem(validatedItem);
    } catch (error) {
      const message = getErrorMessage(error);
      skippedCount += 1;
      issues.push({
        code: "normalization_error",
        message,
        itemIndex: validatedItem.itemIndex,
      });
      queryLogger.error("raw_item_normalization_failed", {
        itemRank: validatedItem.itemIndex + 1,
        error: message,
      });
      continue;
    }

    try {
      const persistedItem = await persistNormalizedItem(supabase, {
        intakeRunId,
        intakeRunQueryId,
        providerResultRank: validatedItem.itemIndex + 1,
        item: normalizedItem,
      });

      insertedCount += persistedItem.insertedCount;
      updatedCount += persistedItem.updatedCount;
      dedupedCount += persistedItem.dedupedCount;
      successfulItemCount += 1;

      queryLogger.debug("raw_item_persisted", {
        itemRank: validatedItem.itemIndex + 1,
        rawItemId: persistedItem.rawItemId,
        persistenceAction: persistedItem.persistenceAction,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      skippedCount += 1;
      issues.push({
        code: "persistence_error",
        message,
        itemIndex: validatedItem.itemIndex,
      });
      queryLogger.error("raw_item_persistence_failed", {
        itemRank: validatedItem.itemIndex + 1,
        error: message,
      });
    }
  }

  return {
    status: getQueryStatus({
      successfulItemCount,
      skippedCount,
    }),
    resultCount: validatedItems.rawItemCount,
    insertedCount,
    updatedCount,
    dedupedCount,
    skippedCount,
    issues,
  };
}

export async function runIntake(
  options: RunIntakeOptions = {},
): Promise<IntakeRunSummary> {
  const baseConfig = getIntakeConfig();
  const useMockProvider = resolveUseMockProvider(
    baseConfig,
    options.useMockProvider,
  );
  const config = {
    ...baseConfig,
    useMockProvider,
  };
  const mode = options.mode ?? "full";
  const runType = options.runType ?? deriveRunType(mode);
  const triggerSource =
    options.triggerSource ?? (useMockProvider ? "dev" : "api");
  const window = buildIntakeWindow(config);
  const supabase = getSupabaseAdminClient();
  const trustedAccounts = await listActiveTrustedAccounts(supabase);
  const executableQueries = buildExecutableQueries({
    trustedAccounts,
    config,
    window,
    mode,
  });
  const trustedAccountsByHandle = buildTrustedAccountHandleMap(trustedAccounts);
  const xaiClient = getXaiSearchClient({ useMockProvider });

  const run = await createIntakeRun(supabase, {
    run_type: runType,
    trigger_source: triggerSource,
    status: "running",
    refresh_window_start: window.start.toISOString(),
    refresh_window_end: window.end.toISOString(),
    accounts_considered: trustedAccounts.length,
    queries_planned: executableQueries.length,
    config_snapshot_json: snapshotRuntimeConfig(config) as Json,
  });

  const runLogger = createIntakeLogger({
    runId: run.id,
  });

  runLogger.info("intake_run_started", {
    queryCount: executableQueries.length,
    useMockProvider,
    mode,
  });

  let queriesSucceeded = 0;
  let queriesFailed = 0;
  let rawItemsSeen = 0;
  let rawItemsInserted = 0;
  let rawItemsUpdated = 0;
  let rawItemsDeduped = 0;
  let rawItemsSkipped = 0;
  const queryStatuses: IntakeQueryStatus[] = [];
  const runIssues: string[] = [];

  for (const executableQuery of executableQueries) {
    const query = await createIntakeRunQuery(supabase, {
      intake_run_id: run.id,
      query_source: executableQuery.querySource,
      lane_hint: executableQuery.laneHint ?? null,
      trusted_account_id: executableQuery.trustedAccountId ?? null,
      query_text: executableQuery.queryText,
      provider: "xai",
      status: "running",
      request_payload_json: {
        id: executableQuery.id,
        tool: executableQuery.tool,
        allowedXHandles: executableQuery.allowedXHandles ?? [],
        excludedXHandles: executableQuery.excludedXHandles ?? [],
        allowedDomains: executableQuery.allowedDomains ?? [],
        excludedDomains: executableQuery.excludedDomains ?? [],
        fromDate: executableQuery.fromDate ?? null,
        toDate: executableQuery.toDate ?? null,
        maxItems: executableQuery.maxItems,
      },
    });

    const queryLogger = runLogger.child({
      queryId: query.id,
      querySource: executableQuery.querySource,
      provider: "xai",
    });

    queryLogger.info("intake_query_started", {
      tool: executableQuery.tool,
      queryText: executableQuery.queryText,
    });

    try {
      const providerResponse =
        executableQuery.tool === "x_search"
          ? await xaiClient.searchXPosts(executableQuery)
          : await xaiClient.searchWeb(executableQuery);

      queryLogger.debug("provider_request_completed", {
        rawItemCount: providerResponse.items.length,
      });

      const collectedAt = new Date();
      let queryProcessing: QueryProcessingResult;

      if (executableQuery.tool === "x_search") {
        const validatedItems = validateXSearchProviderResult(providerResponse);

        for (const issue of validatedItems.issues) {
          queryLogger.debug("provider_item_skipped", {
            itemRank: (issue.itemIndex ?? 0) + 1,
            code: issue.code,
            field: issue.field ?? null,
            message: issue.message,
          });
        }

        queryProcessing = await processValidatedItems({
          supabase,
          validatedItems,
          intakeRunId: run.id,
          intakeRunQueryId: query.id,
          normalizeItem: (validatedItem) =>
            normalizeXPostResult({
              validatedItem,
              query: executableQuery,
              trustedAccountsByHandle,
              collectedAt,
            }),
          queryLogger,
        });

        await updateIntakeRunQuery(supabase, query.id, {
          status: queryProcessing.status,
          provider_request_id: validatedItems.providerRequestId ?? null,
          finished_at: new Date().toISOString(),
          result_count: queryProcessing.resultCount,
          inserted_count: queryProcessing.insertedCount,
          updated_count: queryProcessing.updatedCount,
          deduped_count: queryProcessing.dedupedCount,
          skipped_count: queryProcessing.skippedCount,
          error_message:
            queryProcessing.issues.length > 0
              ? queryProcessing.issues
                  .slice(0, 3)
                  .map((issue) => `${issue.code}:${issue.message}`)
                  .join(" | ")
              : null,
          response_summary_json: {
            ...validatedItems.responseSummary,
            rawItemCount: validatedItems.rawItemCount,
            validItemCount: validatedItems.items.length,
            skippedCount: queryProcessing.skippedCount,
            skippedItems: buildStoredIssueSummary(queryProcessing.issues),
          },
        });
      } else {
        const validatedItems = validateWebSearchProviderResult(providerResponse);

        for (const issue of validatedItems.issues) {
          queryLogger.debug("provider_item_skipped", {
            itemRank: (issue.itemIndex ?? 0) + 1,
            code: issue.code,
            field: issue.field ?? null,
            message: issue.message,
          });
        }

        queryProcessing = await processValidatedItems({
          supabase,
          validatedItems,
          intakeRunId: run.id,
          intakeRunQueryId: query.id,
          normalizeItem: (validatedItem) =>
            normalizeWebResult({
              validatedItem,
              query: executableQuery,
              collectedAt,
            }),
          queryLogger,
        });

        await updateIntakeRunQuery(supabase, query.id, {
          status: queryProcessing.status,
          provider_request_id: validatedItems.providerRequestId ?? null,
          finished_at: new Date().toISOString(),
          result_count: queryProcessing.resultCount,
          inserted_count: queryProcessing.insertedCount,
          updated_count: queryProcessing.updatedCount,
          deduped_count: queryProcessing.dedupedCount,
          skipped_count: queryProcessing.skippedCount,
          error_message:
            queryProcessing.issues.length > 0
              ? queryProcessing.issues
                  .slice(0, 3)
                  .map((issue) => `${issue.code}:${issue.message}`)
                  .join(" | ")
              : null,
          response_summary_json: {
            ...validatedItems.responseSummary,
            rawItemCount: validatedItems.rawItemCount,
            validItemCount: validatedItems.items.length,
            skippedCount: queryProcessing.skippedCount,
            skippedItems: buildStoredIssueSummary(queryProcessing.issues),
          },
        });
      }

      rawItemsSeen += queryProcessing.resultCount;
      rawItemsInserted += queryProcessing.insertedCount;
      rawItemsUpdated += queryProcessing.updatedCount;
      rawItemsDeduped += queryProcessing.dedupedCount;
      rawItemsSkipped += queryProcessing.skippedCount;
      queryStatuses.push(queryProcessing.status);

      if (queryProcessing.status === "succeeded") {
        queriesSucceeded += 1;
      } else if (queryProcessing.status === "failed") {
        queriesFailed += 1;
      }

      const errorMessage =
        queryProcessing.issues.length > 0
          ? queryProcessing.issues
              .slice(0, 3)
              .map((issue) => `${issue.code}:${issue.message}`)
              .join(" | ")
          : null;

      if (queryProcessing.status !== "succeeded") {
        runIssues.push(
          buildRunIssueLabel(
            executableQuery.id,
            queryProcessing.status,
            errorMessage,
            queryProcessing.skippedCount,
          ),
        );
      }

      queryLogger.info("intake_query_finished", {
        status: queryProcessing.status,
        rawItemCount: queryProcessing.resultCount,
        insertedCount: queryProcessing.insertedCount,
        updatedCount: queryProcessing.updatedCount,
        dedupedCount: queryProcessing.dedupedCount,
        skippedCount: queryProcessing.skippedCount,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      queriesFailed += 1;
      queryStatuses.push("failed");
      runIssues.push(buildRunIssueLabel(executableQuery.id, "failed", message));

      queryLogger.error("intake_query_failed", {
        error: message,
      });

      await updateIntakeRunQuery(supabase, query.id, {
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: message,
        skipped_count: 0,
        response_summary_json: {
          skippedCount: 0,
          skippedItems: [],
        },
      });
    }
  }

  const finalStatus =
    queryStatuses.length > 0 && queryStatuses.every((status) => status === "failed")
      ? "failed"
      : queryStatuses.some((status) => status === "failed" || status === "partial")
        ? "partial"
        : "succeeded";

  await updateIntakeRun(supabase, run.id, {
    status: finalStatus,
    finished_at: new Date().toISOString(),
    queries_succeeded: queriesSucceeded,
    queries_failed: queriesFailed,
    raw_items_seen: rawItemsSeen,
    raw_items_inserted: rawItemsInserted,
    raw_items_updated: rawItemsUpdated,
    raw_items_deduped: rawItemsDeduped,
    raw_items_skipped: rawItemsSkipped,
    error_summary: runIssues.length > 0 ? runIssues.join(" | ") : null,
  });

  runLogger.info("intake_run_finished", {
    status: finalStatus,
    queriesSucceeded,
    queriesFailed,
    rawItemsSeen,
    rawItemsInserted,
    rawItemsUpdated,
    rawItemsDeduped,
    rawItemsSkipped,
  });

  return {
    intakeRunId: run.id,
    status: finalStatus,
    queriesPlanned: executableQueries.length,
    queriesSucceeded,
    queriesFailed,
    rawItemsSeen,
    rawItemsInserted,
    rawItemsUpdated,
    rawItemsDeduped,
    rawItemsSkipped,
    usedMockProvider: useMockProvider,
    refreshWindowStart: window.start.toISOString(),
    refreshWindowEnd: window.end.toISOString(),
  };
}
