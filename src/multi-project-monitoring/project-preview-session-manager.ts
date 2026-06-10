/**
 * Multi Project Monitoring — multiple simultaneous preview sessions (tabs).
 */

import type { ProjectPreviewSession } from './monitoring-types.js';
import { getCachedPreviewSessions, setCachedPreviewSessions } from './monitoring-cache.js';

const sessions = new Map<string, ProjectPreviewSession>();
const sessionsByProject = new Map<string, ProjectPreviewSession[]>();

let sessionCounter = 0;

export function createPreviewSession(
  projectId: string,
  workspaceId: string,
  tabLabel?: string,
): ProjectPreviewSession {
  sessionCounter += 1;
  const session: ProjectPreviewSession = {
    projectId,
    previewSessionId: `preview-session-${projectId}-${sessionCounter}${tabLabel ? `-${tabLabel}` : ''}`,
    workspaceId,
    active: true,
  };

  sessions.set(session.previewSessionId, session);

  const projectSessions = sessionsByProject.get(projectId) ?? [];
  projectSessions.push(session);
  sessionsByProject.set(projectId, projectSessions);
  setCachedPreviewSessions(projectId, projectSessions);

  return session;
}

export function closePreviewSession(previewSessionId: string): boolean {
  const session = sessions.get(previewSessionId);
  if (!session) return false;

  const updated: ProjectPreviewSession = { ...session, active: false };
  sessions.set(previewSessionId, updated);

  const projectSessions = sessionsByProject.get(session.projectId) ?? [];
  const idx = projectSessions.findIndex((s) => s.previewSessionId === previewSessionId);
  if (idx >= 0) {
    projectSessions[idx] = updated;
    sessionsByProject.set(session.projectId, projectSessions);
    setCachedPreviewSessions(session.projectId, projectSessions);
  }

  return true;
}

export function listPreviewSessions(projectId?: string): ProjectPreviewSession[] {
  if (projectId) {
    const cached = getCachedPreviewSessions(projectId);
    if (cached) return cached;
    const result = sessionsByProject.get(projectId) ?? [];
    setCachedPreviewSessions(projectId, result);
    return result;
  }
  return [...sessions.values()];
}

export function listActivePreviewSessions(): ProjectPreviewSession[] {
  return [...sessions.values()].filter((s) => s.active);
}

export function getPreviewSessionCount(): number {
  return sessions.size;
}

export function resetProjectPreviewSessionManagerForTests(): void {
  sessions.clear();
  sessionsByProject.clear();
  sessionCounter = 0;
}
