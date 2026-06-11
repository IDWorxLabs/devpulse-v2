/**
 * User Success Authority Validator — bounded integrity checks.
 */

import {
  USER_SUCCESS_BLOCK_SCORE,
  USER_SUCCESS_OUTCOME_BLOCK_SCORE,
} from './user-success-bounds.js';
import { USER_SUCCESS_SCENARIOS } from './user-success-scenarios.js';
import type { UserSuccessAssessment, UserSuccessScenarioResult } from './user-success-types.js';

export function validateUserSuccessScenarioCount(): { passed: boolean; detail: string } {
  const passed = USER_SUCCESS_SCENARIOS.length === 6;
  return { passed, detail: `count=${USER_SUCCESS_SCENARIOS.length}` };
}

export function validateUserSuccessDeterministicScoring(
  first: UserSuccessScenarioResult[],
  second: UserSuccessScenarioResult[],
): { passed: boolean; detail: string } {
  const firstDigest = first.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  const secondDigest = second.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  return { passed: firstDigest === secondDigest, detail: firstDigest };
}

export function validateUserSuccessLaunchBlocking(input: {
  userSuccessScore: number;
  outcomeAchievementScore: number;
  criticalSuccessFailures: number;
  blocksLaunchReadiness: boolean;
}): { passed: boolean; detail: string } {
  const shouldBlock =
    input.userSuccessScore < USER_SUCCESS_BLOCK_SCORE ||
    input.criticalSuccessFailures > 0 ||
    input.outcomeAchievementScore < USER_SUCCESS_OUTCOME_BLOCK_SCORE;
  return {
    passed: input.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${input.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateCriticalSuccessFailureDetection(assessment: UserSuccessAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.criticalSuccessFailures === assessment.criticalSuccessFailureDetails.length,
    detail: `count=${assessment.criticalSuccessFailures}`,
  };
}

export function validateUserBlockerDetection(assessment: UserSuccessAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.blockers.length > 0,
    detail: `blockers=${assessment.blockers.length}`,
  };
}

export function validateOutcomeAchievementScoring(assessment: UserSuccessAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.outcomeAchievementScore >= 0 && assessment.outcomeAchievementScore <= 100,
    detail: `outcome=${assessment.outcomeAchievementScore}`,
  };
}
