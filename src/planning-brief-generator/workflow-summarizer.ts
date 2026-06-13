/**
 * Workflow Summarizer — detected workflows for planning brief (V1).
 */

import type { PlanningBriefEvidenceBundle, PlanningBriefWorkflowItem } from './planning-brief-types.js';

let workflowCounter = 0;

export function resetWorkflowSummarizerCounterForTests(): void {
  workflowCounter = 0;
}

export function summarizeWorkflows(bundle: PlanningBriefEvidenceBundle): PlanningBriefWorkflowItem[] {
  return bundle.workflows.map((name) => {
    workflowCounter += 1;
    return {
      readOnly: true,
      workflowId: `workflow-${workflowCounter}`,
      name,
      evidence: [`WORKFLOW:${name}`, ...bundle.sources.slice(0, 2)],
    };
  });
}
