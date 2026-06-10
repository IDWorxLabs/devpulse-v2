/**
 * Interactive Explanations — workflow explanation analyzer.
 */

import type {
  InteractiveExplanationsInput,
  WorkflowExplanationAnalysis,
} from './interactive-explanations-types.js';
import { getCachedWorkflowExplanation, setCachedWorkflowExplanation } from './interactive-explanations-cache.js';

export interface WorkflowExplanationSnapshot {
  hasProjectWorkflow: boolean;
  hasVerificationWorkflow: boolean;
  hasTrustWorkflow: boolean;
}

const BASE_WORKFLOWS = [
  'project_workflows',
  'verification_workflows',
  'trust_workflows',
  'hardening_workflows',
  'documentation_workflows',
  'launch_workflows',
] as const;

let workflowAnalysisCount = 0;

export function analyzeWorkflowExplanation(
  input: InteractiveExplanationsInput,
  snapshot: WorkflowExplanationSnapshot,
): WorkflowExplanationAnalysis {
  const cacheKey = [
    snapshot.hasProjectWorkflow,
    snapshot.hasVerificationWorkflow,
    input.missingProjectWorkflowExplanation,
    input.missingVerificationWorkflowExplanation,
    ...(input.undocumentedWorkflows ?? []),
  ].join('|');

  const cached = getCachedWorkflowExplanation(cacheKey);
  if (cached) return cached;

  workflowAnalysisCount += 1;
  const workflowWarnings: string[] = [];
  const undocumentedWorkflows: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingProjectWorkflowExplanation, 'missing_project_workflow_explanation', 'project_workflows'],
    [input.missingVerificationWorkflowExplanation, 'missing_verification_workflow_explanation', 'verification_workflows'],
    [input.missingTrustWorkflowExplanation, 'missing_trust_workflow_explanation', 'trust_workflows'],
    [input.missingHardeningWorkflowExplanation, 'missing_hardening_workflow_explanation', 'hardening_workflows'],
    [input.missingDocumentationWorkflowExplanation, 'missing_documentation_workflow_explanation', 'documentation_workflows'],
    [input.missingLaunchWorkflowExplanation, 'missing_launch_workflow_explanation', 'launch_workflows'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      workflowWarnings.push(warning);
      undocumentedWorkflows.push(area);
      penalty += 9;
    }
  }

  for (const workflow of input.undocumentedWorkflows ?? []) {
    if (!undocumentedWorkflows.includes(workflow)) {
      undocumentedWorkflows.push(workflow);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.hasProjectWorkflow ? 8 : 0)
    + (snapshot.hasVerificationWorkflow ? 8 : 0)
    + (snapshot.hasTrustWorkflow ? 7 : 0);
  const documented = BASE_WORKFLOWS.length - undocumentedWorkflows.filter(
    (w) => BASE_WORKFLOWS.includes(w as typeof BASE_WORKFLOWS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_WORKFLOWS.length) * 80 + systemBonus);
  const workflowCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: WorkflowExplanationAnalysis = { workflowCoverageScore, undocumentedWorkflows, workflowWarnings };
  setCachedWorkflowExplanation(cacheKey, result);
  return result;
}

export function getWorkflowAnalysisCount(): number {
  return workflowAnalysisCount;
}

export function resetWorkflowExplanationAnalyzerForTests(): void {
  workflowAnalysisCount = 0;
}

export function listBaseWorkflowAreas(): readonly string[] {
  return BASE_WORKFLOWS;
}
