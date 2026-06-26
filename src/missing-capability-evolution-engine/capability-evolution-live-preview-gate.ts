/**
 * Missing Capability Evolution Engine — Live Preview gate.
 */

import type {
  LivePreviewMissingCapabilityEvolutionGateResult,
  MissingCapabilityEvolutionPipelineResult,
} from './missing-capability-evolution-types.js';

export function evaluateLivePreviewMissingCapabilityEvolutionGate(
  result: MissingCapabilityEvolutionPipelineResult,
): LivePreviewMissingCapabilityEvolutionGateResult {
  const unlocked = result.permissionVerdict === 'EVOLUTION_PASS';
  const firstBlocked = result.safetyAssessments.find(
    (s) => s.verdict === 'BLOCKED_UNSAFE' || s.verdict === 'NEEDS_HUMAN_REVIEW',
  );
  const firstIntake = result.intakeItems[0];
  const firstValidation = result.validationEvidence[0];

  return {
    readOnly: true,
    unlocked,
    blockedReason: unlocked
      ? null
      : result.blockedReason ??
        result.humanReview?.problemSummary ??
        firstBlocked?.blockedReason ??
        'Missing capability evolution incomplete',
    missingCapability: firstIntake?.capabilityName ?? null,
    safetyVerdict: firstBlocked?.verdict ?? result.safetyAssessments[0]?.verdict ?? null,
    evolutionAttempts: result.evolutionAttempts.length
      ? `${result.evolutionAttempts.length} attempt(s)`
      : null,
    validationResult: firstValidation?.status ?? null,
    humanReviewReason:
      result.humanReview?.recommendedSafeNextAction ?? firstBlocked?.humanReviewReason ?? null,
    gateStatus: unlocked
      ? 'MISSING_CAPABILITY_EVOLUTION_PASS'
      : 'MISSING_CAPABILITY_EVOLUTION_BLOCKED',
  };
}

export function isMissingCapabilityEvolutionReadyForPreview(
  result: MissingCapabilityEvolutionPipelineResult,
): boolean {
  return result.permissionVerdict === 'EVOLUTION_PASS';
}
