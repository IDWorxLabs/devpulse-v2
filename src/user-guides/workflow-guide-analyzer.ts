/**
 * User Guides — workflow guide analyzer.
 */

import type { UserGuidesInput, WorkflowGuideAnalysis } from './user-guides-types.js';
import { getCachedWorkflowAnalysis, setCachedWorkflowAnalysis } from './user-guides-cache.js';

export interface WorkflowGuideSnapshot {
  hasProjectWorkflow: boolean;
  hasVerificationWorkflow: boolean;
  hasNotificationWorkflow: boolean;
  hasMobileWorkflow: boolean;
  hasWorld2Workflow: boolean;
}

const BASE_WORKFLOWS = [
  'project_creation',
  'project_management',
  'verification',
  'notification',
  'mobile',
  'world2',
  'monitoring',
  'trust',
] as const;

let workflowAnalysisCount = 0;

export function analyzeWorkflowGuide(
  input: UserGuidesInput,
  snapshot: WorkflowGuideSnapshot,
): WorkflowGuideAnalysis {
  const cacheKey = [
    snapshot.hasProjectWorkflow,
    snapshot.hasVerificationWorkflow,
    input.missingProjectManagementWorkflow,
    input.missingWorld2WorkflowGuidance,
    ...(input.undocumentedWorkflows ?? []),
  ].join('|');

  const cached = getCachedWorkflowAnalysis(cacheKey);
  if (cached) return cached;

  workflowAnalysisCount += 1;
  const workflowWarnings: string[] = [];
  const undocumentedWorkflows: string[] = [];
  let penalty = 0;

  if (input.missingProjectManagementWorkflow === true) {
    workflowWarnings.push('missing_project_management_workflow');
    undocumentedWorkflows.push('project_management');
    penalty += 10;
  }
  if (input.missingWorld2WorkflowGuidance === true) {
    workflowWarnings.push('missing_world2_workflow_guidance');
    undocumentedWorkflows.push('world2');
    penalty += 8;
  }
  if (input.missingMonitoringWorkflowGuidance === true) {
    workflowWarnings.push('missing_monitoring_workflow_guidance');
    undocumentedWorkflows.push('monitoring');
    penalty += 8;
  }
  if (input.missingTrustWorkflowGuidance === true) {
    workflowWarnings.push('missing_trust_workflow_guidance');
    undocumentedWorkflows.push('trust');
    penalty += 8;
  }

  for (const workflow of input.undocumentedWorkflows ?? []) {
    if (!undocumentedWorkflows.includes(workflow)) {
      undocumentedWorkflows.push(workflow);
      penalty += 6;
    }
  }

  if (!snapshot.hasProjectWorkflow) undocumentedWorkflows.push('project_creation');
  if (!snapshot.hasVerificationWorkflow) undocumentedWorkflows.push('verification');
  if (!snapshot.hasNotificationWorkflow) undocumentedWorkflows.push('notification');
  if (!snapshot.hasMobileWorkflow) undocumentedWorkflows.push('mobile');
  if (!snapshot.hasWorld2Workflow) undocumentedWorkflows.push('world2');

  const uniqueUndocumented = [...new Set(undocumentedWorkflows)];
  const documented = BASE_WORKFLOWS.length - uniqueUndocumented.filter(
    (w) => BASE_WORKFLOWS.includes(w as typeof BASE_WORKFLOWS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_WORKFLOWS.length) * 90);
  const workflowCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: WorkflowGuideAnalysis = {
    workflowCoverageScore,
    undocumentedWorkflows: uniqueUndocumented,
    workflowWarnings,
  };

  setCachedWorkflowAnalysis(cacheKey, result);
  return result;
}

export function getWorkflowAnalysisCount(): number {
  return workflowAnalysisCount;
}

export function resetWorkflowGuideAnalyzerForTests(): void {
  workflowAnalysisCount = 0;
}

export function listBaseWorkflows(): readonly string[] {
  return BASE_WORKFLOWS;
}
