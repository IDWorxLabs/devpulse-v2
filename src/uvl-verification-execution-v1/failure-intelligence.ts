/**
 * UVL Verification Execution V1 — failure intelligence.
 */

import type {
  VerificationCategoryResult,
  VerificationFailureClass,
  VerificationFailureIntelligenceEntry,
} from './uvl-verification-execution-v1-types.js';

export function buildVerificationFailureIntelligence(
  results: readonly VerificationCategoryResult[],
): readonly VerificationFailureIntelligenceEntry[] {
  return results
    .filter((r) => !r.verified)
    .map((r) => ({
      readOnly: true,
      profile: r.profile,
      productName: r.productName,
      failureClass: r.failureClass,
      rootCause: r.failureDetail || r.failureClass,
      missingEvidence: r.verificationProof.missingEvidence,
    }));
}

export function buildFailureDistribution(
  results: readonly VerificationCategoryResult[],
): readonly { failureClass: VerificationFailureClass; count: number; percentage: number }[] {
  const counts = new Map<VerificationFailureClass, number>();
  for (const result of results) {
    if (result.verified) continue;
    const key = result.failureClass;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  return [...counts.entries()].map(([failureClass, count]) => ({
    failureClass,
    count,
    percentage: total === 0 ? 0 : Math.round((count / total) * 100),
  }));
}
