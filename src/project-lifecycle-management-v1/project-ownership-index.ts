/**
 * Project Lifecycle Management V1 — ownership index (disk-backed).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { resolveProjectRegistryRootDir } from '../project-registry-v1/project-registry-v1-store.js';
import type {
  ProjectArtifactLifecycleState,
  ProjectArtifactType,
  ProjectOwnershipArtifact,
  ProjectOwnershipIndexFile,
} from './project-lifecycle-types.js';

const LIFECYCLE_DIR = '.aidevengine';
const OWNERSHIP_INDEX_FILE = 'project-ownership-index-v1.json';

let artifactCounter = 0;

function indexPath(rootDir: string): string {
  return join(rootDir, LIFECYCLE_DIR, OWNERSHIP_INDEX_FILE);
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextArtifactId(): string {
  artifactCounter += 1;
  return `artifact-${Date.now()}-${artifactCounter}`;
}

function emptyIndex(): ProjectOwnershipIndexFile {
  return { version: 1, updatedAt: nowIso(), artifacts: [] };
}

export function readProjectOwnershipIndex(rootDir?: string): ProjectOwnershipIndexFile {
  const resolved = rootDir ?? resolveProjectRegistryRootDir();
  const path = indexPath(resolved);
  if (!existsSync(path)) return emptyIndex();
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as ProjectOwnershipIndexFile;
    if (parsed.version !== 1 || !Array.isArray(parsed.artifacts)) return emptyIndex();
    artifactCounter = parsed.artifacts.length;
    return parsed;
  } catch {
    return emptyIndex();
  }
}

export function writeProjectOwnershipIndex(
  index: ProjectOwnershipIndexFile,
  rootDir?: string,
): void {
  const resolved = rootDir ?? resolveProjectRegistryRootDir();
  const path = indexPath(resolved);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    JSON.stringify({ ...index, updatedAt: nowIso() }, null, 2),
    'utf8',
  );
}

export function registerProjectOwnershipArtifact(input: {
  projectId: string;
  path: string;
  artifactType: ProjectArtifactType;
  lifecycleState?: ProjectArtifactLifecycleState;
  exclusive?: boolean;
  rootDir?: string;
}): ProjectOwnershipArtifact {
  const index = readProjectOwnershipIndex(input.rootDir);
  const normalizedPath = input.path.replace(/\\/g, '/');
  const existing = index.artifacts.find(
    (a) => a.projectId === input.projectId && a.path === normalizedPath,
  );
  if (existing) {
    existing.lifecycleState = input.lifecycleState ?? existing.lifecycleState;
    writeProjectOwnershipIndex(index, input.rootDir);
    return existing;
  }

  const artifact: ProjectOwnershipArtifact = {
    readOnly: true,
    artifactId: nextArtifactId(),
    projectId: input.projectId,
    owner: 'project-lifecycle-management-v1',
    artifactType: input.artifactType,
    path: normalizedPath,
    createdAt: nowIso(),
    lifecycleState: input.lifecycleState ?? 'ACTIVE',
    exclusive: input.exclusive ?? true,
  };
  index.artifacts.push(artifact);
  writeProjectOwnershipIndex(index, input.rootDir);
  return artifact;
}

export function listOwnershipArtifactsForProject(
  projectId: string,
  rootDir?: string,
): ProjectOwnershipArtifact[] {
  return readProjectOwnershipIndex(rootDir).artifacts.filter(
    (a) => a.projectId === projectId && a.lifecycleState !== 'DELETED',
  );
}

export function removeOwnershipArtifactsForProject(projectId: string, rootDir?: string): number {
  const index = readProjectOwnershipIndex(rootDir);
  const before = index.artifacts.length;
  index.artifacts = index.artifacts.filter((a) => a.projectId !== projectId);
  if (index.artifacts.length !== before) {
    writeProjectOwnershipIndex(index, rootDir);
  }
  return before - index.artifacts.length;
}

export function getProjectOwnershipIndexPath(rootDir?: string): string {
  return indexPath(rootDir ?? resolveProjectRegistryRootDir());
}

export function resetProjectOwnershipIndexForTests(rootDir: string): void {
  writeProjectOwnershipIndex(emptyIndex(), rootDir);
}
