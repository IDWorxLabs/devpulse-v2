/**
 * Launch Readiness Authority V2 — confidence calculation.
 * Confidence never overrides blockers.
 */

import type {
  LaunchBlockerRecord,
  LaunchConfidenceResult,
  LaunchEvidenceCollectionResult,
  LaunchEvidenceValidationResult,
  LaunchRiskRecord,
} from './launch-readiness-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function calculateLaunchConfidence(input: {
  evidence: LaunchEvidenceCollectionResult;
  evidenceValidation: LaunchEvidenceValidationResult;
  blockers: readonly LaunchBlockerRecord[];
  risks: readonly LaunchRiskRecord[];
}): LaunchConfidenceResult {
  const blockerOverrideApplied = input.blockers.length > 0 || !input.evidenceValidation.valid;

  const passCount = input.evidence.sources.filter((s) => s.status === 'PASS').length;
  const evidenceCompleteness = input.evidenceValidation.completenessScore;
  const evidenceQuality = clamp(
    input.evidence.sources.reduce((sum, s) => sum + s.confidence, 0) / Math.max(input.evidence.sources.length, 1),
  );
  const validationCoverage = clamp(
    (input.evidenceValidation.freshnessScore + input.evidenceValidation.consistencyScore) / 2,
  );

  const repairHistoryBoost = input.evidence.sources
    .find((s) => s.sourceId === 'AUTONOMOUS_DEBUGGING')
    ?.supportingArtifacts.some((a) => /unresolved:0/.test(a))
    ? 8
    : 0;

  const virtualUserSource = input.evidence.sources.find((s) => s.sourceId === 'VIRTUAL_USER');
  const virtualUserSuccess = virtualUserSource?.status === 'PASS' ? 90 : 35;

  const deviceSource = input.evidence.sources.find((s) => s.sourceId === 'VIRTUAL_DEVICE');
  const deviceCoverage = deviceSource?.status === 'PASS' ? 88 : 40;

  const interactionSource = input.evidence.sources.find((s) => s.sourceId === 'INTERACTION_PROOF');
  const interactionCoverage = interactionSource?.status === 'PASS' ? 90 : 35;

  const engineeringConfidence = clamp(
    evidenceQuality * 0.35 +
      validationCoverage * 0.2 +
      (passCount / Math.max(input.evidence.sources.length, 1)) * 100 * 0.25 +
      repairHistoryBoost +
      20,
  );

  const userConfidence = clamp((virtualUserSuccess + deviceCoverage + interactionCoverage) / 3);
  const launchConfidence = blockerOverrideApplied
    ? Math.min(engineeringConfidence, userConfidence, 45)
    : clamp(engineeringConfidence * 0.55 + userConfidence * 0.45);

  const highRiskPenalty = input.risks.filter((r) => r.residualRisk === 'HIGH').length * 8;
  const overallConfidence = blockerOverrideApplied
    ? clamp(Math.min(launchConfidence, 49) - highRiskPenalty)
    : clamp(launchConfidence - highRiskPenalty);

  return {
    readOnly: true,
    overallConfidence,
    engineeringConfidence,
    userConfidence,
    launchConfidence,
    evidenceCompleteness,
    evidenceQuality,
    validationCoverage,
    blockerOverrideApplied,
  };
}
