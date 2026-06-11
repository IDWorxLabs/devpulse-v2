/**
 * Controlled builder execution authority — SAFE / ISOLATED / EVIDENCE_BACKED gate (Phase 24C).
 */

import {
  createBuilderAction,
  listExecutionPlans,
  type BuilderAction,
} from '../autonomous-builder-execution-foundation/index.js';
import {
  CONTROLLED_BUILDER_EXECUTION_ENGINE_OWNER_MODULE,
  CONTROLLED_BUILDER_EXECUTION_ENGINE_PASS_TOKEN,
} from './controlled-builder-execution-engine-bounds.js';
import { getBuilderExecutionAuditCount } from './builder-execution-audit-trail.js';
import { startBuilderExecutionSession } from './builder-execution-controller.js';
import { getControlledExecutionEvidenceCount, listControlledExecutionEvidence } from './builder-execution-evidence-collector.js';
import {
  getBuilderExecutionSessionCount,
  listBuilderExecutionSessions,
  type BuilderExecutionSession,
} from './builder-execution-session.js';
import {
  getControlledBuilderExecutionSummary,
  type ControlledBuilderExecutionSummary,
} from './controlled-builder-execution-proof-integration.js';
import { resetBuilderExecutionAuditTrailForTests } from './builder-execution-audit-trail.js';
import { resetControlledExecutionEvidenceForTests } from './builder-execution-evidence-collector.js';
import { resetBuilderExecutionSessionsForTests } from './builder-execution-session.js';
import { resetVirtualWorkspaceFilesForTests } from './builder-action-executor.js';
import { verifyWorkspaceIsolation } from './workspace-isolation-authority.js';

export {
  CONTROLLED_BUILDER_EXECUTION_ENGINE_PASS_TOKEN,
  CONTROLLED_BUILDER_EXECUTION_ENGINE_OWNER_MODULE,
};

export type ControlledExecutionReadiness = 'CONTROLLED_EXECUTION_READY' | 'CONTROLLED_EXECUTION_BLOCKED';

export interface ControlledBuilderExecutionAssessment {
  readiness: ControlledExecutionReadiness;
  executionConnected: boolean;
  isolationStatus: 'WORKSPACE_ISOLATION_PASS' | 'WORKSPACE_ISOLATION_FAIL';
  sessionCount: number;
  latestSession: BuilderExecutionSession | null;
  completedActions: number;
  evidenceCount: number;
  auditCount: number;
  summary: ControlledBuilderExecutionSummary;
  assessedAt: number;
}

export function resetControlledBuilderExecutionEngineForTests(): void {
  resetBuilderExecutionSessionsForTests();
  resetControlledExecutionEvidenceForTests();
  resetBuilderExecutionAuditTrailForTests();
  resetVirtualWorkspaceFilesForTests();
}

export interface RunControlledBuilderExecutionInput {
  workspaceId: string;
  projectId: string;
  executionPlanId?: string;
  actions?: BuilderAction[];
}

/** Runs approved actions inside an isolated workspace and produces evidence. */
export function runControlledBuilderExecution(
  input: RunControlledBuilderExecutionInput,
): ControlledBuilderExecutionAssessment {
  const isolation = verifyWorkspaceIsolation({ workspaceId: input.workspaceId });
  if (isolation.result === 'WORKSPACE_ISOLATION_FAIL') {
    return assessControlledBuilderExecution();
  }

  const planId =
    input.executionPlanId ??
    listExecutionPlans().find((p) => p.workspaceId === input.workspaceId)?.planId ??
    'plan-unlinked';

  const defaultActions: BuilderAction[] = [
    createBuilderAction({
      workspaceId: input.workspaceId,
      actionType: 'CREATE_FOLDER',
      requestedBy: 'controlled-builder-execution-authority',
      sourceRequirement: 'session-setup',
      targetPath: 'src/generated',
      payloadSummary: 'Create output folder',
    }),
    createBuilderAction({
      workspaceId: input.workspaceId,
      actionType: 'GENERATE_SCREEN',
      requestedBy: 'controlled-builder-execution-authority',
      sourceRequirement: 'session-setup',
      targetPath: 'src/generated/AppScreen.tsx',
      payloadSummary: 'Generate application screen scaffold',
    }),
  ];

  startBuilderExecutionSession({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionPlanId: planId,
    actions: input.actions ?? defaultActions,
  });

  return assessControlledBuilderExecution();
}

export function assessControlledBuilderExecution(): ControlledBuilderExecutionAssessment {
  const sessions = listBuilderExecutionSessions();
  const latest = sessions[0] ?? null;
  const evidence = listControlledExecutionEvidence();
  const isolation = latest
    ? verifyWorkspaceIsolation({ workspaceId: latest.workspaceId })
    : { result: 'WORKSPACE_ISOLATION_FAIL' as const, reason: 'No session', workspaceId: '', isolatedFromProduction: false };

  const hasCompletedSession =
    sessions.some((s) => s.state === 'COMPLETED' && s.evidenceCount > 0) &&
    evidence.some((e) => e.evidenceType === 'SESSION_COMPLETED');
  const hasActionEvidence = evidence.some(
    (e) => e.evidenceType === 'ACTION_COMPLETED' || e.evidenceType === 'FILE_CREATED',
  );
  const isolationPass = isolation.result === 'WORKSPACE_ISOLATION_PASS';

  const safe = isolationPass;
  const isolated = isolationPass;
  const evidenceBacked = hasCompletedSession && hasActionEvidence;
  const auditable = getBuilderExecutionAuditCount() > 0;

  const readiness: ControlledExecutionReadiness =
    safe && isolated && evidenceBacked && auditable
      ? 'CONTROLLED_EXECUTION_READY'
      : 'CONTROLLED_EXECUTION_BLOCKED';

  const executionConnected = readiness === 'CONTROLLED_EXECUTION_READY';

  const completedActions = sessions.reduce(
    (sum, s) => sum + (s.state === 'COMPLETED' ? s.actionCount : 0),
    0,
  );

  return {
    readiness,
    executionConnected,
    isolationStatus: isolation.result,
    sessionCount: getBuilderExecutionSessionCount(),
    latestSession: latest,
    completedActions,
    evidenceCount: getControlledExecutionEvidenceCount(),
    auditCount: getBuilderExecutionAuditCount(),
    summary: getControlledBuilderExecutionSummary(executionConnected),
    assessedAt: Date.now(),
  };
}

export function isControlledBuilderExecutionConnected(): boolean {
  return assessControlledBuilderExecution().executionConnected;
}

export function resolveExecutionPlanId(workspaceId: string): string | null {
  const plan = listExecutionPlans().find((p) => p.workspaceId === workspaceId);
  return plan?.planId ?? null;
}
