/**
 * Founder Workflow Validation — workflow efficiency validator.
 */

import type { FounderWorkflowValidationInput, WorkflowEfficiencyValidation } from './founder-workflow-types.js';
import { WORKFLOW_EFFICIENCY_PASS, clampScore } from './founder-workflow-types.js';
import { boundGaps, createWorkflowGap } from './workflow-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-workflow-cache.js';

export interface WorkflowEfficiencyUpstream {
  founderUsabilityScore: number;
  cognitiveLoadScore: number;
  workflowContinuityScore: number;
  stepOverheadEstimate: number;
}

let validateCount = 0;

export function validateWorkflowEfficiency(
  input: FounderWorkflowValidationInput,
  upstream: WorkflowEfficiencyUpstream,
): WorkflowEfficiencyValidation {
  const cacheKey = [input.requestId, upstream.founderUsabilityScore, input.workflowEfficiencyLow].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_EFFICIENCY_PASS) return cached as WorkflowEfficiencyValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const overheadPenalty = upstream.stepOverheadEstimate * 3;
  const baseScore = Math.round(
    (upstream.founderUsabilityScore + upstream.cognitiveLoadScore + upstream.workflowContinuityScore) / 3
      - overheadPenalty,
  );

  if (input.workflowEfficiencyLow === true || input.excessiveSteps === true || baseScore < 75) {
    detectionCodes.push('WORKFLOW_EFFICIENCY');
    gaps.push(createWorkflowGap({
      title: 'Workflow efficiency below founder expectations',
      description: 'Workflow complexity, overhead, or repetition reduces operational efficiency',
      severity: baseScore < 60 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_EFFICIENCY',
      sourceValidator: 'workflow-efficiency-validator',
    }));
  }
  if (upstream.cognitiveLoadScore < 65) {
    gaps.push(createWorkflowGap({
      title: 'High workflow cognitive overhead',
      description: 'Founder must hold too much context to complete workflow efficiently',
      severity: 'MAJOR',
      detectionCode: 'EFFICIENCY_GAPS',
      sourceValidator: 'workflow-efficiency-validator',
    }));
  }
  if (input.excessiveSteps === true) {
    gaps.push(createWorkflowGap({
      title: 'Workflow repetition and overhead',
      description: 'Founder repeats steps or switches context excessively within workflow',
      severity: 'MINOR',
      detectionCode: 'EFFICIENCY_GAPS',
      sourceValidator: 'workflow-efficiency-validator',
    }));
  }

  const efficiencyScore = clampScore(baseScore - gaps.length * 4);
  const result: WorkflowEfficiencyValidation = {
    validatorType: 'WORKFLOW_EFFICIENCY',
    score: efficiencyScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_EFFICIENCY_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getEfficiencyValidateCount(): number {
  return validateCount;
}

export function resetWorkflowEfficiencyValidatorForTests(): void {
  validateCount = 0;
}
