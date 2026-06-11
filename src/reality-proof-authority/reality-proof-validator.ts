/**
 * Reality-Proof Authority Validator — bounded integrity checks.
 */

import {
  REALITY_PROOF_BLOCK_SCORE,
  REALITY_PROOF_UNKNOWN_BLOCK_COUNT,
} from './reality-proof-bounds.js';
import type { RealityProofAssessment, RealityProofFinding } from './reality-proof-types.js';

const ALLOWED_LEVELS = [
  'PROVEN_REALITY',
  'OBSERVED_REALITY',
  'INFERRED_REALITY',
  'ASSUMED_REALITY',
  'UNKNOWN_REALITY',
] as const;

const ALLOWED_CATEGORIES = [
  'EXECUTION_PROOF',
  'USER_PROOF',
  'INTERACTION_PROOF',
  'VERIFICATION_PROOF',
  'RUNTIME_PROOF',
  'LAUNCH_PROOF',
] as const;

export function validateEvidenceClassification(findings: RealityProofFinding[]): {
  passed: boolean;
  detail: string;
} {
  const invalid = findings.filter(
    (finding) =>
      !ALLOWED_LEVELS.includes(finding.evidenceLevel) ||
      !ALLOWED_CATEGORIES.includes(finding.category) ||
      !finding.evidence.length,
  );
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? 'invalid finding' : `findings=${findings.length}`,
  };
}

export function validateRealityLevelAssignment(assessment: RealityProofAssessment): {
  passed: boolean;
  detail: string;
} {
  const total =
    assessment.provenRealityCount +
    assessment.observedRealityCount +
    assessment.inferredRealityCount +
    assessment.assumedRealityCount +
    assessment.unknownRealityCount;
  return {
    passed: total === assessment.findings.length,
    detail: `total=${total}; findings=${assessment.findings.length}`,
  };
}

export function validateRealityRiskCalculation(assessment: RealityProofAssessment): {
  passed: boolean;
  detail: string;
} {
  const total = assessment.findings.length || 1;
  const expectedRisk = Math.round(
    ((assessment.assumedRealityCount + assessment.unknownRealityCount) / total) * 100,
  );
  return {
    passed:
      assessment.realityRiskScore >= 0 &&
      assessment.realityRiskScore <= 100 &&
      Math.abs(assessment.realityRiskScore - expectedRisk) <= 1,
    detail: `risk=${assessment.realityRiskScore}; expected=${expectedRisk}`,
  };
}

export function validateRealityProofLaunchBlocking(assessment: RealityProofAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.realityProofScore < REALITY_PROOF_BLOCK_SCORE ||
    assessment.assumedRealityCount > assessment.provenRealityCount ||
    assessment.unknownRealityCount >= REALITY_PROOF_UNKNOWN_BLOCK_COUNT;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateRealityProofDeterministicScoring(
  first: RealityProofAssessment,
  second: RealityProofAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.realityProofScore === second.realityProofScore &&
      first.realityRiskScore === second.realityRiskScore &&
      first.provenRealityCount === second.provenRealityCount &&
      first.assumedRealityCount === second.assumedRealityCount,
    detail: `${first.realityProofScore}:${first.realityRiskScore}`,
  };
}

export function validateRealityProofRecommendationGeneration(assessment: RealityProofAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}

export function validateRealityProofAdvisoryOnly(assessment: RealityProofAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.advisoryOnly === true && assessment.readOnly === true,
    detail: `advisory=${assessment.advisoryOnly}; readOnly=${assessment.readOnly}`,
  };
}

export function validateRealityProofScoreCalculation(assessment: RealityProofAssessment): {
  passed: boolean;
  detail: string;
} {
  const total = assessment.findings.length || 1;
  const expected = Math.round(
    ((assessment.provenRealityCount + assessment.observedRealityCount) / total) * 100,
  );
  return {
    passed: Math.abs(assessment.realityProofScore - expected) <= 1,
    detail: `score=${assessment.realityProofScore}; expected=${expected}`,
  };
}
