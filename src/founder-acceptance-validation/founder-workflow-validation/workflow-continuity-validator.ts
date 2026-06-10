/**
 * Founder Workflow Validation — workflow continuity validator.
 */

import type { FounderWorkflowValidationInput, WorkflowContinuityValidation } from './founder-workflow-types.js';
import { WORKFLOW_CONTINUITY_PASS, clampScore } from './founder-workflow-types.js';
import { boundGaps, createWorkflowGap } from './workflow-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-workflow-cache.js';

export interface WorkflowContinuityUpstream {
  workflowContinuityScore: number;
  experienceContinuityScore: number;
  chatToFeedConnected: boolean;
  previewReportConnected: boolean;
}

let validateCount = 0;

export function validateWorkflowContinuity(
  input: FounderWorkflowValidationInput,
  upstream: WorkflowContinuityUpstream,
): WorkflowContinuityValidation {
  const cacheKey = [input.requestId, upstream.workflowContinuityScore, input.workflowContinuityBreak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_CONTINUITY_PASS) return cached as WorkflowContinuityValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.workflowContinuityScore + upstream.experienceContinuityScore) / 2,
  );

  if (input.workflowContinuityBreak === true || input.contextLoss === true || baseScore < 75) {
    detectionCodes.push('WORKFLOW_CONTINUITY');
    gaps.push(createWorkflowGap({
      title: 'Workflow context lost between transitions',
      description: 'Founder loses orientation or task context when moving between workflow stages',
      severity: baseScore < 60 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_CONTINUITY',
      sourceValidator: 'workflow-continuity-validator',
      workflowContext: 'VERIFICATION_TO_FIX',
    }));
  }
  if (!upstream.chatToFeedConnected) {
    gaps.push(createWorkflowGap({
      title: 'Next-step continuity break',
      description: 'Chat actions do not continue visibly into operator feed workflow',
      severity: 'MAJOR',
      detectionCode: 'CONTINUITY_GAPS',
      sourceValidator: 'workflow-continuity-validator',
    }));
  }
  if (!upstream.previewReportConnected) {
    gaps.push(createWorkflowGap({
      title: 'Preview-to-report transition gap',
      description: 'Build-to-verification workflow lacks preview-report connection',
      severity: 'MINOR',
      detectionCode: 'CONTINUITY_GAPS',
      sourceValidator: 'workflow-continuity-validator',
      workflowContext: 'BUILD_TO_VERIFICATION',
    }));
  }

  const continuityScore = clampScore(baseScore - gaps.length * 4);
  const result: WorkflowContinuityValidation = {
    validatorType: 'WORKFLOW_CONTINUITY',
    score: continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_CONTINUITY_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getContinuityValidateCount(): number {
  return validateCount;
}

export function resetWorkflowContinuityValidatorForTests(): void {
  validateCount = 0;
}
