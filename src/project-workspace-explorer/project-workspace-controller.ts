/**
 * Project Workspace Explorer V1 — controller orchestrating read-only workspace access.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getRegistryProject } from '../project-registry-v1/project-registry-v1-store.js';
import { getBuildResultForProject } from '../one-prompt-live-preview/workspace-tab-registry.js';
import { assessProjectWorkspaceAvailability } from './project-workspace-availability.js';
import { loadProjectWorkspaceContext, listMetadataShortcuts } from './project-workspace-loader.js';
import { readWorkspaceFile } from './project-workspace-file-reader.js';
import { searchProjectWorkspace } from './project-workspace-search.js';
import { listWorkspaceFolder } from './project-workspace-tree.js';
import type {
  ProjectWorkspaceFileReadResult,
  ProjectWorkspaceInfo,
  ProjectWorkspaceListing,
  ProjectWorkspaceSearchResult,
} from './project-workspace-types.js';
import { sanitizeRelativeWorkspacePath } from './project-workspace-validator.js';

function readJsonSafe<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

function countFeatureModules(sourceRootAbs: string): number {
  const featuresDir = join(sourceRootAbs, 'src', 'features');
  if (!existsSync(featuresDir)) return 0;
  let count = 0;
  for (const name of readdirSync(featuresDir)) {
    const full = join(featuresDir, name);
    if (statSync(full).isDirectory()) count += 1;
  }
  return count;
}

function buildProjectWorkspaceInfo(
  rootDir: string,
  projectId: string,
  ctx: NonNullable<ReturnType<typeof loadProjectWorkspaceContext>>,
): ProjectWorkspaceInfo {
  const registry = getRegistryProject(projectId, rootDir);
  const build = getBuildResultForProject(projectId);
  const fileIndex = readJsonSafe<{ sourceFiles?: unknown[] }>(
    join(ctx.aidevDirAbs, 'project-file-index.json'),
  );
  const manifest = readJsonSafe<{
    selectedProfile?: string;
    completedAt?: string;
    universalProductionProofStatus?: string;
  }>(join(ctx.sourceRootAbs, '.generated-app-manifest.json'));

  return {
    readOnly: true,
    projectName: ctx.projectName,
    projectId,
    workspacePath: ctx.workspacePathRel,
    sourceRoot: ctx.sourceRootRel,
    featureCount: countFeatureModules(ctx.sourceRootAbs),
    generatedFiles: fileIndex?.sourceFiles?.length ?? 0,
    lastBuild:
      registry?.lastActivityAt ??
      build?.updatedAt ??
      manifest?.completedAt ??
      null,
    currentBuildProfile:
      build?.generatedProfile ??
      manifest?.selectedProfile ??
      registry?.materializationQualityVerdict ??
      null,
    materializationQuality: registry?.materializationQualityVerdict ?? null,
    materializationQualityScore: registry?.materializationQualityScore ?? null,
    workspaceReality: registry?.workspaceRealityAuditStatus ?? null,
    universalProductionProof: manifest?.universalProductionProofStatus ?? null,
  };
}

function buildUnavailableListing(
  input: { rootDir: string; projectId: string; folder?: string },
  availability: ReturnType<typeof assessProjectWorkspaceAvailability>,
): ProjectWorkspaceListing {
  const endpointPath = `/api/projects/${input.projectId}/workspace`;
  return {
    readOnly: true,
    ok: false,
    projectId: input.projectId,
    projectName: availability.projectName ?? undefined,
    workspacePath: availability.expectedWorkspacePath,
    sourceRoot: availability.expectedSourceRoot,
    relativePath: sanitizeRelativeWorkspacePath(input.folder ?? '') ?? '',
    files: [],
    folders: [],
    projectInfo: null,
    lazyLoaded: false,
    cached: false,
    reason: availability.reason,
    expectedWorkspacePath: availability.expectedWorkspacePath,
    expectedSourceRoot: availability.expectedSourceRoot,
    message: availability.message,
    endpointPath,
  };
}

export function getProjectWorkspaceListing(input: {
  rootDir: string;
  projectId: string;
  folder?: string;
}): ProjectWorkspaceListing {
  const endpointPath = `/api/projects/${input.projectId}/workspace`;
  const availability = assessProjectWorkspaceAvailability(input.rootDir, input.projectId);

  if (!availability.available) {
    return buildUnavailableListing(input, availability);
  }

  const ctx = loadProjectWorkspaceContext(input.rootDir, input.projectId);
  if (!ctx) {
    return buildUnavailableListing(input, {
      ...availability,
      available: false,
      reason: availability.reason ?? 'WORKSPACE_NOT_PROMOTED',
      message: availability.message || 'Workspace context could not be loaded.',
    });
  }

  const folder = sanitizeRelativeWorkspacePath(input.folder ?? '') ?? '';
  const listing = listWorkspaceFolder(ctx, folder);
  const metadataShortcuts = listMetadataShortcuts(ctx);

  if (
    !folder &&
    listing.files.length === 0 &&
    listing.folders.length === 0 &&
    availability.reason === null
  ) {
    return {
      readOnly: true,
      ok: false,
      projectId: ctx.projectId,
      projectName: ctx.projectName,
      workspacePath: ctx.workspacePathRel,
      sourceRoot: ctx.sourceRootRel,
      relativePath: '',
      files: [],
      folders: [],
      projectInfo: buildProjectWorkspaceInfo(input.rootDir, ctx.projectId, ctx),
      lazyLoaded: true,
      cached: listing.cached,
      reason: 'WORKSPACE_EMPTY',
      expectedWorkspacePath: ctx.workspacePathRel,
      expectedSourceRoot: ctx.sourceRootRel,
      message: 'Workspace exists but no files were found.',
      endpointPath,
      metadataShortcuts,
    };
  }

  return {
    readOnly: true,
    ok: true,
    projectId: ctx.projectId,
    projectName: ctx.projectName,
    workspacePath: ctx.workspacePathRel,
    sourceRoot: ctx.sourceRootRel,
    relativePath: folder,
    files: listing.files,
    folders: listing.folders,
    projectInfo: buildProjectWorkspaceInfo(input.rootDir, ctx.projectId, ctx),
    lazyLoaded: true,
    cached: listing.cached,
    metadataShortcuts,
    endpointPath,
  };
}

export function getProjectWorkspaceFile(input: {
  rootDir: string;
  projectId: string;
  path: string;
}): ProjectWorkspaceFileReadResult {
  const ctx = loadProjectWorkspaceContext(input.rootDir, input.projectId);
  if (!ctx) {
    return {
      readOnly: true,
      ok: false,
      projectId: input.projectId,
      relativePath: input.path,
      contents: '',
      language: 'unknown',
      modifiedAt: new Date(0).toISOString(),
      size: 0,
      truncated: false,
    };
  }
  return readWorkspaceFile(ctx, input.path);
}

export function getProjectWorkspaceSearch(input: {
  rootDir: string;
  projectId: string;
  query: string;
}): ProjectWorkspaceSearchResult {
  const availability = assessProjectWorkspaceAvailability(input.rootDir, input.projectId);
  if (!availability.available) {
    return {
      readOnly: true,
      ok: false,
      projectId: input.projectId,
      query: input.query,
      matches: [],
      truncated: false,
    };
  }

  const ctx = loadProjectWorkspaceContext(input.rootDir, input.projectId);
  if (!ctx) {
    return {
      readOnly: true,
      ok: false,
      projectId: input.projectId,
      query: input.query,
      matches: [],
      truncated: false,
    };
  }
  return searchProjectWorkspace(ctx, input.query);
}

export { assessProjectWorkspaceAvailability } from './project-workspace-availability.js';
export {
  loadProjectWorkspaceContext,
  listMetadataShortcuts,
} from './project-workspace-loader.js';
export { clearProjectWorkspaceFolderCache } from './project-workspace-tree.js';
