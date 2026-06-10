/**
 * Founder Productivity Validation — execution efficiency validator.
 */

import type { FounderProductivityValidationInput, ExecutionEfficiencyValidation } from './founder-productivity-types.js';
import { EXECUTION_EFFICIENCY_PASS, clampScore } from './founder-productivity-types.js';
import { boundGaps, createProductivityGap } from './productivity-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-productivity-cache.js';

export interface ExecutionEfficiencyUpstream {
  workflowEfficiencyScore: number;
  founderUsabilityScore: number;
  validationEfficiencyScore: number;
  coordinationScore: number;
}

let validateCount = 0;

export function validateExecutionEfficiency(
  input: FounderProductivityValidationInput,
  upstream: ExecutionEfficiencyUpstream,
): ExecutionEfficiencyValidation {
  const cacheKey = [input.requestId, upstream.workflowEfficiencyScore, input.executionInefficient].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === EXECUTION_EFFICIENCY_PASS) return cached as ExecutionEfficiencyValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.workflowEfficiencyScore + upstream.founderUsabilityScore
      + upstream.validationEfficiencyScore + upstream.coordinationScore) / 4,
  );

  if (input.executionInefficient === true || baseScore < 72) {
    detectionCodes.push('EXECUTION_EFFICIENCY');
    gaps.push(createProductivityGap({
      title: 'Execution efficiency below founder productivity target',
      description: 'Workflow, validation, or coordination efficiency not optimized for founder throughput',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'EXECUTION_EFFICIENCY',
      sourceValidator: 'execution-efficiency-validator',
      productivityContext: 'BUILD_PRODUCTIVITY',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ExecutionEfficiencyValidation = {
    validatorType: 'EXECUTION_EFFICIENCY',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: EXECUTION_EFFICIENCY_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getExecutionValidateCount(): number {
  return validateCount;
}

export function resetExecutionEfficiencyValidatorForTests(): void {
  validateCount = 0;
}
