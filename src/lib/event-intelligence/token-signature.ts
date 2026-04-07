import { createHash } from "node:crypto";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "via",
  "with",
]);

function collectTokens(input: string, weight: number, counts: Map<string, number>) {
  const matches = input.toLowerCase().match(/[a-z0-9][a-z0-9+#.-]*/g) ?? [];

  for (const token of matches) {
    if (token.length < 3 || STOP_WORDS.has(token)) {
      continue;
    }

    counts.set(token, (counts.get(token) ?? 0) + weight);
  }
}

export function buildTokenSignature(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();

  values.forEach((value, index) => {
    if (!value) {
      return;
    }

    collectTokens(value, index === 0 ? 2 : 1, counts);
  });

  const tokens = Array.from(counts.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, 8)
    .map(([token]) => token);

  const hash = createHash("sha256").update(tokens.join("|")).digest("hex");

  return {
    tokens,
    hash,
  };
}

export function computeTokenOverlap(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let overlap = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      overlap += 1;
    }
  }

  const union = new Set([...leftSet, ...rightSet]).size;
  return union > 0 ? overlap / union : 0;
}
