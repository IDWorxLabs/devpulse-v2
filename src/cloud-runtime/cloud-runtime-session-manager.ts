/**
 * Cloud Runtime Foundation — session manager (authority only).
 */

import {
  nextSessionId,
  storeSession,
  getStoredSession,
  listStoredSessions,
  getStoredRuntime,
  storeRuntime,
} from './cloud-runtime-store.js';
import { updateRuntimeSessionOwnership } from './cloud-runtime-ownership.js';
import { recordHistoryEntry } from './cloud-runtime-history.js';
import type { CloudRuntimeSession, CloudRuntimeVisibility } from './cloud-runtime-types.js';
import { CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE } from './cloud-runtime-types.js';

export function createRuntimeSession(input: {
  runtimeId: string;
  projectId: string;
  workspaceId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: CloudRuntimeVisibility;
}): CloudRuntimeSession | null {
  const runtime = getStoredRuntime(input.runtimeId);
  if (!runtime) return null;

  const now = Date.now();
  const session: CloudRuntimeSession = {
    sessionId: nextSessionId(),
    runtimeId: input.runtimeId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    sessionOwner: input.sessionOwner ?? CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
    sessionState: runtime.runtimeState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'cloud_runtime_foundation' },
    sessionVisibility: input.visibility ?? runtime.runtimeVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeSession(session);

  const updatedOwnership = updateRuntimeSessionOwnership(runtime.runtimeOwner, session.sessionId);
  storeRuntime({
    ...runtime,
    runtimeOwner: updatedOwnership,
    updatedAt: now,
  });

  recordHistoryEntry({
    runtimeId: input.runtimeId,
    category: 'SESSION',
    summary: `Session ${session.sessionId} created for runtime ${input.runtimeId}`,
    consumer: input.sessionOwner ?? null,
    scopeUsed: input.workspaceId,
  });

  return session;
}

export function getRuntimeSession(sessionId: string): CloudRuntimeSession | null {
  return getStoredSession(sessionId);
}

export function listRuntimeSessions(runtimeId?: string): CloudRuntimeSession[] {
  const all = listStoredSessions();
  if (!runtimeId) return all;
  return all.filter((s) => s.runtimeId === runtimeId);
}

export function trackSessionOwnership(sessionId: string, owner: string): CloudRuntimeSession | null {
  const session = getStoredSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeSession(updated);
  recordHistoryEntry({
    runtimeId: session.runtimeId,
    category: 'SESSION',
    summary: `Session ${sessionId} ownership tracked: ${owner}`,
    consumer: owner,
    scopeUsed: 'SESSION_OWNERSHIP',
  });
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): CloudRuntimeSession | null {
  const session = getStoredSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeSession(updated);
  return updated;
}

export function resetCloudRuntimeSessionManagerForTests(): void {
  /* cleared via store reset */
}
