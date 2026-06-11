/**
 * Trust Authority Validator — bounded integrity checks.
 */

import { TRUST_LAUNCH_BLOCK_SCORE, TRUST_RISK_BLOCK_THRESHOLD } from './trust-authority-bounds.js';
import { TRUST_SCENARIOS } from './trust-scenarios.js';
import type { TrustAssessment, TrustScenarioResult } from './trust-authority-types.js';

export function validateTrustScenarioCount(): { passed: boolean; detail: string } {
  const passed = TRUST_SCENARIOS.length === 5;
  return { passed, detail: `count=${TRUST_SCENARIOS.length}` };
}

export function validateTrustDeterministicScoring(
  first: TrustScenarioResult[],
  second: TrustScenarioResult[],
): { passed: boolean; detail: string } {
  const firstDigest = first.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  const secondDigest = second.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  return { passed: firstDigest === secondDigest, detail: firstDigest };
}

export function validateTrustLaunchBlocking(input: {
  trustScore: number;
  trustRiskScore: number;
  criticalTrustFailures: number;
  blocksLaunchReadiness: boolean;
}): { passed: boolean; detail: string } {
  const shouldBlock =
    input.trustScore < TRUST_LAUNCH_BLOCK_SCORE ||
    input.criticalTrustFailures > 0 ||
    input.trustRiskScore > TRUST_RISK_BLOCK_THRESHOLD;
  return {
    passed: input.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${input.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateTrustRiskCalculation(
  assessment: TrustAssessment,
  expectedAtLeast: number,
): { passed: boolean; detail: string } {
  return {
    passed: assessment.trustRiskScore >= expectedAtLeast,
    detail: `risk=${assessment.trustRiskScore}`,
  };
}

export function validateCriticalTrustFailureDetection(assessment: TrustAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.criticalTrustFailures === assessment.criticalTrustFailureDetails.length,
    detail: `count=${assessment.criticalTrustFailures}`,
  };
}
