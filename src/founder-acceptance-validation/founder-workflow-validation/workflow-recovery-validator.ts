/**
 * Founder Workflow Validation — workflow recovery validator.
 */

import type { FounderWorkflowValidationInput, WorkflowRecoveryValidation } from './founder-workflow-types.js';
import { WORKFLOW_RECOVERY_PASS, clampScore } from './founder-workflow-types.js';
import { boundGaps, createWorkflowGap } from './workflow-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-workflow-cache.js';

export interface WorkflowRecoveryUpstream {
  errorPreventionScore: number;
  userControlScore: number;
  feedbackQualityScore: number;
  trustClarityScore: number;
}

let validateCount = 0;

export function validateWorkflowRecovery(
  input: FounderWorkflowValidationInput,
  upstream: WorkflowRecoveryUpstream,
): WorkflowRecoveryValidation {
  const cacheKey = [input.requestId, upstream.errorPreventionScore, input.workflowRecoveryWeak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_RECOVERY_PASS) return cached as WorkflowRecoveryValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.errorPreventionScore + upstream.userControlScore + upstream.feedbackQualityScore + upstream.trustClarityScore) / 4,
  );

  if (input.workflowRecoveryWeak === true || input.contextLoss === true || baseScore < 75) {
    detectionCodes.push('WORKFLOW_RECOVERY');
    gaps.push(createWorkflowGap({
      title: 'Weak workflow recovery paths',
      description: 'Founder cannot easily recover from mistakes, failed actions, or confusing states',
      severity: baseScore < 60 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_RECOVERY',
      sourceValidator: 'workflow-recovery-validator',
    }));
  }
  if (upstream.userControlScore < 70) {
    gaps.push(createWorkflowGap({
      title: 'Limited recovery control',
      description: 'Founder lacks clear control to undo, retry, or escalate from failed workflow states',
      severity: 'MAJOR',
      detectionCode: 'RECOVERY_GAPS',
      sourceValidator: 'workflow-recovery-validator',
    }));
  }

  const recoveryScore = clampScore(baseScore - gaps.length * 4);
  const result: WorkflowRecoveryValidation = {
    validatorType: 'WORKFLOW_RECOVERY',
    score: recoveryScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_RECOVERY_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getRecoveryValidateCount(): number {
  return validateCount;
}

export function resetWorkflowRecoveryValidatorForTests(): void {
  validateCount = 0;
}
