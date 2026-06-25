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
}): { projectId: string; projectName: string; session: MultiProjectWorkspaceSession; created: boolean } {
  const requestedId = input.projectId?.trim() || null;
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

export function listMultiProjectWorkspaces(): MultiProjectWorkspaceSession[] {
  return [...sessions.values()].sort((a, b) => a.projectName.localeCompare(b.projectName));
}

export function listMultiProjectWorkspacesForProject(projectId: string): MultiProjectWorkspaceSession[] {
  const session = sessions.get(projectId);
  return session ? [{ ...session }] : [];
}

export function listProjectBuildResults(): Array<{ projectId: string; build: OnePromptLivePreviewBuildResult }> {
  return [...buildResultsByProject.entries()].map(([projectId, build]) => ({ projectId, build }));
}
