/**
 * Unknown Discovery Authority Validator — bounded integrity checks.
 */

import {
  MAX_DISCOVERY_CATEGORIES,
  UNKNOWN_DISCOVERY_BLOCK_SCORE,
  UNKNOWN_HIGH_COUNT_BLOCK_THRESHOLD,
} from './unknown-discovery-bounds.js';
import { UNKNOWN_DISCOVERY_CATEGORIES } from './unknown-discovery-scenarios.js';
import type { UnknownDiscoveryAssessment, UnknownDiscoveryFinding } from './unknown-discovery-types.js';

const ALLOWED_CATEGORIES = [
  'UNTESTED_USER_BEHAVIOR',
  'EDGE_CASE',
  'CONTRADICTION',
  'COVERAGE_GAP',
  'ASSUMPTION_RISK',
  'LAUNCH_BLIND_SPOT',
] as const;

const ALLOWED_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export function validateUnknownDiscoveryCategoryCount(): { passed: boolean; detail: string } {
  const passed = UNKNOWN_DISCOVERY_CATEGORIES.length === MAX_DISCOVERY_CATEGORIES;
  return { passed, detail: `count=${UNKNOWN_DISCOVERY_CATEGORIES.length}` };
}

export function validateBlindSpotDetection(findings: UnknownDiscoveryFinding[]): { passed: boolean; detail: string } {
  const invalid = findings.filter(
    (finding) => !finding.recommendedTest || !finding.whyItMayBeMissed || finding.evidence.length === 0,
  );
  return {
    passed: findings.length === 0 || invalid.length === 0,
    detail: findings.length ? `findings=${findings.length}` : 'none',
  };
}

export function validateContradictionDetection(findings: UnknownDiscoveryFinding[]): { passed: boolean; detail: string } {
  const contradictions = findings.filter((finding) => finding.category === 'CONTRADICTION');
  return {
    passed: contradictions.every(
      (finding) => ALLOWED_CATEGORIES.includes(finding.category) && finding.evidence.length > 0,
    ),
    detail: `contradictions=${contradictions.length}`,
  };
}

export function validateCoverageGapDetection(findings: UnknownDiscoveryFinding[]): { passed: boolean; detail: string } {
  const coverage = findings.filter((finding) => finding.category === 'COVERAGE_GAP');
  const invalid = coverage.filter((finding) => !finding.recommendedTest);
  return {
    passed: invalid.length === 0,
    detail: `coverage=${coverage.length}`,
  };
}

export function validateUnknownDiscoveryClassification(findings: UnknownDiscoveryFinding[]): {
  passed: boolean;
  detail: string;
} {
  const invalidCategory = findings.filter((finding) => !ALLOWED_CATEGORIES.includes(finding.category));
  const invalidSeverity = findings.filter((finding) => !ALLOWED_SEVERITIES.includes(finding.severity));
  return {
    passed: invalidCategory.length === 0 && invalidSeverity.length === 0,
    detail:
      invalidCategory.length > 0
        ? String(invalidCategory[0]?.category)
        : invalidSeverity.length > 0
          ? String(invalidSeverity[0]?.severity)
          : `findings=${findings.length}`,
  };
}

export function validateRecommendedTestGeneration(assessment: UnknownDiscoveryAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendedTests.length > 0,
    detail: `recommendedTests=${assessment.recommendedTests.length}`,
  };
}

export function validateUnknownDiscoveryLaunchBlocking(assessment: UnknownDiscoveryAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.criticalFindingCount > 0 ||
    assessment.highFindingCount >= UNKNOWN_HIGH_COUNT_BLOCK_THRESHOLD ||
    assessment.unknownDiscoveryScore < UNKNOWN_DISCOVERY_BLOCK_SCORE;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateUnknownDiscoveryDeterministicScoring(
  first: UnknownDiscoveryAssessment,
  second: UnknownDiscoveryAssessment,
): { passed: boolean; detail: string } {
  const firstDigest = first.findings.map((finding) => `${finding.id}:${finding.severity}`).join('|');
  const secondDigest = second.findings.map((finding) => `${finding.id}:${finding.severity}`).join('|');
  return {
    passed: firstDigest === secondDigest && first.unknownDiscoveryScore === second.unknownDiscoveryScore,
    detail: firstDigest,
  };
}

export function validateUnknownDiscoveryRecommendationGeneration(assessment: UnknownDiscoveryAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}
