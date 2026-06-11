/**
 * Competitive Reality Authority Validator — bounded integrity checks.
 */

import {
  COMPETITIVE_REALITY_BLOCK_SCORE,
  MAX_COMPETITIVE_CATEGORIES,
} from './competitive-reality-bounds.js';
import { COMPETITIVE_REALITY_COMPARISONS } from './competitive-reality-scenarios.js';
import type { CompetitiveRealityAssessment, CompetitiveRealityFinding } from './competitive-reality-types.js';

const ALLOWED_CATEGORIES = [
  'GENERAL_AI_COMPARISON',
  'CODING_ASSISTANT_COMPARISON',
  'APP_BUILDER_COMPARISON',
  'AUTONOMOUS_AGENT_COMPARISON',
  'MANUAL_WORKFLOW_COMPARISON',
] as const;

const ALLOWED_LEVELS = ['NONE', 'WEAK', 'MODERATE', 'STRONG', 'UNIQUE'] as const;

export function validateCompetitiveCategoryCount(): { passed: boolean; detail: string } {
  const passed = COMPETITIVE_REALITY_COMPARISONS.length === MAX_COMPETITIVE_CATEGORIES;
  return { passed, detail: `count=${COMPETITIVE_REALITY_COMPARISONS.length}` };
}

export function validateDifferentiationEvaluation(findings: CompetitiveRealityFinding[]): {
  passed: boolean;
  detail: string;
} {
  const invalid = findings.filter(
    (finding) => !finding.evidence.length || !ALLOWED_LEVELS.includes(finding.differentiationLevel),
  );
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? 'missing evidence or invalid level' : `findings=${findings.length}`,
  };
}

export function validateCompetitiveRiskDetection(assessment: CompetitiveRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.competitiveRiskScore >= 0 && assessment.competitiveRisks.length >= 0,
    detail: `riskScore=${assessment.competitiveRiskScore}; risks=${assessment.competitiveRisks.length}`,
  };
}

export function validateUniqueAdvantageDetection(assessment: CompetitiveRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  const expected = assessment.findings.filter(
    (finding) => finding.differentiationLevel === 'UNIQUE' || finding.differentiationLevel === 'STRONG',
  ).length;
  return {
    passed: assessment.uniqueAdvantageCount === expected,
    detail: `unique=${assessment.uniqueAdvantageCount}; expected=${expected}`,
  };
}

export function validateCompetitiveClassification(findings: CompetitiveRealityFinding[]): {
  passed: boolean;
  detail: string;
} {
  const invalid = findings.filter((finding) => !ALLOWED_CATEGORIES.includes(finding.category));
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? String(invalid[0]?.category) : `findings=${findings.length}`,
  };
}

export function validateCompetitiveLaunchBlocking(assessment: CompetitiveRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.differentiationScore < COMPETITIVE_REALITY_BLOCK_SCORE ||
    assessment.competitiveRealityScore < COMPETITIVE_REALITY_BLOCK_SCORE ||
    assessment.uniqueAdvantageCount === 0;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateCompetitiveDeterministicScoring(
  first: CompetitiveRealityAssessment,
  second: CompetitiveRealityAssessment,
): { passed: boolean; detail: string } {
  const firstDigest = first.findings.map((finding) => `${finding.id}:${finding.differentiationLevel}`).join('|');
  const secondDigest = second.findings.map((finding) => `${finding.id}:${finding.differentiationLevel}`).join('|');
  return {
    passed:
      firstDigest === secondDigest &&
      first.competitiveRealityScore === second.competitiveRealityScore &&
      first.differentiationScore === second.differentiationScore,
    detail: firstDigest,
  };
}

export function validateCompetitiveRecommendationGeneration(assessment: CompetitiveRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}

export function validateCompetitiveAdvisoryOnly(assessment: CompetitiveRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.advisoryOnly === true && assessment.readOnly === true,
    detail: `advisory=${assessment.advisoryOnly}; readOnly=${assessment.readOnly}`,
  };
}
