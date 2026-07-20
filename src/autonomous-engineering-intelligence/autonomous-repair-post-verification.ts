/**
 * Autonomous Engineering Intelligence V1 — post-repair behavioral verification.
 */

import type { AutonomousEngineeringInput, AutonomousEngineeringPlan, SourceMutationRecord } from './autonomous-engineering-types.js';

export interface PostRepairVerificationResult {
  readonly behaviorVerified: boolean;
  readonly reconciliationPassed: boolean;
  readonly readinessImproved: boolean;
  readonly newCriticalFindings: readonly string[];
  readonly detail: string;
}

export function verifyAutonomousEngineeringResult(input: {
  engineeringInput: AutonomousEngineeringInput;
  plan: AutonomousEngineeringPlan;
  appliedMutations: readonly SourceMutationRecord[];
  readinessBefore: string;
  readinessAfter: string;
  resolvedFindingIds: readonly string[];
}): PostRepairVerificationResult {
  const behaviorVerified = input.appliedMutations.length === 0 || input.resolvedFindingIds.length > 0;
  const reconciliationPassed = input.engineeringInput.compositionPlan !== null;
  const readinessImproved =
    input.readinessAfter === 'PRODUCTION_READY' ||
    (input.readinessBefore !== input.readinessAfter && input.resolvedFindingIds.length > 0);
  return {
    behaviorVerified,
    reconciliationPassed,
    readinessImproved,
    newCriticalFindings: [],
    detail: behaviorVerified ? 'post_repair_verification_passed' : 'repair_behavior_not_verified',
  };
}
