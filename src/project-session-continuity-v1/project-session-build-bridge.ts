/**
 * Project Session Continuity V1 — build flow bridge (post-gate project + session bootstrap).
 */

import {
  getRegistryProject,
  setRegistryActiveProject,
} from '../project-registry-v1/index.js';
import { setActiveProjectId } from '../one-prompt-live-preview/workspace-tab-registry.js';
import {
  applyProjectIdentityForBuild,
  type ProjectIdentityContract,
} from '../project-name-conflict-resolution-v1/index.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { ProjectSessionContext } from './project-session-continuity-types.js';
import {
  deriveProjectNameFromPrompt,
  ensureProjectSessionForProject,
  persistProjectSessionChat,
  recordBuildOnProjectSession,
  resolveActiveProjectSessionContext,
} from './project-session-authority.js';
import { createProjectSessionRecord } from './project-session-store.js';

export interface BootstrapProjectSessionResult {
  readOnly: true;
  projectId: string;
  sessionId: string;
  projectName: string;
  createdProject: boolean;
  createdSession: boolean;
  projectIdentity?: ProjectIdentityContract;
}

export function bootstrapProjectAndSessionForBuild(input: {
  rawPrompt: string;
  projectId?: string | null;
  projectName?: string | null;
  confirmFreshCopy?: boolean;
  rejectDuplicates?: boolean;
  rootDir?: string;
  repoRootDir?: string;
}): BootstrapProjectSessionResult {
  const rootDir = input.rootDir;
  let projectId = input.projectId?.trim() || null;
  let projectName = input.projectName?.trim() || null;
  let createdProject = false;
  let createdSession = false;
  let projectIdentity: ProjectIdentityContract | undefined;

  if (!projectId) {
    projectIdentity = applyProjectIdentityForBuild({
      requestedName: projectName ?? deriveProjectNameFromPrompt(input.rawPrompt, projectName),
      rawPrompt: input.rawPrompt,
      summary: input.rawPrompt.slice(0, 160),
      rootDir,
      repoRootDir: input.repoRootDir,
      confirmFreshCopy: input.confirmFreshCopy === true,
      forceFreshRebuild: input.confirmFreshCopy === true,
      rejectDuplicates: input.rejectDuplicates === true,
    });
    projectId = projectIdentity.projectId;
    projectName = projectIdentity.resolvedProjectName;
    createdProject = projectIdentity.createdProject;
  } else {
    const registryRecord = getRegistryProject(projectId, rootDir);
    projectName = projectName ?? registryRecord?.name ?? projectId;
    setRegistryActiveProject({ projectId, rootDir });
  }

  setActiveProjectId(projectId);

  let sessionId: string;
  if (input.confirmFreshCopy) {
    const session = createProjectSessionRecord({
      projectId,
      projectName: projectName ?? projectId,
      currentPrompt: input.rawPrompt,
      rootDir,
    });
    sessionId = session.sessionId;
    createdSession = true;
  } else {
    const session = ensureProjectSessionForProject({
      projectId,
      projectName: projectName ?? projectId,
      currentPrompt: input.rawPrompt,
      rootDir,
    });
    sessionId = session.sessionId;
    createdSession = createdProject;
  }

  return {
    readOnly: true,
    projectId,
    sessionId,
    projectName: projectName ?? projectId,
    createdProject,
    createdSession,
    projectIdentity,
  };
}

export function finalizeProjectSessionAfterBuild(input: {
  projectId: string;
  sessionId: string;
  buildResult: OnePromptLivePreviewBuildResult;
  userMessage?: string;
  brainResponse?: string;
  rootDir?: string;
}): ProjectSessionContext | null {
  recordBuildOnProjectSession({
    projectId: input.projectId,
    sessionId: input.sessionId,
    buildResult: input.buildResult,
    executionTraceLink: `#execution-trace/${input.buildResult.buildId}`,
    rootDir: input.rootDir,
  });

  if (input.userMessage?.trim()) {
    persistProjectSessionChat({
      projectId: input.projectId,
      sessionId: input.sessionId,
      role: 'user',
      text: input.userMessage.trim(),
      rootDir: input.rootDir,
    });
  }
  if (input.brainResponse?.trim()) {
    persistProjectSessionChat({
      projectId: input.projectId,
      sessionId: input.sessionId,
      role: 'brain',
      text: input.brainResponse.trim(),
      rootDir: input.rootDir,
    });
  }

  return resolveActiveProjectSessionContext(input.rootDir);
}

export function enrichBrainPayloadWithProjectSession(
  payload: Record<string, unknown>,
  rootDir?: string,
): Record<string, unknown> {
  const context = resolveActiveProjectSessionContext(rootDir);
  return {
    ...payload,
    projectSession: context,
    activeSessionId: context?.sessionId ?? null,
    activeProjectId: context?.projectId ?? payload.activeProjectId ?? null,
  };
}

export function enrichBuildPayloadWithProjectSession(
  payload: Record<string, unknown>,
  rootDir?: string,
): Record<string, unknown> {
  return enrichBrainPayloadWithProjectSession(payload, rootDir);
}

export { persistProjectSessionChat };
