/**
 * Project Session Continuity V1 — ensure durable project + session for builds and navigation.
 */

import {
  getRegistryProject,
  isUserFacingRegistryProject,
  setRegistryActiveProject,
} from '../project-registry-v1/index.js';
import { applyProjectIdentityForBuild } from '../project-name-conflict-resolution-v1/index.js';
import { extractPromptDomainSignals } from '../project-context-alignment-v1/prompt-domain-analyzer.js';
import {
  composeDuplicateResumeResponse,
  routeDuplicateProjectResume,
} from '../project-resume-state/index.js';
import { setActiveProjectId } from '../one-prompt-live-preview/workspace-tab-registry.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type {
  EnsureBuildProjectSessionInput,
  EnsureBuildProjectSessionResult,
  ProjectSessionContext,
  ProjectSessionRecord,
} from './project-session-continuity-types.js';
import {
  appendProjectSessionChatMessage,
  createProjectSessionRecord,
  findLatestActiveSessionForProject,
  readActiveSessionPointer,
  readProjectSessionRecord,
  updateProjectSessionRecord,
  writeActiveSessionPointer,
} from './project-session-store.js';
import { resolveLivePreviewSessionBinding } from './project-session-live-preview-binding.js';

const GENERIC_PROJECT_NAME = 'New Project';

function extractExplicitPromptProjectName(rawPrompt: string): string | null {
  const match = rawPrompt.match(
    /\b(?:called|named)\s+["“]?([A-Za-z][A-Za-z0-9]*(?:[ \t_-]+[A-Za-z0-9]+){0,7}?)["”]?(?=[ \t]+(?:for|with|that|which)\b|[.!?\r\n]|$)/i,
  );
  return match?.[1]?.trim() || null;
}

function deriveProjectNameFromPrompt(rawPrompt: string, explicitName?: string | null): string {
  const trimmedExplicit = explicitName?.trim();
  if (trimmedExplicit && trimmedExplicit !== GENERIC_PROJECT_NAME) {
    return trimmedExplicit;
  }
  const promptDeclaredName = extractExplicitPromptProjectName(rawPrompt);
  if (promptDeclaredName) {
    return promptDeclaredName;
  }
  const signals = extractPromptDomainSignals(rawPrompt);
  if (signals.proposedProjectName?.trim()) {
    return signals.proposedProjectName.trim();
  }
  if (signals.domainLabel?.trim()) {
    return signals.domainLabel
      .split(/[—–-]/)[0]!
      .trim()
      .replace(/\bapp\b/i, '')
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }
  return GENERIC_PROJECT_NAME;
}

function toSessionContext(record: ProjectSessionRecord): ProjectSessionContext {
  const binding = resolveLivePreviewSessionBinding({ session: record });
  return {
    readOnly: true,
    projectId: record.projectId,
    sessionId: record.sessionId,
    projectName: record.projectName,
    projectKind: 'USER',
    currentPrompt: record.currentPrompt,
    activeBuildRunId: record.activeBuildRunId,
    previewUrl: binding.previewReady ? binding.previewUrl : record.previewUrl,
    previewBindingReason: binding.bindingReason,
    previewRepairAction: binding.repairAction,
    executionTraceLink: record.executionTraceLink,
    buildStatus: record.buildStatus,
    workspacePath: record.workspacePath,
    buildProfile: record.buildProfile,
    chatMessages: [...record.chatMessages],
    chatHistoryHtml: record.chatHistoryHtml,
    aeeAelEvents: [...record.aeeAelEvents],
  };
}

export function assertUserProjectCanBeActiveSession(
  projectId: string,
  rootDir?: string,
): { allowed: boolean; reason: string } {
  const record = getRegistryProject(projectId, rootDir);
  if (!record) {
    return { allowed: false, reason: 'Project not found in registry' };
  }
  if (!isUserFacingRegistryProject(record)) {
    return {
      allowed: false,
      reason: 'Audit and system-test projects cannot become active user sessions',
    };
  }
  return { allowed: true, reason: 'USER project eligible for active session' };
}

export function resolveActiveProjectSessionContext(rootDir?: string): ProjectSessionContext | null {
  const pointer = readActiveSessionPointer(rootDir);
  if (!pointer) return null;

  const guard = assertUserProjectCanBeActiveSession(pointer.activeProjectId, rootDir);
  if (!guard.allowed) return null;

  const record =
    readProjectSessionRecord(pointer.activeProjectId, pointer.activeSessionId, rootDir) ??
    findLatestActiveSessionForProject(pointer.activeProjectId, rootDir);
  if (!record) return null;
  return toSessionContext(record);
}

export function resolveProjectSessionContext(
  projectId: string,
  sessionId?: string | null,
  rootDir?: string,
): ProjectSessionContext | null {
  const guard = assertUserProjectCanBeActiveSession(projectId, rootDir);
  if (!guard.allowed) return null;

  const record = sessionId
    ? readProjectSessionRecord(projectId, sessionId, rootDir)
    : findLatestActiveSessionForProject(projectId, rootDir);
  if (!record) return null;
  return toSessionContext(record);
}

export function ensureProjectSessionForProject(input: {
  projectId: string;
  projectName: string;
  currentPrompt?: string | null;
  rootDir?: string;
}): ProjectSessionRecord {
  const existing = findLatestActiveSessionForProject(input.projectId, input.rootDir);
  if (existing) {
    writeActiveSessionPointer(
      { projectId: existing.projectId, sessionId: existing.sessionId },
      input.rootDir,
    );
    return existing;
  }
  return createProjectSessionRecord({
    projectId: input.projectId,
    projectName: input.projectName,
    currentPrompt: input.currentPrompt,
    rootDir: input.rootDir,
  });
}

export function ensureBuildProjectSession(
  input: EnsureBuildProjectSessionInput,
): EnsureBuildProjectSessionResult {
  const rootDir = input.rootDir;
  const rawPrompt = input.rawPrompt.trim();
  const resumeRoute = routeDuplicateProjectResume({
    rawPrompt,
    projectId: input.activeProjectId ?? input.resumeProjectId ?? undefined,
    projectName: input.projectName ?? undefined,
    rootDir,
    confirmResume: input.confirmResume === true,
    confirmFreshCopy: input.confirmFreshCopy === true,
  });

  if (resumeRoute.shouldBlock && !input.confirmResume && !input.confirmFreshCopy) {
    return {
      readOnly: true,
      projectId: resumeRoute.resumingProjectId ?? '',
      sessionId: '',
      projectName: resumeRoute.resumingProjectName ?? '',
      createdProject: false,
      createdSession: false,
      effectivePrompt: rawPrompt,
      duplicateResumeBlocked: true,
      duplicateResumePayload: composeDuplicateResumeResponse(resumeRoute),
    };
  }

  let projectId = input.activeProjectId ?? null;
  let projectName = input.projectName?.trim() || null;
  let createdProject = false;
  let createdSession = false;

  if (input.confirmFreshCopy) {
    projectId = null;
  } else if (input.confirmResume && resumeRoute.resumingProjectId) {
    projectId = resumeRoute.resumingProjectId;
    projectName = resumeRoute.resumingProjectName ?? projectName;
  } else if (resumeRoute.resumingExistingProject && resumeRoute.resumingProjectId) {
    projectId = resumeRoute.resumingProjectId;
    projectName = resumeRoute.resumingProjectName ?? projectName;
  }

  if (projectId) {
    const guard = assertUserProjectCanBeActiveSession(projectId, rootDir);
    if (!guard.allowed) {
      projectId = null;
    } else {
      const registryRecord = getRegistryProject(projectId, rootDir);
      projectName = projectName ?? registryRecord?.name ?? projectId;
      setRegistryActiveProject({ projectId, rootDir });
      setActiveProjectId(projectId);
    }
  }

  if (!projectId) {
    const identity = applyProjectIdentityForBuild({
      requestedName: deriveProjectNameFromPrompt(rawPrompt, projectName),
      rawPrompt,
      summary: rawPrompt.slice(0, 160),
      rootDir,
      confirmFreshCopy: input.confirmFreshCopy === true,
      forceFreshRebuild: input.confirmFreshCopy === true,
      rejectDuplicates: input.rejectDuplicates === true,
      repoRootDir: input.repoRootDir,
    });
    projectId = identity.projectId;
    projectName = identity.resolvedProjectName;
    createdProject = identity.createdProject;
    setActiveProjectId(projectId);
  }

  let session = findLatestActiveSessionForProject(projectId, rootDir);
  if (input.confirmFreshCopy || !session) {
    session = createProjectSessionRecord({
      projectId,
      projectName: projectName ?? projectId,
      currentPrompt: rawPrompt,
      rootDir,
    });
    createdSession = true;
  } else {
    updateProjectSessionRecord(
      projectId,
      session.sessionId,
      { currentPrompt: rawPrompt, projectName: projectName ?? session.projectName },
      rootDir,
    );
    writeActiveSessionPointer({ projectId, sessionId: session.sessionId }, rootDir);
  }

  return {
    readOnly: true,
    projectId,
    sessionId: session.sessionId,
    projectName: projectName ?? session.projectName,
    createdProject,
    createdSession,
    effectivePrompt: rawPrompt,
    duplicateResumeBlocked: false,
    duplicateResumePayload: null,
  };
}

export function recordBuildOnProjectSession(input: {
  projectId: string;
  sessionId: string;
  buildResult: OnePromptLivePreviewBuildResult;
  executionTraceLink?: string | null;
  rootDir?: string;
}): ProjectSessionRecord | null {
  const binding = resolveLivePreviewSessionBinding({
    session: {
      projectId: input.projectId,
      sessionId: input.sessionId,
      activeBuildRunId: input.buildResult.buildId,
      previewUrl: input.buildResult.previewUrl,
      buildStatus: input.buildResult.status,
    },
    rootDir: input.rootDir,
  });

  return updateProjectSessionRecord(
    input.projectId,
    input.sessionId,
    {
      activeBuildRunId: input.buildResult.buildId,
      previewUrl: binding.previewUrl,
      previewBindingReason: binding.bindingReason,
      previewRepairAction: binding.repairAction,
      executionTraceLink:
        input.executionTraceLink ?? `#execution-trace/${input.buildResult.buildId}`,
      buildStatus: input.buildResult.status,
      workspacePath: input.buildResult.workspacePath,
      buildProfile: input.buildResult.generatedProfile,
      projectName: input.buildResult.projectName,
    },
    input.rootDir,
  );
}

export function persistProjectSessionChat(input: {
  projectId: string;
  sessionId: string;
  role: 'user' | 'brain' | 'system';
  text: string;
  html?: string | null;
  chatHistoryHtml?: string | null;
  timestamp?: number;
  rootDir?: string;
}): ProjectSessionRecord | null {
  appendProjectSessionChatMessage(
    {
      projectId: input.projectId,
      sessionId: input.sessionId,
      role: input.role,
      text: input.text,
      html: input.html ?? null,
      timestamp: input.timestamp,
    },
    input.rootDir,
  );
  if (input.chatHistoryHtml !== undefined) {
    return updateProjectSessionRecord(
      input.projectId,
      input.sessionId,
      { chatHistoryHtml: input.chatHistoryHtml },
      input.rootDir,
    );
  }
  return readProjectSessionRecord(input.projectId, input.sessionId, input.rootDir);
}

export function activateProjectSession(input: {
  projectId: string;
  sessionId?: string | null;
  rootDir?: string;
}): ProjectSessionContext | null {
  const guard = assertUserProjectCanBeActiveSession(input.projectId, input.rootDir);
  if (!guard.allowed) return null;

  const record = input.sessionId
    ? readProjectSessionRecord(input.projectId, input.sessionId, input.rootDir)
    : ensureProjectSessionForProject({
        projectId: input.projectId,
        projectName: getRegistryProject(input.projectId, input.rootDir)?.name ?? input.projectId,
        rootDir: input.rootDir,
      });

  if (!record) return null;

  writeActiveSessionPointer(
    { projectId: record.projectId, sessionId: record.sessionId },
    input.rootDir,
  );
  setRegistryActiveProject({ projectId: record.projectId, rootDir: input.rootDir });
  setActiveProjectId(record.projectId);
  return toSessionContext(record);
}

export function buildProjectSessionContinuityApiPayload(rootDir?: string): Record<string, unknown> {
  const context = resolveActiveProjectSessionContext(rootDir);
  return {
    ok: true,
    contractVersion: 'PROJECT_SESSION_CONTINUITY_V1',
    activeSession: context,
    activeProjectId: context?.projectId ?? null,
    activeSessionId: context?.sessionId ?? null,
  };
}

export function chatHistoryHtmlFromSession(record: ProjectSessionRecord): string {
  if (record.chatHistoryHtml?.trim()) {
    return record.chatHistoryHtml;
  }
  return record.chatMessages
    .map((message) => {
      const html = message.html?.trim();
      if (html) return html;
      return `<div class="chat-message ${message.role}">${escapeHtml(message.text)}</div>`;
    })
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function navigationWouldLoseChatWithoutSessionStore(input: {
  inMemoryChatHtml: string;
  persistedChatHtml: string | null;
}): boolean {
  const memory = input.inMemoryChatHtml.trim();
  const persisted = (input.persistedChatHtml ?? '').trim();
  if (!memory) return false;
  if (!persisted) return true;
  return memory !== persisted;
}

export { deriveProjectNameFromPrompt, GENERIC_PROJECT_NAME };
