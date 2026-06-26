/**
 * Project Tab Context Switch — load full project context from registry + persistent reality.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  getBuildResultForProject,
  getProjectSession,
} from '../one-prompt-live-preview/workspace-tab-registry.js';
import { getProjectContextMetadata } from '../project-context-alignment-v1/project-context-metadata-store.js';
import { getRegistryProject, readProjectRegistryState } from '../project-registry-v1/project-registry-v1-store.js';
import type { ProjectRegistryRecord } from '../project-registry-v1/project-registry-v1-types.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import {
  isLisaProjectName,
  resolveLisaDisplayName,
  resolveLisaProjectDomain,
} from './project-context-classifier-guard.js';
import type { ResolvedProjectContext } from './project-context-types.js';

function nowIso(): string {
  return new Date().toISOString();
}

function resolveDisplayName(record: ProjectRegistryRecord): string {
  const lisaDisplay = resolveLisaDisplayName(record.name);
  if (lisaDisplay) return lisaDisplay;
  return record.summary?.trim() || record.name;
}

function resolveDomain(
  record: ProjectRegistryRecord,
  metadataDomain: string | null,
): string {
  const lisaDomain = resolveLisaProjectDomain(record.name);
  if (lisaDomain) return lisaDomain;
  if (metadataDomain && metadataDomain !== 'general application') return metadataDomain;
  return metadataDomain ?? 'general application';
}

export function loadProjectContext(input: {
  projectId: string;
  rootDir?: string;
}): ResolvedProjectContext | null {
  const projectId = input.projectId.trim();
  if (!projectId) return null;

  const registryRecord = getRegistryProject(projectId, input.rootDir);
  if (!registryRecord || registryRecord.status !== 'ACTIVE') return null;

  const metadata = getProjectContextMetadata(projectId, input.rootDir);
  const session = getProjectSession(projectId);
  const build = getBuildResultForProject(projectId);

  const persistentPath =
    registryRecord.persistentWorkspacePath?.trim() ||
    persistentProjectPaths(input.rootDir ?? process.cwd(), projectId).root;
  const loadedFromPersistent =
    Boolean(registryRecord.persistentWorkspacePath) || existsSync(persistentPath);
  const sourceRoot =
    registryRecord.sourceRoot?.trim() ||
    (loadedFromPersistent ? join(persistentPath, 'source') : null);

  const domain = resolveDomain(registryRecord, metadata?.domain ?? null);
  const previewUrl = session?.previewUrl ?? build?.previewUrl ?? null;
  const buildStatus = session?.buildStatus ?? build?.status ?? 'IDLE';
  const buildProfile = session?.buildProfile ?? build?.generatedProfile ?? metadata?.profile ?? null;

  return {
    readOnly: true,
    projectId: registryRecord.projectId,
    projectName: registryRecord.name,
    displayName: resolveDisplayName(registryRecord),
    domain,
    selectedProfile: buildProfile,
    persistentWorkspacePath: loadedFromPersistent ? persistentPath : registryRecord.persistentWorkspacePath ?? null,
    sourceRoot,
    activeBuildRunId:
      registryRecord.activeBuildHistoryRunId ?? build?.buildId ?? session?.buildId ?? null,
    lastPrompt: metadata?.lastBuildIntentSummary ?? null,
    chatContext: {
      readOnly: true,
      threadId: session?.chatThreadId ?? `chat-${projectId}`,
      hasSavedThread: false,
    },
    livePreviewState: {
      readOnly: true,
      previewUrl,
      buildStatus,
      buildProfile,
      workspacePath: session?.workspacePath ?? build?.workspacePath ?? null,
      connected: Boolean(previewUrl),
    },
    executionTraceState: {
      readOnly: true,
      activeBuildRunId: registryRecord.activeBuildHistoryRunId ?? null,
      lastSuccessfulBuildRunId: registryRecord.lastSuccessfulBuildRunId ?? null,
      projectRealityStatus: registryRecord.projectRealityStatus ?? null,
    },
    notifications: {
      readOnly: true,
      projectId,
      scope: 'PROJECT',
      count: 0,
    },
    status: loadedFromPersistent ? 'LOADED' : metadata ? 'PARTIAL' : 'PARTIAL',
    loadedFromRegistry: true,
    loadedFromPersistentProject: loadedFromPersistent,
    loadedAt: nowIso(),
  };
}

export function loadActiveProjectContext(rootDir?: string): ResolvedProjectContext | null {
  const state = readProjectRegistryState(rootDir);
  if (!state.activeProjectId) return null;
  return loadProjectContext({ projectId: state.activeProjectId, rootDir });
}

export function upgradeProjectContextForLisaIfNeeded(
  context: ResolvedProjectContext,
): ResolvedProjectContext {
  if (!isLisaProjectName(context.projectName)) return context;
  const lisaDomain = resolveLisaProjectDomain(context.projectName);
  const lisaDisplay = resolveLisaDisplayName(context.projectName);
  if (!lisaDomain) return context;
  return {
    ...context,
    domain: lisaDomain,
    displayName: lisaDisplay ?? context.displayName,
  };
}
