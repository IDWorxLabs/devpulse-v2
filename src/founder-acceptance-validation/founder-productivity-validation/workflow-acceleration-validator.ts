/**
 * Founder Productivity Validation — workflow acceleration validator.
 */

import type { FounderProductivityValidationInput, WorkflowAccelerationValidation } from './founder-productivity-types.js';
import { WORKFLOW_ACCELERATION_PASS, clampScore } from './founder-productivity-types.js';
import { boundGaps, createProductivityGap } from './productivity-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-productivity-cache.js';

export interface WorkflowAccelerationUpstream {
  workflowEfficiencyScore: number;
  workflowContinuityScore: number;
  outcomeScore: number;
  stepOverheadEstimate: number;
}

let validateCount = 0;

export function validateWorkflowAcceleration(
  input: FounderProductivityValidationInput,
  upstream: WorkflowAccelerationUpstream,
): WorkflowAccelerationValidation {
  const cacheKey = [input.requestId, upstream.workflowEfficiencyScore, input.workflowSlow].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_ACCELERATION_PASS) return cached as WorkflowAccelerationValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.workflowEfficiencyScore + upstream.workflowContinuityScore + upstream.outcomeScore) / 3
      - upstream.stepOverheadEstimate * 4,
  );

  if (input.workflowSlow === true || input.excessiveSteps === true || baseScore < 72) {
    detectionCodes.push('WORKFLOW_ACCELERATION');
    gaps.push(createProductivityGap({
      title: 'Idea-to-outcome flow not sufficiently accelerated',
      description: 'Workflow duration, unnecessary steps, or execution path not optimized for founder speed',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_ACCELERATION',
      sourceValidator: 'workflow-acceleration-validator',
      productivityContext: 'IDEA_TO_EXECUTION_PRODUCTIVITY',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: WorkflowAccelerationValidation = {
    validatorType: 'WORKFLOW_ACCELERATION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_ACCELERATION_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getAccelerationValidateCount(): number {
  return validateCount;
}

export function resetWorkflowAccelerationValidatorForTests(): void {
  validateCount = 0;
}
