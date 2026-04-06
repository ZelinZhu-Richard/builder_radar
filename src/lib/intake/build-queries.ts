import type { TrustedAccount } from "@/types";
import { X_DISCOVERY_PRESETS, WEB_DISCOVERY_PRESETS, mergeLaneHints, toIsoDate } from "./config";
import type { IntakeExecutableQuery, IntakeRuntimeConfig, IntakeWindow } from "./types";

function buildTrustedAccountPrompt(account: TrustedAccount) {
  return [
    `Find recent X posts from @${account.normalizedHandle} that matter for a trust-first AI edge dashboard.`,
    "Prefer first-hand releases, implementation notes, workflow detail, opportunities, benchmarks, and credible analysis.",
    "Ignore jokes, generic personal chatter, and low-substance hype.",
  ].join(" ");
}

export function buildExecutableQueries({
  trustedAccounts,
  config,
  window,
  mode,
}: {
  trustedAccounts: TrustedAccount[];
  config: IntakeRuntimeConfig;
  window: IntakeWindow;
  mode: "full" | "x" | "web";
}) {
  const fromDate = toIsoDate(window.start);
  const toDate = toIsoDate(window.end);

  const trustedAccountQueries: IntakeExecutableQuery[] =
    mode === "web"
      ? []
      : trustedAccounts.map((account) => ({
          id: `trusted-${account.normalizedHandle}`,
          querySource: "trusted_account_x",
          queryText: buildTrustedAccountPrompt(account),
          laneHint: account.laneHints[0],
          trustedAccountId: account.id,
          trustedAccountHandle: account.normalizedHandle,
          tool: "x_search",
          maxItems: config.maxItemsPerQuery,
          allowedXHandles: [account.normalizedHandle],
          fromDate,
          toDate,
        }));

  const xDiscoveryQueries: IntakeExecutableQuery[] =
    mode === "web"
      ? []
      : X_DISCOVERY_PRESETS.map((preset) => ({
          id: `x-${preset.id}`,
          querySource: "x_search",
          queryText: preset.queryText,
          laneHint: preset.laneHint,
          tool: "x_search",
          maxItems: config.maxItemsPerQuery,
          fromDate,
          toDate,
        }));

  const webDiscoveryQueries: IntakeExecutableQuery[] =
    mode === "x"
      ? []
      : WEB_DISCOVERY_PRESETS.map((preset) => ({
          id: `web-${preset.id}`,
          querySource: "web_search",
          queryText: preset.queryText,
          laneHint: preset.laneHint,
          tool: "web_search",
          maxItems: config.maxItemsPerQuery,
          allowedDomains: preset.allowedDomains,
          excludedDomains: ["x.com", "twitter.com"],
        }));

  return [...trustedAccountQueries, ...xDiscoveryQueries, ...webDiscoveryQueries].map(
    (query) => ({
      ...query,
      laneHint: mergeLaneHints([query.laneHint])[0],
    }),
  );
}
