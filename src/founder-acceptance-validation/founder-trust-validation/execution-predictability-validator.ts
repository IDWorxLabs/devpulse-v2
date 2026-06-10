/**
 * Founder Trust Validation — execution predictability validator.
 */

import type { FounderTrustValidationInput, ExecutionPredictabilityValidation } from './founder-trust-types.js';
import { EXECUTION_TRUST_PASS, clampScore } from './founder-trust-types.js';
import { boundGaps, createTrustGap } from './trust-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-trust-cache.js';

export interface ExecutionPredictabilityUpstream {
  workflowContinuityScore: number;
  experienceContinuityScore: number;
  founderUsabilityScore: number;
  hiddenExecutionRisk: boolean;
}

let validateCount = 0;

export function validateExecutionPredictability(
  input: FounderTrustValidationInput,
  upstream: ExecutionPredictabilityUpstream,
): ExecutionPredictabilityValidation {
  const cacheKey = [input.requestId, upstream.workflowContinuityScore, input.executionUnpredictable].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === EXECUTION_TRUST_PASS) return cached as ExecutionPredictabilityValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.workflowContinuityScore + upstream.experienceContinuityScore + upstream.founderUsabilityScore) / 3,
  );

  if (input.executionUnpredictable === true || input.hiddenExecution === true || baseScore < 72) {
    detectionCodes.push('EXECUTION_TRUST');
    gaps.push(createTrustGap({
      title: 'System behavior may be unpredictable',
      description: 'Actions not explainable, outputs inconsistent, or unexpected behavior possible',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'EXECUTION_TRUST',
      sourceValidator: 'execution-predictability-validator',
      trustContext: 'EXECUTION_TRUST',
    }));
  }
  if (upstream.hiddenExecutionRisk) {
    gaps.push(createTrustGap({
      title: 'Hidden execution risk undermines predictability',
      description: 'Founder cannot predict when system may execute without visibility',
      severity: 'MAJOR',
      detectionCode: 'EXECUTION_TRUST_GAPS',
      sourceValidator: 'execution-predictability-validator',
      trustContext: 'EXECUTION_TRUST',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ExecutionPredictabilityValidation = {
    validatorType: 'EXECUTION_TRUST',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: EXECUTION_TRUST_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getExecutionValidateCount(): number {
  return validateCount;
}

export function resetExecutionPredictabilityValidatorForTests(): void {
  validateCount = 0;
}
