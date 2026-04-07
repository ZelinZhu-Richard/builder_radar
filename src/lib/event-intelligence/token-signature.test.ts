import test from "node:test";
import assert from "node:assert/strict";
import { buildTokenSignature, computeTokenOverlap } from "./token-signature";

test("buildTokenSignature favors stable high-signal tokens", () => {
  const signature = buildTokenSignature([
    "Memory layer v2 ships tighter replay controls",
    "Replay controls reduce hidden state bleed in browser agents",
  ]);

  assert.equal(signature.tokens[0], "controls");
  assert.equal(signature.tokens[1], "replay");
  assert.ok(signature.tokens.includes("memory"));
  assert.ok(signature.tokens.includes("layer"));
  assert.equal(signature.hash.length, 64);
});

test("computeTokenOverlap reflects shared signatures", () => {
  const left = buildTokenSignature([
    "Agent benchmark with reproducible failures",
    "Trace benchmark failures are finally reproducible",
  ]);
  const right = buildTokenSignature([
    "Reproducible trace benchmark release",
    "Benchmark failures now expose trace detail",
  ]);

  assert.ok(computeTokenOverlap(left.tokens, right.tokens) > 0.3);
  assert.equal(computeTokenOverlap(left.tokens, []), 0);
});
