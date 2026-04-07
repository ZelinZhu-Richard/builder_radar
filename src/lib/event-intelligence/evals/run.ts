import assert from "node:assert/strict";
import { EVENT_INTELLIGENCE_EVAL_SCENARIOS } from "./fixtures";
import { replayEventIntelligenceScenario } from "./replay";

function normalizeGroup(rawItemIds: string[]) {
  return [...rawItemIds].sort();
}

function normalizeGroups(rawItemGroups: string[][]) {
  return rawItemGroups
    .map((group) => normalizeGroup(group))
    .sort((left, right) => left.join("|").localeCompare(right.join("|")));
}

function assertScenario(scenario: (typeof EVENT_INTELLIGENCE_EVAL_SCENARIOS)[number]) {
  const replay = replayEventIntelligenceScenario(scenario);
  const actualGroups = normalizeGroups(
    replay.contexts
      .filter((context) => context.rawItems.length > 0)
      .map((context) => context.rawItems.map((rawItem) => rawItem.id)),
  );
  const expectedGroups = normalizeGroups(
    scenario.expectedGroups.map((group) => group.rawItemIds),
  );

  assert.deepEqual(
    actualGroups,
    expectedGroups,
    `${scenario.id}: event grouping diverged`,
  );

  for (const expectedGroup of scenario.expectedGroups) {
    const membership = replay.membershipByRawItemId.get(expectedGroup.rawItemIds[0]!);
    assert.ok(membership, `${scenario.id}: missing membership for ${expectedGroup.rawItemIds[0]}`);

    const context = replay.contexts.find((candidate) => candidate.event.id === membership.event_id);
    assert.ok(context, `${scenario.id}: missing event context for ${membership.event_id}`);
    assert.equal(
      context.event.primary_raw_item_id,
      expectedGroup.primaryRawItemId,
      `${scenario.id}: primary raw item mismatch`,
    );
    assert.equal(
      context.event.primary_source_role,
      expectedGroup.primarySourceRole,
      `${scenario.id}: primary source role mismatch`,
    );

    if (expectedGroup.stableKey === null) {
      assert.equal(context.event.stable_key, null, `${scenario.id}: expected null stable key`);
    } else if (expectedGroup.stableKey === "present") {
      assert.ok(context.event.stable_key, `${scenario.id}: expected a stable key`);
    } else if (expectedGroup.stableKey) {
      assert.equal(
        context.event.stable_key,
        expectedGroup.stableKey,
        `${scenario.id}: stable key mismatch`,
      );
    }

    const actualMaterialUpdates = normalizeGroup(
      context.memberships
        .filter((candidate) => candidate.is_material_update)
        .map((candidate) => candidate.raw_item_id),
    );
    const expectedMaterialUpdates = normalizeGroup(
      expectedGroup.materialUpdateRawItemIds,
    );

    assert.deepEqual(
      actualMaterialUpdates,
      expectedMaterialUpdates,
      `${scenario.id}: material update set mismatch`,
    );
  }
}

function main() {
  let passed = 0;

  for (const scenario of EVENT_INTELLIGENCE_EVAL_SCENARIOS) {
    try {
      assertScenario(scenario);
      passed += 1;
      console.log(`PASS ${scenario.id} ${scenario.description}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${scenario.id} ${scenario.description}`);
      console.error(message);
      process.exitCode = 1;
    }
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error(
      `Event intelligence eval failed (${passed}/${EVENT_INTELLIGENCE_EVAL_SCENARIOS.length} passed).`,
    );
    return;
  }

  console.log(
    `Event intelligence eval passed (${passed}/${EVENT_INTELLIGENCE_EVAL_SCENARIOS.length}).`,
  );
}

main();
