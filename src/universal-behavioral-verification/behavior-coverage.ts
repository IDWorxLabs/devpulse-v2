/**
 * Universal Behavioral Verification Engine V1 — coverage calculation.
 */

import type {
  BehaviorVerificationClassification,
  BehaviorVerificationResultEntry,
  UniversalBehaviorDescriptor,
} from './universal-behavior-types.js';

export interface BehaviorCoverageSummary {
  readonly totalApprovedBehaviors: number;
  readonly validExecutableBehaviors: number;
  readonly verifiedBehaviors: number;
  readonly partiallyVerified: number;
  readonly blocked: number;
  readonly failed: number;
  readonly invalid: number;
  readonly unsupported: number;
  readonly notRequired: number;
  readonly notExecuted: number;
  readonly missingRuntime: number;
  readonly missingEvidence: number;
  readonly coveragePercent: number;
  readonly silentSkipCount: number;
}

export function countByClassification(
  results: readonly BehaviorVerificationResultEntry[],
  classification: BehaviorVerificationClassification,
): number {
  return results.filter((r) => r.classification === classification).length;
}

export function computeBehaviorCoverage(
  descriptors: readonly UniversalBehaviorDescriptor[],
  results: readonly BehaviorVerificationResultEntry[],
): BehaviorCoverageSummary {
  const validExecutable = descriptors.filter((d) => d.supportClassification === 'EXECUTABLE');
  const verified = countByClassification(results, 'VERIFIED');
  const partiallyVerified = countByClassification(results, 'PARTIALLY_VERIFIED');
  const blocked = countByClassification(results, 'BLOCKED');
  const failed = countByClassification(results, 'FAILED');
  const invalid = countByClassification(results, 'INVALID_BEHAVIOR');
  const unsupported = countByClassification(results, 'UNSUPPORTED');
  const notRequired = countByClassification(results, 'NOT_REQUIRED');
  const notExecuted = countByClassification(results, 'NOT_EXECUTED');

  const behaviorallyVerified = verified + partiallyVerified;
  const denominator = Math.max(1, validExecutable.length);
  const rawCoverage = (behaviorallyVerified / denominator) * 100;
  const coveragePercent = Math.min(100, Math.round(rawCoverage * 100) / 100);

  const missingRuntime = results.filter(
    (r) => r.diagnosisCodes.includes('runtime_not_reachable') || r.classification === 'NOT_EXECUTED',
  ).length;
  const missingEvidence = results.filter((r) => r.diagnosisCodes.includes('evidence_missing')).length;
  const silentSkipCount = notExecuted;

  return {
    totalApprovedBehaviors: descriptors.length,
    validExecutableBehaviors: validExecutable.length,
    verifiedBehaviors: verified,
    partiallyVerified,
    blocked,
    failed,
    invalid,
    unsupported,
    notRequired,
    notExecuted,
    missingRuntime,
    missingEvidence,
    coveragePercent,
    silentSkipCount,
  };
}

export function computeBehaviorCoveragePercent(
  descriptors: readonly UniversalBehaviorDescriptor[],
  results: readonly BehaviorVerificationResultEntry[],
): number {
  return computeBehaviorCoverage(descriptors, results).coveragePercent;
}
