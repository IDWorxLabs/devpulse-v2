/**
 * Founder Productivity Validation — workflow overhead validator.
 */

import type { FounderProductivityValidationInput, WorkflowOverheadValidation } from './founder-productivity-types.js';
import { WORKFLOW_OVERHEAD_PASS, clampScore } from './founder-productivity-types.js';
import { boundGaps, createProductivityGap } from './productivity-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-productivity-cache.js';

export interface WorkflowOverheadUpstream {
  cognitiveLoadScore: number;
  frictionScore: number;
  reportingOverheadEstimate: number;
  coordinationOverheadEstimate: number;
}

let validateCount = 0;

export function validateWorkflowOverhead(
  input: FounderProductivityValidationInput,
  upstream: WorkflowOverheadUpstream,
): WorkflowOverheadValidation {
  const cacheKey = [input.requestId, upstream.frictionScore, input.workflowOverheadHigh].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_OVERHEAD_PASS) return cached as WorkflowOverheadValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const overheadPenalty = upstream.reportingOverheadEstimate + upstream.coordinationOverheadEstimate;
  const baseScore = Math.round(
    (upstream.frictionScore + (100 - upstream.cognitiveLoadScore)) / 2 - overheadPenalty * 5,
  );

  if (input.workflowOverheadHigh === true || input.coordinationBurden === true || baseScore < 68) {
    detectionCodes.push('WORKFLOW_OVERHEAD');
    gaps.push(createProductivityGap({
      title: 'Workflow overhead reduces founder productivity',
      description: 'Operational, process, reporting, or coordination overhead too high for efficient founder work',
      severity: baseScore < 50 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_OVERHEAD',
      sourceValidator: 'workflow-overhead-validator',
      productivityContext: 'VERIFICATION_PRODUCTIVITY',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: WorkflowOverheadValidation = {
    validatorType: 'WORKFLOW_OVERHEAD',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_OVERHEAD_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getOverheadValidateCount(): number {
  return validateCount;
}

export function resetWorkflowOverheadValidatorForTests(): void {
  validateCount = 0;
}
