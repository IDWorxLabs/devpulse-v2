/**
 * Project Workspace Explorer V1 — lazy folder tree with cache.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { iconForFile, iconForFolder } from './project-workspace-icons.js';
import { detectWorkspaceFileLanguage } from './project-workspace-file-reader.js';
import type {
  ProjectWorkspaceContext,
  ProjectWorkspaceFileEntry,
  ProjectWorkspaceFolderEntry,
} from './project-workspace-types.js';
import {
  MAX_WORKSPACE_FOLDER_CHILDREN,
  WORKSPACE_SKIP_DIRS,
} from './project-workspace-types.js';
import { resolvePathWithinWorkspace } from './project-workspace-validator.js';

interface FolderCacheEntry {
  readOnly: true;
  files: ProjectWorkspaceFileEntry[];
  folders: ProjectWorkspaceFolderEntry[];
  cachedAt: number;
}

const folderListingCache = new Map<string, FolderCacheEntry>();
const FOLDER_CACHE_TTL_MS = 15_000;

function cacheKey(projectId: string, relativePath: string): string {
  return `${projectId}::${relativePath || '/'}`;
}

export function clearProjectWorkspaceFolderCache(projectId?: string): void {
  if (!projectId) {
    folderListingCache.clear();
    return;
  }
  for (const key of folderListingCache.keys()) {
    if (key.startsWith(`${projectId}::`)) folderListingCache.delete(key);
  }
}

function countChildren(dirAbs: string): { files: number; folders: number } {
  if (!existsSync(dirAbs)) return { files: 0, folders: 0 };
  let files = 0;
  let folders = 0;
  for (const name of readdirSync(dirAbs)) {
    if (WORKSPACE_SKIP_DIRS.has(name)) continue;
    const full = join(dirAbs, name);
    const stat = statSync(full);
    if (stat.isDirectory()) folders += 1;
    else files += 1;
  }
  return { files, folders };
}

export function listWorkspaceFolder(
  ctx: ProjectWorkspaceContext,
  relativeFolder: string,
  options?: { bypassCache?: boolean },
): {
  files: ProjectWorkspaceFileEntry[];
  folders: ProjectWorkspaceFolderEntry[];
  cached: boolean;
} {
  const resolved = resolvePathWithinWorkspace(ctx.workspaceRootAbs, relativeFolder);
  if (!resolved.ok) {
    return { files: [], folders: [], cached: false };
  }

  const key = cacheKey(ctx.projectId, resolved.relativePath);
  if (!options?.bypassCache) {
    const cached = folderListingCache.get(key);
    if (cached && Date.now() - cached.cachedAt < FOLDER_CACHE_TTL_MS) {
      return { files: cached.files, folders: cached.folders, cached: true };
    }
  }

  const dirAbs = resolved.absolutePath;
  if (!existsSync(dirAbs) || !statSync(dirAbs).isDirectory()) {
    return { files: [], folders: [], cached: false };
  }

  const files: ProjectWorkspaceFileEntry[] = [];
  const folders: ProjectWorkspaceFolderEntry[] = [];
  const names = readdirSync(dirAbs).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  for (const name of names) {
    if (WORKSPACE_SKIP_DIRS.has(name)) continue;
    if (files.length + folders.length >= MAX_WORKSPACE_FOLDER_CHILDREN) break;

    const full = join(dirAbs, name);
    const stat = statSync(full);
    const childRelative = resolved.relativePath ? `${resolved.relativePath}/${name}` : name;

    if (stat.isDirectory()) {
      const counts = countChildren(full);
      folders.push({
        readOnly: true,
        name,
        relativePath: childRelative.replace(/\\/g, '/'),
        kind: 'folder',
        childFileCount: counts.files,
        childFolderCount: counts.folders,
        icon: iconForFolder(name),
      });
      continue;
    }

    files.push({
      readOnly: true,
      name,
      relativePath: childRelative.replace(/\\/g, '/'),
      kind: 'file',
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      language: detectWorkspaceFileLanguage(name),
      icon: iconForFile(name),
    });
  }

  folderListingCache.set(key, {
    readOnly: true,
    files,
    folders,
    cachedAt: Date.now(),
  });

  return { files, folders, cached: false };
}

export function buildWorkspaceRootTree(ctx: ProjectWorkspaceContext): {
  files: ProjectWorkspaceFileEntry[];
  folders: ProjectWorkspaceFolderEntry[];
} {
  return listWorkspaceFolder(ctx, '', { bypassCache: true });
}
