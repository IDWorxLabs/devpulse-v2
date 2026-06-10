/**
 * Founder Workflow Validation — workflow outcome validator.
 */

import type { FounderWorkflowValidationInput, WorkflowOutcomeValidation } from './founder-workflow-types.js';
import { WORKFLOW_OUTCOME_PASS, clampScore } from './founder-workflow-types.js';
import { boundGaps, createWorkflowGap } from './workflow-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-workflow-cache.js';

export interface WorkflowOutcomeUpstream {
  actionReadinessScore: number;
  previewNextActionScore: number;
  productRealityScore: number;
  workflowContinuityScore: number;
}

let validateCount = 0;

export function validateWorkflowOutcome(
  input: FounderWorkflowValidationInput,
  upstream: WorkflowOutcomeUpstream,
): WorkflowOutcomeValidation {
  const cacheKey = [input.requestId, upstream.actionReadinessScore, input.workflowOutcomeUnclear].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_OUTCOME_PASS) return cached as WorkflowOutcomeValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.actionReadinessScore + upstream.previewNextActionScore + upstream.productRealityScore) / 3,
  );

  if (input.workflowOutcomeUnclear === true || baseScore < 75) {
    detectionCodes.push('WORKFLOW_OUTCOME');
    gaps.push(createWorkflowGap({
      title: 'Workflow outcomes not realistically reachable',
      description: 'Founder workflows cannot reliably reach intended operational outcomes',
      severity: baseScore < 60 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_OUTCOME',
      sourceValidator: 'workflow-outcome-validator',
      workflowContext: 'VALIDATION_TO_RELEASE',
    }));
  }
  if (upstream.previewNextActionScore < 65) {
    gaps.push(createWorkflowGap({
      title: 'Outcome lacks next action',
      description: 'Workflow completes without clear founder next action toward outcome',
      severity: 'MAJOR',
      detectionCode: 'OUTCOME_GAPS',
      sourceValidator: 'workflow-outcome-validator',
      workflowContext: 'FIX_TO_VALIDATION',
    }));
  }
  if (upstream.workflowContinuityScore < 70) {
    gaps.push(createWorkflowGap({
      title: 'Outcome path fragmented',
      description: 'Workflow stages do not chain cleanly to intended outcome',
      severity: 'MINOR',
      detectionCode: 'OUTCOME_GAPS',
      sourceValidator: 'workflow-outcome-validator',
    }));
  }

  const outcomeScore = clampScore(baseScore - gaps.length * 4);
  const result: WorkflowOutcomeValidation = {
    validatorType: 'WORKFLOW_OUTCOME',
    score: outcomeScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_OUTCOME_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getOutcomeValidateCount(): number {
  return validateCount;
}

export function resetWorkflowOutcomeValidatorForTests(): void {
  validateCount = 0;
}
