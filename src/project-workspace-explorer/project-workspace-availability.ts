/**
 * Project Workspace Explorer V1 — workspace availability assessment.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getRegistryProject } from '../project-registry-v1/project-registry-v1-store.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import type { ProjectWorkspaceUnavailableReason } from './project-workspace-types.js';
import { WORKSPACE_SKIP_DIRS } from './project-workspace-types.js';
import { validateProjectId } from './project-workspace-validator.js';

export interface ProjectWorkspaceAvailability {
  readOnly: true;
  available: boolean;
  reason: ProjectWorkspaceUnavailableReason | null;
  projectId: string;
  projectName: string | null;
  expectedWorkspacePath: string;
  expectedSourceRoot: string;
  message: string;
}

function countVisibleEntries(dirAbs: string): number {
  if (!existsSync(dirAbs)) return 0;
  let count = 0;
  for (const name of readdirSync(dirAbs)) {
    if (WORKSPACE_SKIP_DIRS.has(name)) continue;
    count += 1;
  }
  return count;
}

export function assessProjectWorkspaceAvailability(
  rootDir: string,
  projectId: string,
): ProjectWorkspaceAvailability {
  const expectedWorkspacePath = `.aidev-projects/${projectId}`;
  const expectedSourceRoot = `.aidev-projects/${projectId}/source`;

  if (!validateProjectId(projectId)) {
    return {
      readOnly: true,
      available: false,
      reason: 'PROJECT_NOT_FOUND',
      projectId,
      projectName: null,
      expectedWorkspacePath,
      expectedSourceRoot,
      message: 'Invalid project id.',
    };
  }

  const registryRecord = getRegistryProject(projectId, rootDir);
  if (!registryRecord || registryRecord.status !== 'ACTIVE') {
    return {
      readOnly: true,
      available: false,
      reason: 'PROJECT_NOT_FOUND',
      projectId,
      projectName: registryRecord?.name ?? null,
      expectedWorkspacePath,
      expectedSourceRoot,
      message: 'Project was not found in the active registry.',
    };
  }

  const paths = persistentProjectPaths(rootDir, projectId);
  const workspaceExists = existsSync(paths.root);
  const sourceExists = existsSync(paths.source);

  if (!workspaceExists || !sourceExists) {
    return {
      readOnly: true,
      available: false,
      reason: 'WORKSPACE_NOT_PROMOTED',
      projectId,
      projectName: registryRecord.name,
      expectedWorkspacePath,
      expectedSourceRoot,
      message:
        'This project does not have generated source files yet. Run a build first — after a successful build, AiDevEngine promotes the generated app into a persistent project workspace.',
    };
  }

  const sourceEntries = countVisibleEntries(paths.source);
  const workspaceEntries = countVisibleEntries(paths.root);
  if (sourceEntries === 0 && workspaceEntries <= 1) {
    return {
      readOnly: true,
      available: false,
      reason: 'WORKSPACE_EMPTY',
      projectId,
      projectName: registryRecord.name,
      expectedWorkspacePath,
      expectedSourceRoot,
      message: 'Workspace exists but no files were found in the promoted source root.',
    };
  }

  if (!sourceExists) {
    return {
      readOnly: true,
      available: false,
      reason: 'SOURCE_ROOT_MISSING',
      projectId,
      projectName: registryRecord.name,
      expectedWorkspacePath,
      expectedSourceRoot,
      message: 'Persistent workspace exists but the source root is missing.',
    };
  }

  return {
    readOnly: true,
    available: true,
    reason: null,
    projectId,
    projectName: registryRecord.name,
    expectedWorkspacePath,
    expectedSourceRoot,
    message: 'Workspace available.',
  };
}
