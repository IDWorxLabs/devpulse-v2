/**
 * Founder Workflow Validation — workflow clarity validator.
 */

import type { FounderWorkflowValidationInput, WorkflowClarityValidation } from './founder-workflow-types.js';
import { WORKFLOW_CLARITY_PASS, clampScore } from './founder-workflow-types.js';
import { boundGaps, createWorkflowGap } from './workflow-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-workflow-cache.js';

export interface WorkflowClarityUpstream {
  navigationClarityScore: number;
  actionClarityScore: number;
  founderUsabilityScore: number;
  workflowContinuityScore: number;
}

let validateCount = 0;

export function validateWorkflowClarity(
  input: FounderWorkflowValidationInput,
  upstream: WorkflowClarityUpstream,
): WorkflowClarityValidation {
  const cacheKey = [input.requestId, upstream.navigationClarityScore, input.workflowClarityWeak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_CLARITY_PASS) return cached as WorkflowClarityValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.navigationClarityScore + upstream.actionClarityScore + upstream.founderUsabilityScore) / 3,
  );

  if (input.workflowClarityWeak === true || baseScore < 75) {
    detectionCodes.push('WORKFLOW_CLARITY');
    gaps.push(createWorkflowGap({
      title: 'Founder cannot understand what to do next',
      description: 'Workflow steps, destinations, and expected outcomes are unclear',
      severity: baseScore < 60 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_CLARITY',
      sourceValidator: 'workflow-clarity-validator',
      workflowContext: 'DISCOVERY_TO_ACTION',
    }));
  }
  if (upstream.workflowContinuityScore < 70) {
    gaps.push(createWorkflowGap({
      title: 'Unclear what happens next in workflow',
      description: 'Transition outcomes and next-step expectations not visible to founder',
      severity: 'MAJOR',
      detectionCode: 'CLARITY_GAPS',
      sourceValidator: 'workflow-clarity-validator',
    }));
  }

  const clarityScore = clampScore(baseScore - gaps.length * 5);
  const result: WorkflowClarityValidation = {
    validatorType: 'WORKFLOW_CLARITY',
    score: clarityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_CLARITY_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getClarityValidateCount(): number {
  return validateCount;
}

export function resetWorkflowClarityValidatorForTests(): void {
  validateCount = 0;
}
