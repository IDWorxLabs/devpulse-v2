/**
 * First-Time User Reality Authority Validator — bounded integrity checks.
 */

import {
  FIRST_TIME_USER_BLOCK_SCORE,
  FIRST_TIME_USER_CONFUSION_BLOCK_SCORE,
  MAX_FIRST_TIME_USER_CATEGORIES,
} from './first-time-user-reality-bounds.js';
import { FIRST_TIME_USER_REALITY_SCENARIOS } from './first-time-user-reality-scenarios.js';
import type { FirstTimeUserRealityAssessment, FirstTimeUserScenarioResult } from './first-time-user-reality-types.js';

const ALLOWED_CATEGORIES = [
  'PRODUCT_UNDERSTANDING',
  'CAPABILITY_UNDERSTANDING',
  'WORKFLOW_UNDERSTANDING',
  'CONFIDENCE_UNDERSTANDING',
  'SUCCESS_UNDERSTANDING',
  'LAUNCH_IMPRESSION',
] as const;

export function validateFirstTimeUserCategoryCount(): { passed: boolean; detail: string } {
  const passed = FIRST_TIME_USER_REALITY_SCENARIOS.length === MAX_FIRST_TIME_USER_CATEGORIES;
  return { passed, detail: `count=${FIRST_TIME_USER_REALITY_SCENARIOS.length}` };
}

export function validateConfusionDetection(scenarios: FirstTimeUserScenarioResult[]): { passed: boolean; detail: string } {
  const invalid = scenarios.filter((scenario) => !scenario.passed && scenario.confusionPoints.length === 0);
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? 'missing confusion points on failed scenario' : `scenarios=${scenarios.length}`,
  };
}

export function validateOnboardingEvaluation(scenarios: FirstTimeUserScenarioResult[]): { passed: boolean; detail: string } {
  const workflow = scenarios.find((scenario) => scenario.id === 'workflow-understanding');
  return {
    passed: Boolean(workflow),
    detail: workflow ? `score=${workflow.score}` : 'missing workflow scenario',
  };
}

export function validateWorkflowEvaluation(scenarios: FirstTimeUserScenarioResult[]): { passed: boolean; detail: string } {
  const workflow = scenarios.find((scenario) => scenario.category === 'WORKFLOW_UNDERSTANDING');
  return {
    passed: Boolean(workflow && workflow.findings.length > 0),
    detail: workflow ? `findings=${workflow.findings.length}` : 'missing workflow findings',
  };
}

export function validateFirstTimeUserLaunchBlocking(assessment: FirstTimeUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.firstTimeUserScore < FIRST_TIME_USER_BLOCK_SCORE ||
    assessment.criticalConfusionCount > 0 ||
    assessment.confusionScore > FIRST_TIME_USER_CONFUSION_BLOCK_SCORE;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateFirstTimeUserDeterministicScoring(
  first: FirstTimeUserRealityAssessment,
  second: FirstTimeUserRealityAssessment,
): { passed: boolean; detail: string } {
  const firstDigest = first.scenarioResults.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  const secondDigest = second.scenarioResults.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  return {
    passed:
      firstDigest === secondDigest &&
      first.firstTimeUserScore === second.firstTimeUserScore &&
      first.confusionScore === second.confusionScore,
    detail: firstDigest,
  };
}

export function validateFirstTimeUserRecommendationGeneration(assessment: FirstTimeUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}

export function validateFirstTimeUserScenarioClassification(scenarios: FirstTimeUserScenarioResult[]): {
  passed: boolean;
  detail: string;
} {
  const invalid = scenarios.filter((scenario) => !ALLOWED_CATEGORIES.includes(scenario.category));
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? String(invalid[0]?.category) : `scenarios=${scenarios.length}`,
  };
}

export function validateFirstTimeUserAdvisoryOnly(assessment: FirstTimeUserRealityAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.advisoryOnly === true && assessment.readOnly === true,
    detail: `advisory=${assessment.advisoryOnly}; readOnly=${assessment.readOnly}`,
  };
}
