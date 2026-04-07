import type { RawItemRow } from "./types";

function compactIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function getRawItemRelationIds(rawItem: RawItemRow) {
  return compactIds([
    rawItem.quoted_external_id,
    rawItem.replied_to_external_id,
    rawItem.shared_external_id,
    rawItem.parent_thread_external_id,
  ]);
}

export function rawItemHasDirectRelationToRawItem(
  rawItem: RawItemRow,
  otherRawItem: RawItemRow,
) {
  const rawItemRelations = new Set(getRawItemRelationIds(rawItem));
  const otherRawItemRelations = new Set(getRawItemRelationIds(otherRawItem));

  if (
    otherRawItem.external_id &&
    rawItemRelations.has(otherRawItem.external_id)
  ) {
    return true;
  }

  if (
    rawItem.external_id &&
    otherRawItemRelations.has(rawItem.external_id)
  ) {
    return true;
  }

  for (const relationId of rawItemRelations) {
    if (otherRawItemRelations.has(relationId)) {
      return true;
    }
  }

  return false;
}

export function rawItemHasDirectRelationToEvent(
  rawItem: RawItemRow,
  eventRawItems: RawItemRow[],
) {
  return eventRawItems.some(
    (eventRawItem) =>
      eventRawItem.id !== rawItem.id &&
      rawItemHasDirectRelationToRawItem(rawItem, eventRawItem),
  );
}
