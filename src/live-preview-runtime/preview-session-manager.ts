/**
 * Preview session manager — in-memory session lifecycle, no external connections.
 */

import { capabilitiesForTargetType } from './types.js';
import type { PreviewSession, PreviewState, PreviewTargetType } from './types.js';

let sessionCounter = 0;
const sessions = new Map<string, PreviewSession>();
const sessionKeys = new Set<string>();

function nextSessionId(): string {
  sessionCounter += 1;
  return `pvsess-${sessionCounter.toString().padStart(4, '0')}`;
}

function sessionKey(projectId: string, workspaceId: string, targetName: string): string {
  return `${projectId}|${workspaceId}|${targetName.toLowerCase()}`;
}

export function resetPreviewSessionManagerForTests(): void {
  sessionCounter = 0;
  sessions.clear();
  sessionKeys.clear();
}

export function createPreviewSession(opts: {
  projectId: string;
  workspaceId: string;
  targetName: string;
  targetType: PreviewTargetType;
  previewUrl?: string | null;
  previewState?: PreviewState;
  warnings?: string[];
  blockedReasons?: string[];
  allowDuplicate?: boolean;
}): { session: PreviewSession | null; duplicate: boolean } {
  const key = sessionKey(opts.projectId, opts.workspaceId, opts.targetName);
  if (sessionKeys.has(key) && !opts.allowDuplicate) {
    return { session: null, duplicate: true };
  }

  const state = opts.previewState ?? 'REGISTERED';
  const session: PreviewSession = {
    previewSessionId: nextSessionId(),
    projectId: opts.projectId,
    workspaceId: opts.workspaceId,
    previewTargetType: opts.targetType,
    previewTargetName: opts.targetName,
    previewState: state,
    previewUrl: opts.previewUrl ?? null,
    previewCapabilities: capabilitiesForTargetType(opts.targetType),
    warnings: opts.warnings ?? [],
    blockedReasons: opts.blockedReasons ?? [],
    createdAt: Date.now(),
  };

  sessions.set(session.previewSessionId, session);
  sessionKeys.add(key);
  return { session, duplicate: false };
}

export function getPreviewSession(sessionId: string): PreviewSession | null {
  return sessions.get(sessionId) ?? null;
}

export function listPreviewSessions(): PreviewSession[] {
  return [...sessions.values()];
}

export function closePreviewSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  sessionKeys.delete(sessionKey(session.projectId, session.workspaceId, session.previewTargetName));
  sessions.delete(sessionId);
  return true;
}
