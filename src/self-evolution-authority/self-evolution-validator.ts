/**
 * Self-Evolution Authority Validator — bounded integrity checks.
 */

import {
  EVOLUTION_REQUIRED_BLOCK_THRESHOLD,
  MAX_EVOLUTION_CATEGORIES,
  SELF_EVOLUTION_BLOCK_SCORE,
} from './self-evolution-bounds.js';
import { SELF_EVOLUTION_PATTERNS } from './self-evolution-patterns.js';
import type { SelfEvolutionAssessment, SelfEvolutionPattern } from './self-evolution-types.js';

const ALLOWED_STATUSES = ['MONITOR', 'ESCALATE', 'EVOLUTION_REQUIRED', 'BLOCKED'] as const;
const ALLOWED_CATEGORIES = [
  'CHAT_INTELLIGENCE',
  'TRUST',
  'USER_SUCCESS',
  'PROMISE_FULFILLMENT',
  'GAP_DETECTION',
  'REPOSITORY_INTEGRITY',
  'LAUNCH_READINESS',
  'SELF_AWARENESS',
] as const;

export function validateSelfEvolutionCategoryCount(): { passed: boolean; detail: string } {
  const passed = SELF_EVOLUTION_PATTERNS.length === MAX_EVOLUTION_CATEGORIES;
  return { passed, detail: `count=${SELF_EVOLUTION_PATTERNS.length}` };
}

export function validateRepeatedFailureDetection(patterns: SelfEvolutionPattern[]): { passed: boolean; detail: string } {
  const invalid = patterns.filter((pattern) => pattern.repeatCount < 2 || pattern.evidence.length === 0);
  return {
    passed: patterns.length === 0 || invalid.length === 0,
    detail: patterns.length ? `patterns=${patterns.length}` : 'none',
  };
}

export function validateEvolutionClassification(patterns: SelfEvolutionPattern[]): { passed: boolean; detail: string } {
  const invalidCategory = patterns.filter((pattern) => !ALLOWED_CATEGORIES.includes(pattern.category));
  const invalidStatus = patterns.filter((pattern) => !ALLOWED_STATUSES.includes(pattern.status));
  return {
    passed: invalidCategory.length === 0 && invalidStatus.length === 0,
    detail:
      invalidCategory.length > 0
        ? String(invalidCategory[0]?.category)
        : invalidStatus.length > 0
          ? String(invalidStatus[0]?.status)
          : `patterns=${patterns.length}`,
  };
}

export function validateMissingCapabilityMapping(patterns: SelfEvolutionPattern[]): { passed: boolean; detail: string } {
  const invalid = patterns.filter(
    (pattern) => !pattern.missingCapability || !pattern.recommendedEvolution || !pattern.failureSignal,
  );
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? 'missing capability mapping' : `patterns=${patterns.length}`,
  };
}

export function validateSelfEvolutionLaunchBlocking(assessment: SelfEvolutionAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.blockedEvolutionCount > 0 ||
    assessment.evolutionRequiredCount >= EVOLUTION_REQUIRED_BLOCK_THRESHOLD ||
    assessment.selfEvolutionScore < SELF_EVOLUTION_BLOCK_SCORE;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateSelfEvolutionDeterministicScoring(
  first: SelfEvolutionAssessment,
  second: SelfEvolutionAssessment,
): { passed: boolean; detail: string } {
  const firstDigest = first.patterns.map((pattern) => `${pattern.id}:${pattern.status}:${pattern.repeatCount}`).join('|');
  const secondDigest = second.patterns.map((pattern) => `${pattern.id}:${pattern.status}:${pattern.repeatCount}`).join('|');
  return {
    passed: firstDigest === secondDigest && first.selfEvolutionScore === second.selfEvolutionScore,
    detail: firstDigest,
  };
}

export function validateSelfEvolutionRecommendationGeneration(assessment: SelfEvolutionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}

export function validateSelfEvolutionAdvisoryOnly(assessment: SelfEvolutionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.advisoryOnly === true && assessment.readOnly === true,
    detail: `advisory=${assessment.advisoryOnly}; readOnly=${assessment.readOnly}`,
  };
}
