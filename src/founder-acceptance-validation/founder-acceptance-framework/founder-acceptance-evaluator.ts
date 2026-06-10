/**
 * Founder Acceptance Framework — evaluator.
 * Evaluates framework completeness only. No acceptance validation.
 */

import type {
  FounderAcceptanceFramework,
  FounderAcceptanceFrameworkAuthority,
  FounderAcceptanceFrameworkResult,
} from './founder-acceptance-types.js';
import { getCachedFrameworkResult, setCachedFrameworkResult } from './founder-acceptance-cache.js';

let evaluationCount = 0;

const EXPECTED_DIMENSIONS = 10;
const EXPECTED_CATEGORIES = 7;
const MIN_CRITERIA = 20;

export function evaluateFounderAcceptanceFramework(
  framework: FounderAcceptanceFramework,
  authority: FounderAcceptanceFrameworkAuthority,
): FounderAcceptanceFrameworkResult {
  const cacheKey = [framework.frameworkId, authority.authorityId].join('|');
  const cached = getCachedFrameworkResult(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const dimensionComplete = framework.dimensionCount >= EXPECTED_DIMENSIONS;
  const criteriaComplete = framework.criteriaCount >= MIN_CRITERIA;
  const categoryComplete = framework.categoryCount >= EXPECTED_CATEGORIES;
  const evidenceComplete = framework.evidenceSlotCount >= 8;
  const modelsComplete = authority.scoreModel.supportsFutureInputs
    && authority.reportModel.supportsFutureVerdicts
    && authority.futureRoadmap.futurePhases.length >= 7;

  const frameworkComplete = dimensionComplete && criteriaComplete && categoryComplete && evidenceComplete && modelsComplete;

  const result: FounderAcceptanceFrameworkResult = {
    resultId: `founder-acceptance-result-${framework.frameworkId}`,
    frameworkCompleteness: frameworkComplete ? 'FRAMEWORK_COMPLETE' : 'FRAMEWORK_INCOMPLETE',
    dimensionCount: framework.dimensionCount,
    criteriaCount: framework.criteriaCount,
    categoryCount: framework.categoryCount,
    evidenceSlotCount: framework.evidenceSlotCount,
    frameworkVerdict: frameworkComplete
      ? 'Founder Acceptance Framework established — ready for future validation phases'
      : 'Founder Acceptance Framework incomplete — missing required framework components',
    confidence: frameworkComplete ? 100 : Math.round(
      (framework.dimensionCount / EXPECTED_DIMENSIONS) * 25
        + (framework.criteriaCount / MIN_CRITERIA) * 25
        + (framework.categoryCount / EXPECTED_CATEGORIES) * 25
        + (framework.evidenceSlotCount / 8) * 25,
    ),
  };

  setCachedFrameworkResult(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderAcceptanceEvaluatorForTests(): void {
  evaluationCount = 0;
}
