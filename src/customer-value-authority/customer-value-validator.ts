/**
 * Customer Value Authority Validator — bounded integrity checks.
 */

import {
  CUSTOMER_VALUE_BLOCK_SCORE,
  MAX_CUSTOMER_VALUE_CATEGORIES,
} from './customer-value-bounds.js';
import { CUSTOMER_VALUE_SCENARIOS } from './customer-value-scenarios.js';
import type { CustomerValueAssessment, CustomerValueScenarioResult } from './customer-value-types.js';

const ALLOWED_CATEGORIES = [
  'PROBLEM_VALUE',
  'OUTCOME_VALUE',
  'TIME_VALUE',
  'TRUST_VALUE',
  'REPEAT_USAGE_VALUE',
  'DIFFERENTIATION_VALUE',
] as const;

export function validateCustomerValueCategoryCount(): { passed: boolean; detail: string } {
  const passed = CUSTOMER_VALUE_SCENARIOS.length === MAX_CUSTOMER_VALUE_CATEGORIES;
  return { passed, detail: `count=${CUSTOMER_VALUE_SCENARIOS.length}` };
}

export function validateCustomerValueEvaluation(scenarios: CustomerValueScenarioResult[]): {
  passed: boolean;
  detail: string;
} {
  const invalid = scenarios.filter((scenario) => scenario.findings.length === 0);
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? 'missing findings' : `scenarios=${scenarios.length}`,
  };
}

export function validateRetentionScoring(assessment: CustomerValueAssessment): { passed: boolean; detail: string } {
  return {
    passed: assessment.retentionValueScore >= 0 && assessment.retentionValueScore <= 100,
    detail: String(assessment.retentionValueScore),
  };
}

export function validateValueRiskDetection(assessment: CustomerValueAssessment): { passed: boolean; detail: string } {
  return {
    passed: assessment.valueRiskScore >= 0 && assessment.valueRisks.length >= 0,
    detail: `riskScore=${assessment.valueRiskScore}; risks=${assessment.valueRisks.length}`,
  };
}

export function validateCriticalValueFailureDetection(assessment: CustomerValueAssessment): {
  passed: boolean;
  detail: string;
} {
  const expected = assessment.scenarioResults.filter((scenario) => !scenario.passed && scenario.score < 40).length;
  return {
    passed: assessment.criticalValueFailures === expected,
    detail: `critical=${assessment.criticalValueFailures}; expected=${expected}`,
  };
}

export function validateCustomerValueLaunchBlocking(assessment: CustomerValueAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.customerValueScore < CUSTOMER_VALUE_BLOCK_SCORE ||
    assessment.retentionValueScore < CUSTOMER_VALUE_BLOCK_SCORE ||
    assessment.criticalValueFailures > 0;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateCustomerValueDeterministicScoring(
  first: CustomerValueAssessment,
  second: CustomerValueAssessment,
): { passed: boolean; detail: string } {
  const firstDigest = first.scenarioResults.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  const secondDigest = second.scenarioResults.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  return {
    passed:
      firstDigest === secondDigest &&
      first.customerValueScore === second.customerValueScore &&
      first.retentionValueScore === second.retentionValueScore,
    detail: firstDigest,
  };
}

export function validateCustomerValueRecommendationGeneration(assessment: CustomerValueAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.recommendations.length > 0,
    detail: `recommendations=${assessment.recommendations.length}`,
  };
}

export function validateCustomerValueScenarioClassification(scenarios: CustomerValueScenarioResult[]): {
  passed: boolean;
  detail: string;
} {
  const invalid = scenarios.filter((scenario) => !ALLOWED_CATEGORIES.includes(scenario.category));
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? String(invalid[0]?.category) : `scenarios=${scenarios.length}`,
  };
}

export function validateCustomerValueAdvisoryOnly(assessment: CustomerValueAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.advisoryOnly === true && assessment.readOnly === true,
    detail: `advisory=${assessment.advisoryOnly}; readOnly=${assessment.readOnly}`,
  };
}
