/**
 * Founder Productivity Validation — throughput validator.
 */

import type { FounderProductivityValidationInput, ThroughputValidation } from './founder-productivity-types.js';
import { THROUGHPUT_PASS, clampScore } from './founder-productivity-types.js';
import { boundGaps, createProductivityGap } from './productivity-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-productivity-cache.js';

export interface ThroughputUpstream {
  productRealityScore: number;
  releaseReadiness: string;
  launchBlockerCount: number;
  workflowOutcomeScore: number;
}

let validateCount = 0;

export function validateThroughput(
  input: FounderProductivityValidationInput,
  upstream: ThroughputUpstream,
): ThroughputValidation {
  const cacheKey = [input.requestId, upstream.productRealityScore, input.throughputLow].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === THROUGHPUT_PASS) return cached as ThroughputValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const readinessBonus = upstream.releaseReadiness === 'READY' ? 8 : upstream.releaseReadiness === 'PARTIALLY_READY' ? 4 : 0;
  const baseScore = Math.round(
    (upstream.productRealityScore + upstream.workflowOutcomeScore) / 2 + readinessBonus
      - upstream.launchBlockerCount * 3,
  );

  if (input.throughputLow === true || baseScore < 70) {
    detectionCodes.push('THROUGHPUT_PRODUCTIVITY');
    gaps.push(createProductivityGap({
      title: 'Project throughput below founder productivity target',
      description: 'Workflow, task completion, or validation throughput not meeting founder delivery pace',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'THROUGHPUT_PRODUCTIVITY',
      sourceValidator: 'throughput-validator',
      productivityContext: 'DELIVERY_PRODUCTIVITY',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ThroughputValidation = {
    validatorType: 'THROUGHPUT_PRODUCTIVITY',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: THROUGHPUT_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getThroughputValidateCount(): number {
  return validateCount;
}

export function resetThroughputValidatorForTests(): void {
  validateCount = 0;
}
