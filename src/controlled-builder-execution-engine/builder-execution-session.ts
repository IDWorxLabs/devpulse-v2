/**
 * Builder execution session model — controlled execution unit (Phase 24C).
 */

import { MAX_EXECUTION_SESSIONS } from './controlled-builder-execution-engine-bounds.js';

export type BuilderExecutionSessionState =
  | 'CREATED'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface BuilderExecutionSession {
  sessionId: string;
  workspaceId: string;
  projectId: string;
  executionPlanId: string;
  state: BuilderExecutionSessionState;
  startedAt: number | null;
  completedAt: number | null;
  actionCount: number;
  evidenceCount: number;
  failureCount: number;
  createdAt: number;
}

const sessions = new Map<string, BuilderExecutionSession>();
let sessionCounter = 0;

export function resetBuilderExecutionSessionsForTests(): void {
  sessions.clear();
  sessionCounter = 0;
}

function nextSessionId(): string {
  sessionCounter += 1;
  return `builder-exec-session-${sessionCounter}`;
}

export function createBuilderExecutionSession(input: {
  workspaceId: string;
  projectId: string;
  executionPlanId: string;
  initialState?: BuilderExecutionSessionState;
}): BuilderExecutionSession {
  const session: BuilderExecutionSession = {
    sessionId: nextSessionId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionPlanId: input.executionPlanId,
    state: input.initialState ?? 'CREATED',
    startedAt: null,
    completedAt: null,
    actionCount: 0,
    evidenceCount: 0,
    failureCount: 0,
    createdAt: Date.now(),
  };

  sessions.set(session.sessionId, session);
  if (sessions.size > MAX_EXECUTION_SESSIONS) {
    const oldest = [...sessions.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) sessions.delete(oldest.sessionId);
  }

  return session;
}

export function getBuilderExecutionSession(sessionId: string): BuilderExecutionSession | null {
  return sessions.get(sessionId) ?? null;
}

export function updateBuilderExecutionSession(
  sessionId: string,
  patch: Partial<
    Pick<
      BuilderExecutionSession,
      | 'state'
      | 'startedAt'
      | 'completedAt'
      | 'actionCount'
      | 'evidenceCount'
      | 'failureCount'
    >
  >,
): BuilderExecutionSession | null {
  const current = sessions.get(sessionId);
  if (!current) return null;
  const updated = { ...current, ...patch };
  sessions.set(sessionId, updated);
  return updated;
}

export function listBuilderExecutionSessions(): BuilderExecutionSession[] {
  return [...sessions.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getBuilderExecutionSessionCount(): number {
  return sessions.size;
}
