import type { IntakeRuntimeConfig } from "./types";

function stringifyJson(value: Record<string, unknown>) {
  return JSON.stringify(value);
}

function byteSize(value: Record<string, unknown>) {
  return Buffer.byteLength(stringifyJson(value), "utf8");
}

export function buildStoredRawPayload({
  config,
  rawItemJson,
  summary,
}: {
  config: IntakeRuntimeConfig["rawPayload"];
  rawItemJson: Record<string, unknown>;
  summary: Record<string, unknown>;
}) {
  if (config.mode !== "full") {
    return {
      storedMode: "summary",
      payloadByteSize: byteSize(summary),
      payloadTruncated: false,
      summary,
    } satisfies Record<string, unknown>;
  }

  const payloadByteSize = byteSize(rawItemJson);

  if (payloadByteSize <= config.maxBytes) {
    return {
      storedMode: "full",
      payloadByteSize,
      payloadTruncated: false,
      summary,
      rawItem: rawItemJson,
    } satisfies Record<string, unknown>;
  }

  return {
    storedMode: "full",
    payloadByteSize,
    payloadTruncated: true,
    summary,
  } satisfies Record<string, unknown>;
}
