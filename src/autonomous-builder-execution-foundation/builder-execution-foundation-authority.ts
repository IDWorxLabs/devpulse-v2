/**
 * Autonomous Builder Execution Foundation — unified authority (Phase 24B).
 * Planning plus controlled orchestration records only — no production execution.
 */

import {
  AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_OWNER_MODULE,
  AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_PASS_TOKEN,
} from './autonomous-builder-execution-foundation-bounds.js';
import { createBuilderAction, resetBuilderActionCounterForTests } from './builder-action-model.js';
import {
  enqueueBuilderAction,
  getBuilderActionQueueSize,
  getBuilderQueueAuditTrail,
  resetBuilderActionQueueForTests,
} from './builder-action-queue.js';
import {
  getBuilderExecutionFoundationSummary,
  type BuilderExecutionFoundationSummary,
} from './builder-execution-proof-integration.js';
import {
  getBuilderExecutionEvidenceCount,
  recordBuilderExecutionEvidence,
  resetBuilderExecutionEvidenceForTests,
} from './builder-execution-evidence.js';
import {
  buildExecutionPlan,
  getExecutionPlanCount,
  resetBuilderExecutionPlansForTests,
} from './builder-execution-plan-authority.js';
import {
  createBuilderExecutionWorkspace,
  getBuilderExecutionWorkspaceCount,
  resetBuilderExecutionWorkspacesForTests,
  updateBuilderExecutionWorkspace,
} from './builder-execution-workspace.js';

export {
  AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_PASS_TOKEN,
  AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_OWNER_MODULE,
};

export interface BuilderExecutionFoundationAssessment {
  summary: BuilderExecutionFoundationSummary;
  workspaceCount: number;
  planCount: number;
  queueSize: number;
  evidenceCount: number;
  auditTrailLength: number;
  assessedAt: number;
}

export function resetBuilderExecutionFoundationForTests(): void {
  resetBuilderExecutionWorkspacesForTests();
  resetBuilderActionCounterForTests();
  resetBuilderExecutionEvidenceForTests();
  resetBuilderExecutionPlansForTests();
  resetBuilderActionQueueForTests();
}

export interface PrepareBuilderExecutionFoundationInput {
  projectId: string;
  sourceProject: string;
  requirements: string[];
  architecture: string[];
  tasks: Array<{ taskId: string; title: string; actionType?: string }>;
}

/** Creates workspace, plan, queued actions, and planning evidence — does not execute actions. */
export function prepareBuilderExecutionFoundation(
  input: PrepareBuilderExecutionFoundationInput,
): BuilderExecutionFoundationAssessment {
  const workspace = createBuilderExecutionWorkspace({
    projectId: input.projectId,
    sourceProject: input.sourceProject,
    initialState: 'WORKSPACE_READY',
  });

  recordBuilderExecutionEvidence({
    workspaceId: workspace.workspaceId,
    evidenceType: 'WORKSPACE_CREATED',
    description: 'Isolated World 2 execution workspace created',
    source: 'builder-execution-workspace',
  });

  const plan = buildExecutionPlan({
    projectId: input.projectId,
    workspaceId: workspace.workspaceId,
    requirements: input.requirements,
    architecture: input.architecture,
    tasks: input.tasks,
  });

  recordBuilderExecutionEvidence({
    workspaceId: workspace.workspaceId,
    evidenceType: 'EXECUTION_PLAN_GENERATED',
    description: `Execution plan ${plan.planId} with ${plan.executionSteps.length} steps`,
    source: 'builder-execution-plan-authority',
  });

  for (const step of plan.executionSteps.slice(0, 5)) {
    const action = createBuilderAction({
      workspaceId: workspace.workspaceId,
      actionType: (step.actionType as import('./builder-action-model.js').BuilderActionType) ?? 'GENERATE_CODE',
      requestedBy: 'builder-execution-plan-authority',
      sourceRequirement: step.sourceTaskId,
      targetPath: plan.requiredFiles[0] ?? null,
      payloadSummary: step.title,
    });
    const queued = enqueueBuilderAction(action);
    if (queued.accepted && queued.action) {
      const evidence = recordBuilderExecutionEvidence({
        workspaceId: workspace.workspaceId,
        actionId: queued.action.actionId,
        evidenceType: 'ACTION_QUEUED',
        description: `${queued.action.actionType} queued — planned only`,
        source: 'builder-action-queue',
      });
      queued.action.evidenceProduced.push(evidence.evidenceId);
    }
  }

  updateBuilderExecutionWorkspace(workspace.workspaceId, {
    actionCount: getBuilderActionQueueSize(),
    evidenceCount: getBuilderExecutionEvidenceCount(workspace.workspaceId),
    executionState: 'WORKSPACE_READY',
  });

  return assessBuilderExecutionFoundation();
}

export function assessBuilderExecutionFoundation(): BuilderExecutionFoundationAssessment {
  const summary = getBuilderExecutionFoundationSummary();
  return {
    summary,
    workspaceCount: getBuilderExecutionWorkspaceCount(),
    planCount: getExecutionPlanCount(),
    queueSize: getBuilderActionQueueSize(),
    evidenceCount: getBuilderExecutionEvidenceCount(),
    auditTrailLength: getBuilderQueueAuditTrail().length,
    assessedAt: Date.now(),
  };
}
