/**
 * Persistent Build Runtime Foundation — session manager.
 */

import {
  nextBuildSessionId,
  storePersistentBuildSession,
  getStoredPersistentBuildSession,
  listStoredPersistentBuildSessions,
  getStoredPersistentBuild,
  storePersistentBuild,
} from './persistent-build-store.js';
import { updateBuildSessionOwnership } from './persistent-build-ownership.js';
import { recordPersistentBuildHistoryEntry } from './persistent-build-history.js';
import type { PersistentBuildSession, PersistentBuildVisibility } from './persistent-build-types.js';
import { PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE } from './persistent-build-types.js';

export function createPersistentBuildSession(input: {
  buildId: string;
  projectId: string;
  workspaceId: string;
  runtimeId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: PersistentBuildVisibility;
}): PersistentBuildSession | null {
  const build = getStoredPersistentBuild(input.buildId);
  if (!build) return null;

  const now = Date.now();
  const session: PersistentBuildSession = {
    sessionId: nextBuildSessionId(),
    buildId: input.buildId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    sessionOwner: input.sessionOwner ?? PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    sessionState: build.buildState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'persistent_build_runtime_foundation' },
    sessionVisibility: input.visibility ?? build.buildVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storePersistentBuildSession(session);

  storePersistentBuild({
    ...build,
    buildOwner: updateBuildSessionOwnership(build.buildOwner, session.sessionId),
    updatedAt: now,
  });

  recordPersistentBuildHistoryEntry({
    buildId: input.buildId,
    category: 'SESSION',
    summary: `Session ${session.sessionId} created for build ${input.buildId}`,
    consumer: input.sessionOwner ?? null,
    scopeUsed: input.workspaceId,
  });

  return session;
}

export function getPersistentBuildSession(sessionId: string): PersistentBuildSession | null {
  return getStoredPersistentBuildSession(sessionId);
}

export function listPersistentBuildSessions(buildId?: string): PersistentBuildSession[] {
  const all = listStoredPersistentBuildSessions();
  if (!buildId) return all;
  return all.filter((s) => s.buildId === buildId);
}

export function trackSessionOwnership(sessionId: string, owner: string): PersistentBuildSession | null {
  const session = getStoredPersistentBuildSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storePersistentBuildSession(updated);
  recordPersistentBuildHistoryEntry({
    buildId: session.buildId,
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
): PersistentBuildSession | null {
  const session = getStoredPersistentBuildSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storePersistentBuildSession(updated);
  return updated;
}

export function resetPersistentBuildSessionManagerForTests(): void {
  /* cleared via store reset */
}
