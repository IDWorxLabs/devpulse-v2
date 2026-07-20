/**
 * Multi-Project Workspace Tabs — in-memory session registry.
 */

import type { OnePromptBuildStatus, OnePromptLivePreviewBuildResult } from './one-prompt-live-preview-types.js';

export interface MultiProjectWorkspaceSession {
  readOnly: true;
  projectId: string;
  projectName: string;
  workspacePath: string | null;
  chatThreadId: string;
  previewUrl: string | null;
  buildProfile: string | null;
  buildStatus: OnePromptBuildStatus;
  lastUpdated: string;
  active: boolean;
  devServerPort: number | null;
  buildId: string | null;
}

const sessions = new Map<string, MultiProjectWorkspaceSession>();
const buildResultsByProject = new Map<string, OnePromptLivePreviewBuildResult>();
let activeProjectId: string | null = null;
let projectCounter = 0;

export function resetWorkspaceTabRegistryForTests(): void {
  sessions.clear();
  buildResultsByProject.clear();
  activeProjectId = null;
  projectCounter = 0;
}

export function generateProjectId(projectName?: string): string {
  projectCounter += 1;
  const slug =
    (projectName ?? 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'project';
  return `${slug}-${projectCounter}`;
}

function createSession(projectId: string, projectName: string): MultiProjectWorkspaceSession {
  const session: MultiProjectWorkspaceSession = {
    readOnly: true,
    projectId,
    projectName,
    workspacePath: null,
    chatThreadId: `chat-${projectId}`,
    previewUrl: null,
    buildProfile: null,
    buildStatus: 'IDLE',
    lastUpdated: new Date().toISOString(),
    active: false,
    devServerPort: null,
    buildId: null,
  };
  sessions.set(projectId, session);
  return session;
}

export function resolveProjectContext(input: {
  projectId?: string | null;
  projectName?: string | null;
  createIfMissing?: boolean;
  /**
   * When true, this request has already been classified as a brand-new build (see
   * src/project-context-isolation-v4/), so NO previous project identifier of any kind may be
   * reused — not the implicit process-wide activeProjectId, not a caller-supplied projectId
   * (e.g. a frontend resending a previous build's persisted id), not any other cached/persisted
   * identifier. A fresh project id is always minted in that case. Defaults to false to preserve
   * existing behavior (explicit/implicit reuse allowed) for continuation-style callers.
   */
  blockActiveProjectFallback?: boolean;
  /**
   * Trusted server-side bootstrap evidence that `projectId` was minted for this exact request.
   * This is intentionally separate from blockActiveProjectFallback: NEW_BUILD must reject a
   * browser-supplied stale id, while still retaining the fresh immutable id created immediately
   * upstream for the same request.
   */
  freshlyCreatedProjectId?: string | null;
}): { projectId: string; projectName: string; session: MultiProjectWorkspaceSession; created: boolean } {
  const requestedId = input.projectId?.trim() || null;
  const freshlyCreatedProjectId = input.freshlyCreatedProjectId?.trim() || null;

  if (
    input.blockActiveProjectFallback &&
    requestedId &&
    freshlyCreatedProjectId === requestedId
  ) {
    const session = sessions.get(requestedId) ??
      createSession(requestedId, input.projectName?.trim() || requestedId);
    if (input.projectName?.trim()) {
      session.projectName = input.projectName.trim();
      session.lastUpdated = new Date().toISOString();
    }
    setActiveProjectId(requestedId);
    return { projectId: requestedId, projectName: session.projectName, session, created: true };
  }

  if (!input.blockActiveProjectFallback) {
    if (requestedId && sessions.has(requestedId)) {
      const session = sessions.get(requestedId)!;
      if (input.projectName?.trim()) {
        session.projectName = input.projectName.trim();
        session.lastUpdated = new Date().toISOString();
      }
      return { projectId: requestedId, projectName: session.projectName, session, created: false };
    }

    if (requestedId && input.createIfMissing !== false) {
      const session = createSession(requestedId, input.projectName?.trim() || requestedId);
      setActiveProjectId(requestedId);
      return { projectId: requestedId, projectName: session.projectName, session, created: true };
    }

    if (activeProjectId && sessions.has(activeProjectId)) {
      const session = sessions.get(activeProjectId)!;
      return { projectId: activeProjectId, projectName: session.projectName, session, created: false };
    }
  }

  // blockActiveProjectFallback === true: every previous-identifier path above is skipped on
  // purpose, regardless of what projectId/activeProjectId/session happens to already exist — a
  // brand-new build always gets a brand-new project id.
  const newId = generateProjectId(input.projectName ?? undefined);
  const session = createSession(newId, input.projectName?.trim() || 'New Project');
  setActiveProjectId(newId);
  return { projectId: newId, projectName: session.projectName, session, created: true };
}

export function setActiveProjectId(projectId: string): MultiProjectWorkspaceSession | null {
  if (!sessions.has(projectId)) return null;
  for (const session of sessions.values()) {
    session.active = session.projectId === projectId;
  }
  activeProjectId = projectId;
  return sessions.get(projectId)!;
}

export function registerProjectBuildResult(input: {
  projectId: string;
  projectName?: string;
  build: OnePromptLivePreviewBuildResult;
  devServerPort?: number | null;
}): MultiProjectWorkspaceSession {
  let session = sessions.get(input.projectId);
  if (!session) {
    session = createSession(input.projectId, input.projectName ?? input.projectId);
  }
  if (input.projectName?.trim()) {
    session.projectName = input.projectName.trim();
  } else if (input.build.approvedProductIdentity?.displayName?.trim()) {
    session.projectName = input.build.approvedProductIdentity.displayName.trim();
  }
  session.workspacePath = input.build.workspacePath;
  session.previewUrl = input.build.previewUrl;
  session.buildProfile = input.build.generatedProfile;
  session.buildStatus = input.build.status;
  session.lastUpdated = input.build.updatedAt;
  session.buildId = input.build.buildId;
  session.devServerPort = input.devServerPort ?? null;
  buildResultsByProject.set(input.projectId, input.build);
  setActiveProjectId(input.projectId);
  return session;
}

export function getActiveProjectId(): string | null {
  return activeProjectId;
}

export function getActiveProjectSession(): MultiProjectWorkspaceSession | null {
  return activeProjectId ? (sessions.get(activeProjectId) ?? null) : null;
}

export function getProjectSession(projectId: string): MultiProjectWorkspaceSession | null {
  return sessions.get(projectId) ?? null;
}

export function getBuildResultForProject(projectId: string): OnePromptLivePreviewBuildResult | null {
  return buildResultsByProject.get(projectId) ?? null;
}

/**
 * Fresh Build Artifact Isolation V4 — invalidates the previously stored build result (the
 * ACTIVE_BUILD_RESULT purge category) for a project so it cannot be read as "current evidence"
 * while a fresh build for that same project id is in flight. Called for every build (NEW_BUILD
 * and CONTINUE_EXISTING_PROJECT alike) before planning/materialization begins; the session/tab
 * entry itself (workspace path, chat thread, etc.) is left untouched — only the stale build
 * result snapshot is cleared. `registerProjectBuildResult` repopulates it once the fresh build
 * completes.
 */
export function invalidatePreviousBuildEvidenceForProject(projectId: string): boolean {
  return buildResultsByProject.delete(projectId);
}

export function listMultiProjectWorkspaces(): MultiProjectWorkspaceSession[] {
  return [...sessions.values()].sort((a, b) => a.projectName.localeCompare(b.projectName));
}

export function pruneWorkspaceSessionsNotInRegistry(allowedProjectIds: readonly string[]): string[] {
  const allowed = new Set(allowedProjectIds);
  const removed: string[] = [];
  for (const projectId of [...sessions.keys()]) {
    if (!allowed.has(projectId)) {
      removeWorkspaceSession(projectId);
      removed.push(projectId);
    }
  }
  return removed;
}

export function listMultiProjectWorkspacesForRegistry(
  allowedProjectIds: readonly string[],
): MultiProjectWorkspaceSession[] {
  const allowed = new Set(allowedProjectIds);
  return listMultiProjectWorkspaces().filter((session) => allowed.has(session.projectId));
}

export function listMultiProjectWorkspacesForProject(projectId: string): MultiProjectWorkspaceSession[] {
  const session = sessions.get(projectId);
  return session ? [{ ...session }] : [];
}

export function listProjectBuildResults(): Array<{ projectId: string; build: OnePromptLivePreviewBuildResult }> {
  return [...buildResultsByProject.entries()].map(([projectId, build]) => ({ projectId, build }));
}

export function removeWorkspaceSession(projectId: string): boolean {
  const hadSession = sessions.has(projectId);
  sessions.delete(projectId);
  buildResultsByProject.delete(projectId);
  if (activeProjectId === projectId) {
    activeProjectId = null;
  }
  return hadSession;
}

export function clearActiveProjectIfMatches(projectId: string): boolean {
  if (activeProjectId !== projectId) return false;
  activeProjectId = null;
  const session = sessions.get(projectId);
  if (session) session.active = false;
  return true;
}
