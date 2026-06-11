/**
 * Real file workspace path authority — production protection and traversal guards (Phase 24D).
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join, normalize, relative, resolve, sep } from 'node:path';
import {
  FORBIDDEN_REPO_ROOT_TARGETS,
  GENERATED_BUILDER_WORKSPACES_DIR,
  PRODUCTION_WORKSPACE_MARKER,
} from './real-file-workspace-execution-bounds.js';

export type RealFileWorkspacePathResult = 'REAL_FILE_WORKSPACE_PATH_PASS' | 'REAL_FILE_WORKSPACE_PATH_FAIL';

export interface RealFileWorkspacePathVerdict {
  result: RealFileWorkspacePathResult;
  workspaceRoot: string;
  normalizedRelativePath: string | null;
  reason: string;
}

function usesParentTraversal(relativePath: string): boolean {
  return relativePath.split(/[/\\]/).some((segment) => segment === '..');
}

/** Block attempts to write directly into repository roots from outside generated workspaces. */
export function isForbiddenRepositoryWriteTarget(
  projectRootDir: string,
  absoluteTarget: string,
): boolean {
  for (const segment of FORBIDDEN_REPO_ROOT_TARGETS) {
    const forbiddenRoot = resolve(projectRootDir, segment);
    if (absoluteTarget === forbiddenRoot || absoluteTarget.startsWith(forbiddenRoot + sep)) {
      const generatedRoot = resolve(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR);
      if (absoluteTarget.startsWith(generatedRoot + sep)) continue;
      return true;
    }
  }
  return false;
}

export function resolveSafeWorkspaceRoot(
  projectRootDir: string,
  workspaceId: string,
  sourceProject?: string,
): RealFileWorkspacePathVerdict {
  if (!workspaceId || workspaceId.includes('..') || workspaceId.includes(sep)) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot: '',
      normalizedRelativePath: null,
      reason: 'Invalid workspace id',
    };
  }

  if (sourceProject && sourceProject.toLowerCase().includes(PRODUCTION_WORKSPACE_MARKER)) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot: '',
      normalizedRelativePath: null,
      reason: 'Forbidden production workspace target',
    };
  }

  const workspaceRoot = resolve(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId);
  const generatedRoot = resolve(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR);
  const relToProject = relative(resolve(projectRootDir), workspaceRoot);

  if (relToProject.startsWith('..') || relToProject.includes('..')) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot,
      normalizedRelativePath: null,
      reason: 'Workspace root escapes project directory',
    };
  }

  if (!workspaceRoot.startsWith(generatedRoot + sep) && workspaceRoot !== generatedRoot) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot,
      normalizedRelativePath: null,
      reason: 'Workspace root must stay under generated builder workspaces',
    };
  }

  if (!existsSync(generatedRoot)) {
    mkdirSync(generatedRoot, { recursive: true });
  }
  if (!existsSync(workspaceRoot)) {
    mkdirSync(workspaceRoot, { recursive: true });
  }

  return {
    result: 'REAL_FILE_WORKSPACE_PATH_PASS',
    workspaceRoot,
    normalizedRelativePath: '.',
    reason: 'Isolated generated builder workspace root resolved',
  };
}

export function validateRelativePathInWorkspace(
  projectRootDir: string,
  workspaceRoot: string,
  relativePath: string,
): RealFileWorkspacePathVerdict {
  if (!relativePath || relativePath.trim().length === 0) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot,
      normalizedRelativePath: null,
      reason: 'Relative path is required',
    };
  }

  if (relativePath.startsWith('/') || /^[A-Za-z]:/.test(relativePath)) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot,
      normalizedRelativePath: null,
      reason: 'Absolute paths outside approved workspace root are forbidden',
    };
  }

  const normalizedRelative = normalize(relativePath.replace(/\\/g, '/')).replace(/\\/g, '/');
  if (usesParentTraversal(normalizedRelative)) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot,
      normalizedRelativePath: null,
      reason: 'Parent-directory traversal is forbidden',
    };
  }

  const absoluteTarget = resolve(workspaceRoot, normalizedRelative);
  const relFromWorkspace = relative(workspaceRoot, absoluteTarget);
  if (relFromWorkspace.startsWith('..') || relFromWorkspace.includes('..')) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot,
      normalizedRelativePath: null,
      reason: 'Resolved path escapes workspace root',
    };
  }

  const projectRootGuess = resolve(projectRootDir);
  if (isForbiddenRepositoryWriteTarget(projectRootGuess, absoluteTarget)) {
    return {
      result: 'REAL_FILE_WORKSPACE_PATH_FAIL',
      workspaceRoot,
      normalizedRelativePath: null,
      reason: 'Path targets forbidden DevPulse repository roots',
    };
  }

  return {
    result: 'REAL_FILE_WORKSPACE_PATH_PASS',
    workspaceRoot,
    normalizedRelativePath: normalizedRelative,
    reason: 'Relative path validated inside isolated workspace',
  };
}

export function resolveSafeAbsolutePath(
  projectRootDir: string,
  workspaceId: string,
  relativePath: string,
  sourceProject?: string,
): RealFileWorkspacePathVerdict {
  const rootVerdict = resolveSafeWorkspaceRoot(projectRootDir, workspaceId, sourceProject);
  if (rootVerdict.result === 'REAL_FILE_WORKSPACE_PATH_FAIL') {
    return rootVerdict;
  }
  return validateRelativePathInWorkspace(projectRootDir, rootVerdict.workspaceRoot, relativePath);
}
