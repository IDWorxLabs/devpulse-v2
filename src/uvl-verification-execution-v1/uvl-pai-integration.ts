/**
 * UVL Verification Execution V1 — Product Architect Intelligence integration.
 */

import type { VerificationCategoryResult } from './uvl-verification-execution-v1-types.js';

export function classifyProductArchitectVerificationStatus(result: VerificationCategoryResult): {
  status: 'Built' | 'Built and Verified' | 'Incomplete';
  countsTowardVerification: boolean;
} {
  if (result.verified) {
    return { status: 'Built and Verified', countsTowardVerification: true };
  }
  if (result.metrics.buildSuccess && result.metrics.previewSuccess) {
    return { status: 'Built', countsTowardVerification: false };
  }
  return { status: 'Incomplete', countsTowardVerification: false };
}

export function summarizeVerificationRealityForProductArchitect(
  results: readonly VerificationCategoryResult[],
): {
  verifiedCount: number;
  builtOnlyCount: number;
  incompleteCount: number;
  averageVerificationConfidence: number;
} {
  let verifiedCount = 0;
  let builtOnlyCount = 0;
  let incompleteCount = 0;
  let confidenceSum = 0;

  for (const result of results) {
    const status = classifyProductArchitectVerificationStatus(result);
    if (status.status === 'Built and Verified') verifiedCount += 1;
    else if (status.status === 'Built') builtOnlyCount += 1;
    else incompleteCount += 1;
    confidenceSum += result.metrics.verificationConfidence;
  }

  return {
    verifiedCount,
    builtOnlyCount,
    incompleteCount,
    averageVerificationConfidence:
      results.length > 0 ? Math.round(confidenceSum / results.length) : 0,
  };
}
