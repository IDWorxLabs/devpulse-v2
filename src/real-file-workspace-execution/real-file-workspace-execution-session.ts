/**
 * Real file workspace execution session model (Phase 24D).
 */

import { MAX_REAL_FILE_SESSIONS } from './real-file-workspace-execution-bounds.js';

export type RealFileWorkspaceExecutionSessionState =
  | 'CREATED'
  | 'READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CANCELLED';

export interface RealFileWorkspaceExecutionSession {
  sessionId: string;
  workspaceId: string;
  projectId: string;
  workspaceRoot: string;
  state: RealFileWorkspaceExecutionSessionState;
  operationsAttempted: number;
  operationsCompleted: number;
  operationsBlocked: number;
  evidenceCount: number;
  finalStatus: string;
  startedAt: number | null;
  completedAt: number | null;
  createdAt: number;
}

const sessions = new Map<string, RealFileWorkspaceExecutionSession>();
let sessionCounter = 0;

export function resetRealFileWorkspaceExecutionSessionsForTests(): void {
  sessions.clear();
  sessionCounter = 0;
}

function nextSessionId(): string {
  sessionCounter += 1;
  return `real-file-session-${sessionCounter}`;
}

export function createRealFileWorkspaceExecutionSession(input: {
  workspaceId: string;
  projectId: string;
  workspaceRoot: string;
  initialState?: RealFileWorkspaceExecutionSessionState;
}): RealFileWorkspaceExecutionSession {
  const session: RealFileWorkspaceExecutionSession = {
    sessionId: nextSessionId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    workspaceRoot: input.workspaceRoot,
    state: input.initialState ?? 'CREATED',
    operationsAttempted: 0,
    operationsCompleted: 0,
    operationsBlocked: 0,
    evidenceCount: 0,
    finalStatus: 'pending',
    startedAt: null,
    completedAt: null,
    createdAt: Date.now(),
  };

  sessions.set(session.sessionId, session);
  if (sessions.size > MAX_REAL_FILE_SESSIONS) {
    const oldest = [...sessions.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) sessions.delete(oldest.sessionId);
  }

  return session;
}

export function getRealFileWorkspaceExecutionSession(
  sessionId: string,
): RealFileWorkspaceExecutionSession | null {
  return sessions.get(sessionId) ?? null;
}

export function updateRealFileWorkspaceExecutionSession(
  sessionId: string,
  patch: Partial<
    Pick<
      RealFileWorkspaceExecutionSession,
      | 'state'
      | 'operationsAttempted'
      | 'operationsCompleted'
      | 'operationsBlocked'
      | 'evidenceCount'
      | 'finalStatus'
      | 'startedAt'
      | 'completedAt'
    >
  >,
): RealFileWorkspaceExecutionSession | null {
  const current = sessions.get(sessionId);
  if (!current) return null;
  const updated = { ...current, ...patch };
  sessions.set(sessionId, updated);
  return updated;
}

export function listRealFileWorkspaceExecutionSessions(): RealFileWorkspaceExecutionSession[] {
  return [...sessions.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getRealFileWorkspaceExecutionSessionCount(): number {
  return sessions.size;
}
