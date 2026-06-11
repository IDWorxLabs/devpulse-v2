/**
 * Builder execution controller — session lifecycle and evidence tracking (Phase 24C).
 */

import type { BuilderAction } from '../autonomous-builder-execution-foundation/index.js';
import { markActionResult } from '../autonomous-builder-execution-foundation/index.js';
import { executeApprovedBuilderAction } from './builder-action-executor.js';
import { recordBuilderExecutionAudit } from './builder-execution-audit-trail.js';
import {
  collectControlledExecutionEvidence,
  getControlledExecutionEvidenceCount,
} from './builder-execution-evidence-collector.js';
import {
  createBuilderExecutionSession,
  getBuilderExecutionSession,
  updateBuilderExecutionSession,
  type BuilderExecutionSession,
} from './builder-execution-session.js';
import { verifyWorkspaceIsolation } from './workspace-isolation-authority.js';

export interface StartExecutionSessionInput {
  workspaceId: string;
  projectId: string;
  executionPlanId: string;
  actions: BuilderAction[];
}

export interface ExecutionSessionRunResult {
  session: BuilderExecutionSession;
  isolationResult: ReturnType<typeof verifyWorkspaceIsolation>;
  completedActions: number;
  failedActions: number;
  blockedActions: number;
  evidenceCount: number;
}

export function createControlledExecutionSession(input: {
  workspaceId: string;
  projectId: string;
  executionPlanId: string;
}): { session: BuilderExecutionSession; isolation: ReturnType<typeof verifyWorkspaceIsolation> } {
  const isolation = verifyWorkspaceIsolation({ workspaceId: input.workspaceId });
  const session = createBuilderExecutionSession({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionPlanId: input.executionPlanId,
    initialState: isolation.result === 'WORKSPACE_ISOLATION_PASS' ? 'READY' : 'FAILED',
  });

  collectControlledExecutionEvidence({
    sessionId: session.sessionId,
    workspaceId: input.workspaceId,
    evidenceType: 'SESSION_CREATED',
    description: `Controlled execution session ${session.sessionId} created`,
    source: 'builder-execution-controller',
  });

  recordBuilderExecutionAudit({
    sessionId: session.sessionId,
    workspaceId: input.workspaceId,
    eventType: 'SESSION_CREATED',
    detail: `Session created — isolation ${isolation.result}`,
  });

  recordBuilderExecutionAudit({
    sessionId: session.sessionId,
    workspaceId: input.workspaceId,
    eventType: 'ISOLATION_CHECK',
    detail: isolation.reason,
  });

  if (isolation.result === 'WORKSPACE_ISOLATION_FAIL') {
    updateBuilderExecutionSession(session.sessionId, {
      state: 'FAILED',
      completedAt: Date.now(),
      failureCount: 1,
      evidenceCount: getControlledExecutionEvidenceCount(session.sessionId),
    });
    collectControlledExecutionEvidence({
      sessionId: session.sessionId,
      workspaceId: input.workspaceId,
      evidenceType: 'SESSION_FAILED',
      description: isolation.reason,
      source: 'builder-execution-controller',
    });
  }

  return { session: getBuilderExecutionSession(session.sessionId) ?? session, isolation };
}

export function startBuilderExecutionSession(input: StartExecutionSessionInput): ExecutionSessionRunResult {
  const { session: created, isolation } = createControlledExecutionSession({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionPlanId: input.executionPlanId,
  });
  const current = getBuilderExecutionSession(created.sessionId) ?? created;

  if (isolation.result === 'WORKSPACE_ISOLATION_FAIL') {
    return {
      session: current,
      isolationResult: isolation,
      completedActions: 0,
      failedActions: 0,
      blockedActions: 0,
      evidenceCount: getControlledExecutionEvidenceCount(current.sessionId),
    };
  }

  updateBuilderExecutionSession(current.sessionId, {
    state: 'RUNNING',
    startedAt: Date.now(),
  });
  recordBuilderExecutionAudit({
    sessionId: current.sessionId,
    workspaceId: input.workspaceId,
    eventType: 'SESSION_STARTED',
    detail: `Running ${input.actions.length} approved action(s)`,
  });

  let completedActions = 0;
  let failedActions = 0;
  let blockedActions = 0;

  for (const action of input.actions.slice(0, 12)) {
    const outcome = executeApprovedBuilderAction({
      sessionId: current.sessionId,
      workspaceId: input.workspaceId,
      action,
    });

    if (outcome.blocked) {
      blockedActions += 1;
      recordBuilderExecutionAudit({
        sessionId: current.sessionId,
        workspaceId: input.workspaceId,
        eventType: 'ACTION_BLOCKED',
        detail: outcome.summary,
      });
      continue;
    }

    if (outcome.success) {
      completedActions += 1;
      markActionResult(action, {
        success: true,
        summary: outcome.summary,
        evidenceIds: outcome.evidenceIds,
        completedAt: Date.now(),
      });
    } else {
      failedActions += 1;
    }

    recordBuilderExecutionAudit({
      sessionId: current.sessionId,
      workspaceId: input.workspaceId,
      eventType: 'ACTION_EXECUTED',
      detail: outcome.summary,
    });
    recordBuilderExecutionAudit({
      sessionId: current.sessionId,
      workspaceId: input.workspaceId,
      eventType: 'EVIDENCE_GENERATED',
      detail: `${outcome.evidenceIds.length} evidence record(s)`,
    });
  }

  const evidenceCount = getControlledExecutionEvidenceCount(current.sessionId);
  const finalState = failedActions > 0 && completedActions === 0 ? 'FAILED' : 'COMPLETED';

  if (finalState === 'COMPLETED') {
    collectControlledExecutionEvidence({
      sessionId: current.sessionId,
      workspaceId: input.workspaceId,
      evidenceType: 'SESSION_COMPLETED',
      description: `Session completed — ${completedActions} action(s), ${evidenceCount} evidence record(s)`,
      source: 'builder-execution-controller',
    });
    recordBuilderExecutionAudit({
      sessionId: current.sessionId,
      workspaceId: input.workspaceId,
      eventType: 'SESSION_COMPLETED',
      detail: `${completedActions} actions completed`,
    });
  } else {
    collectControlledExecutionEvidence({
      sessionId: current.sessionId,
      workspaceId: input.workspaceId,
      evidenceType: 'SESSION_FAILED',
      description: 'Session failed — no actions completed successfully',
      source: 'builder-execution-controller',
    });
    recordBuilderExecutionAudit({
      sessionId: current.sessionId,
      workspaceId: input.workspaceId,
      eventType: 'SESSION_FAILED',
      detail: `${failedActions} action failure(s)`,
    });
  }

  const session = updateBuilderExecutionSession(current.sessionId, {
    state: finalState,
    completedAt: Date.now(),
    actionCount: completedActions + failedActions + blockedActions,
    evidenceCount,
    failureCount: failedActions,
  });

  return {
    session: session ?? current,
    isolationResult: isolation,
    completedActions,
    failedActions,
    blockedActions,
    evidenceCount,
  };
}

export function pauseBuilderExecutionSession(sessionId: string): BuilderExecutionSession | null {
  const session = getBuilderExecutionSession(sessionId);
  if (!session || session.state !== 'RUNNING') return session;
  const updated = updateBuilderExecutionSession(sessionId, { state: 'PAUSED' });
  if (updated) {
    recordBuilderExecutionAudit({
      sessionId,
      workspaceId: session.workspaceId,
      eventType: 'SESSION_PAUSED',
      detail: 'Session paused by controller',
    });
  }
  return updated;
}

export function resumeBuilderExecutionSession(sessionId: string): BuilderExecutionSession | null {
  const session = getBuilderExecutionSession(sessionId);
  if (!session || session.state !== 'PAUSED') return session;
  const updated = updateBuilderExecutionSession(sessionId, { state: 'RUNNING' });
  if (updated) {
    recordBuilderExecutionAudit({
      sessionId,
      workspaceId: session.workspaceId,
      eventType: 'SESSION_RESUMED',
      detail: 'Session resumed by controller',
    });
  }
  return updated;
}

export function cancelBuilderExecutionSession(sessionId: string): BuilderExecutionSession | null {
  const session = getBuilderExecutionSession(sessionId);
  if (!session || session.state === 'COMPLETED' || session.state === 'CANCELLED') return session;
  const updated = updateBuilderExecutionSession(sessionId, {
    state: 'CANCELLED',
    completedAt: Date.now(),
  });
  if (updated) {
    recordBuilderExecutionAudit({
      sessionId,
      workspaceId: session.workspaceId,
      eventType: 'SESSION_CANCELLED',
      detail: 'Session cancelled by controller',
    });
  }
  return updated;
}

export function collectSessionEvidence(sessionId: string): ReturnType<typeof getControlledExecutionEvidenceCount> {
  return getControlledExecutionEvidenceCount(sessionId);
}
