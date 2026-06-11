/**
 * Gap Detection Authority Validator — bounded integrity checks.
 */

import { GAP_DETECTION_BLOCK_SCORE, GAP_HIGH_COUNT_BLOCK_THRESHOLD } from './gap-detection-bounds.js';
import { GAP_DETECTION_CATEGORIES } from './gap-detection-scenarios.js';
import type { GapDetectionAssessment, GapDetectionFinding, GapImpact, GapSeverity } from './gap-detection-types.js';

const ALLOWED_SEVERITIES: GapSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ALLOWED_IMPACTS: GapImpact[] = ['USER_SUCCESS', 'TRUST', 'READINESS', 'INTELLIGENCE', 'PRODUCT', 'LAUNCH'];

export function validateGapCategoryCount(): { passed: boolean; detail: string } {
  const passed = GAP_DETECTION_CATEGORIES.length === 6;
  return { passed, detail: `count=${GAP_DETECTION_CATEGORIES.length}` };
}

export function validateGapClassification(findings: GapDetectionFinding[]): { passed: boolean; detail: string } {
  const invalid = findings.filter((gap) => !GAP_DETECTION_CATEGORIES.some((entry) => entry.category === gap.category));
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? invalid[0]?.category ?? 'invalid' : `gaps=${findings.length}`,
  };
}

export function validateGapSeverityClassification(findings: GapDetectionFinding[]): { passed: boolean; detail: string } {
  const invalid = findings.filter((gap) => !ALLOWED_SEVERITIES.includes(gap.severity));
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? String(invalid[0]?.severity) : `gaps=${findings.length}`,
  };
}

export function validateGapImpactMapping(findings: GapDetectionFinding[]): { passed: boolean; detail: string } {
  const invalid = findings.filter((gap) => !ALLOWED_IMPACTS.includes(gap.impact));
  const missingEvidence = findings.filter((gap) => gap.evidence.length === 0);
  return {
    passed: invalid.length === 0 && missingEvidence.length === 0,
    detail:
      invalid.length > 0
        ? String(invalid[0]?.impact)
        : missingEvidence.length > 0
          ? 'missing evidence'
          : `gaps=${findings.length}`,
  };
}

export function validateGapLaunchBlocking(assessment: GapDetectionAssessment): { passed: boolean; detail: string } {
  const shouldBlock =
    assessment.criticalGapCount > 0 ||
    assessment.highGapCount > GAP_HIGH_COUNT_BLOCK_THRESHOLD ||
    assessment.gapDetectionScore < GAP_DETECTION_BLOCK_SCORE;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateGapDeterministicScoring(
  first: GapDetectionAssessment,
  second: GapDetectionAssessment,
): { passed: boolean; detail: string } {
  const firstDigest = first.detectedGaps.map((gap) => `${gap.id}:${gap.severity}:${gap.impact}`).join('|');
  const secondDigest = second.detectedGaps.map((gap) => `${gap.id}:${gap.severity}:${gap.impact}`).join('|');
  return {
    passed: firstDigest === secondDigest && first.gapDetectionScore === second.gapDetectionScore,
    detail: firstDigest,
  };
}

export function validateGapRecommendationGeneration(assessment: GapDetectionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}
