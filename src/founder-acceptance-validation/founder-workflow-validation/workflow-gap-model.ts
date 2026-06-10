/**
 * Founder Workflow Validation — bounded workflow gap model.
 */

import type { WorkflowGap, WorkflowGapSeverity } from './founder-workflow-types.js';

const MAX_PER_VALIDATOR = 8;
let gapCounter = 0;

export function resetWorkflowGapCounterForTests(): void {
  gapCounter = 0;
}

export function createWorkflowGap(params: {
  title: string;
  description: string;
  severity: WorkflowGapSeverity;
  detectionCode: string;
  sourceValidator: string;
  workflowContext?: WorkflowGap['workflowContext'];
}): WorkflowGap {
  gapCounter += 1;
  return {
    gapId: `workflow-gap-${gapCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    detectionCode: params.detectionCode,
    sourceValidator: params.sourceValidator,
    workflowContext: params.workflowContext,
  };
}

export function boundGaps(gaps: WorkflowGap[], max = MAX_PER_VALIDATOR): WorkflowGap[] {
  return gaps.slice(0, max);
}

export function mergeBoundedGaps(lists: WorkflowGap[][], maxTotal: number): WorkflowGap[] {
  const merged: WorkflowGap[] = [];
  for (const list of lists) {
    for (const gap of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(gap);
    }
  }
  return merged;
}

export function countCriticalGaps(gaps: readonly WorkflowGap[]): number {
  return gaps.filter((g) => g.severity === 'CRITICAL').length;
}

export const MAX_GAPS_PER_VALIDATOR = MAX_PER_VALIDATOR;
