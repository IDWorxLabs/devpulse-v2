/**
 * Self-Awareness Authority Validator — bounded integrity checks.
 */

import {
  SELF_AWARENESS_BLOCK_SCORE,
  SELF_AWARENESS_RISK_BLOCK_THRESHOLD,
} from './self-awareness-bounds.js';
import { SELF_AWARENESS_SCENARIOS } from './self-awareness-scenarios.js';
import type { SelfAwarenessAssessment, SelfAwarenessScenarioResult } from './self-awareness-types.js';

export function validateSelfAwarenessScenarioCount(): { passed: boolean; detail: string } {
  const passed = SELF_AWARENESS_SCENARIOS.length === 6;
  return { passed, detail: `count=${SELF_AWARENESS_SCENARIOS.length}` };
}

export function validateSelfAwarenessDeterministicScoring(
  first: SelfAwarenessScenarioResult[],
  second: SelfAwarenessScenarioResult[],
): { passed: boolean; detail: string } {
  const firstDigest = first.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  const secondDigest = second.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  return { passed: firstDigest === secondDigest, detail: firstDigest };
}

export function validateSelfAwarenessLaunchBlocking(input: {
  selfAwarenessScore: number;
  selfAwarenessRiskScore: number;
  criticalAwarenessFailures: number;
  blocksLaunchReadiness: boolean;
}): { passed: boolean; detail: string } {
  const shouldBlock =
    input.selfAwarenessScore < SELF_AWARENESS_BLOCK_SCORE ||
    input.criticalAwarenessFailures > 0 ||
    input.selfAwarenessRiskScore > SELF_AWARENESS_RISK_BLOCK_THRESHOLD;
  return {
    passed: input.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${input.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateSelfAwarenessRiskCalculation(
  assessment: SelfAwarenessAssessment,
  expectedAtLeast: number,
): { passed: boolean; detail: string } {
  return {
    passed: assessment.selfAwarenessRiskScore >= expectedAtLeast,
    detail: `risk=${assessment.selfAwarenessRiskScore}`,
  };
}

export function validateCriticalAwarenessFailureDetection(assessment: SelfAwarenessAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.criticalAwarenessFailures === assessment.criticalAwarenessFailureDetails.length,
    detail: `count=${assessment.criticalAwarenessFailures}`,
  };
}

export function validateLimitationDetection(assessment: SelfAwarenessAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.limitations.length > 0,
    detail: `limitations=${assessment.limitations.length}`,
  };
}
