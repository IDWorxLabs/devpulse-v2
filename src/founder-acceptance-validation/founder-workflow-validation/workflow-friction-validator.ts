/**
 * Founder Workflow Validation — workflow friction validator.
 */

import type { FounderWorkflowValidationInput, WorkflowFrictionValidation } from './founder-workflow-types.js';
import { WORKFLOW_FRICTION_PASS, clampScore } from './founder-workflow-types.js';
import { boundGaps, createWorkflowGap } from './workflow-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-workflow-cache.js';

export interface WorkflowFrictionUpstream {
  founderFrictionRiskCount: number;
  cognitiveLoadScore: number;
  feedbackQualityScore: number;
}

let validateCount = 0;

export function validateWorkflowFriction(
  input: FounderWorkflowValidationInput,
  upstream: WorkflowFrictionUpstream,
): WorkflowFrictionValidation {
  const cacheKey = [input.requestId, upstream.founderFrictionRiskCount, input.workflowFrictionHigh].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_FRICTION_PASS) return cached as WorkflowFrictionValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const frictionBase = 100 - upstream.founderFrictionRiskCount * 8 - (100 - upstream.cognitiveLoadScore) * 0.3;
  const baseScore = Math.round((frictionBase + upstream.feedbackQualityScore) / 2);

  if (input.workflowFrictionHigh === true || input.workflowDeadEnd === true || baseScore < 75) {
    detectionCodes.push('WORKFLOW_FRICTION');
    gaps.push(createWorkflowGap({
      title: 'Workflow friction detected',
      description: 'Unclear actions, hidden capabilities, or excessive steps impede founder workflow',
      severity: baseScore < 60 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_FRICTION',
      sourceValidator: 'workflow-friction-validator',
    }));
  }
  if (input.excessiveSteps === true) {
    gaps.push(createWorkflowGap({
      title: 'Excessive workflow steps',
      description: 'Founder must take too many steps to reach intended outcome',
      severity: 'MAJOR',
      detectionCode: 'FRICTION_GAPS',
      sourceValidator: 'workflow-friction-validator',
    }));
  }
  if (input.workflowDeadEnd === true) {
    gaps.push(createWorkflowGap({
      title: 'Workflow dead end',
      description: 'Workflow path terminates without clear resolution or next action',
      severity: 'CRITICAL',
      detectionCode: 'FRICTION_GAPS',
      sourceValidator: 'workflow-friction-validator',
      workflowContext: 'VERIFICATION_TO_FIX',
    }));
  }
  if (input.hiddenCapabilities === true) {
    gaps.push(createWorkflowGap({
      title: 'Hidden capabilities increase friction',
      description: 'Required workflow capabilities not visible or discoverable',
      severity: 'MAJOR',
      detectionCode: 'FRICTION_GAPS',
      sourceValidator: 'workflow-friction-validator',
    }));
  }

  const frictionScore = clampScore(baseScore - gaps.length * 4);
  const result: WorkflowFrictionValidation = {
    validatorType: 'WORKFLOW_FRICTION',
    score: frictionScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_FRICTION_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getFrictionValidateCount(): number {
  return validateCount;
}

export function resetWorkflowFrictionValidatorForTests(): void {
  validateCount = 0;
}
