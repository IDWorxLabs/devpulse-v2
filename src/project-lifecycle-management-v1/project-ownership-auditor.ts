/**
 * Project Lifecycle Management V1 — ownership auditor and orphan detection.
 */

import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GENERATED_BUILD_HISTORY_DIR } from '../build-history-integrity/build-history-types.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { PERSISTENT_PROJECTS_DIR } from '../persistent-project-reality/persistent-project-reality-types.js';
import { readProjectRegistryState } from '../project-registry-v1/project-registry-v1-store.js';
import { discoverProjectArtifacts, listRegisteredProjectIds } from './project-artifact-discovery.js';
import { readProjectOwnershipIndex } from './project-ownership-index.js';
import type {
  ProjectArtifactType,
  ProjectOrphanRecord,
  ProjectOwnershipAuditResult,
} from './project-lifecycle-types.js';

function nowIso(): string {
  return new Date().toISOString();
}

function scanDirectoryOrphans(
  rootDir: string,
  parentRel: string,
  artifactType: ProjectArtifactType,
  registeredIds: Set<string>,
  referencedPaths: Set<string>,
): ProjectOrphanRecord[] {
  const abs = join(rootDir, parentRel);
  if (!existsSync(abs)) return [];

  const orphans: ProjectOrphanRecord[] = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rel = `${parentRel}/${entry.name}`.replace(/\\/g, '/');
    if (referencedPaths.has(rel)) continue;

    const matchesRegistry = registeredIds.has(entry.name);
    if (matchesRegistry) continue;

    orphans.push({
      readOnly: true,
      orphanId: `orphan-${artifactType}-${entry.name}`,
      path: rel,
      artifactType,
      suggestedOwnerProjectId: null,
      detectedAt: nowIso(),
    });
  }
  return orphans;
}

function collectReferencedPaths(rootDir: string, registeredIds: string[]): Set<string> {
  const referenced = new Set<string>();
  for (const projectId of registeredIds) {
    const discovery = discoverProjectArtifacts(projectId, rootDir);
    for (const artifact of discovery.artifacts) {
      if (!artifact.path.includes('#')) {
        referenced.add(artifact.path.replace(/\\/g, '/'));
      }
    }
  }
  const index = readProjectOwnershipIndex(rootDir);
  for (const artifact of index.artifacts) {
    if (artifact.lifecycleState !== 'DELETED' && !artifact.path.includes('#')) {
      referenced.add(artifact.path.replace(/\\/g, '/'));
    }
  }
  return referenced;
}

export function auditProjectOwnership(rootDir: string): ProjectOwnershipAuditResult {
  const registeredProjectIds = listRegisteredProjectIds(rootDir);
  const registeredSet = new Set(registeredProjectIds);
  const referencedPaths = collectReferencedPaths(rootDir, registeredProjectIds);

  const orphans: ProjectOrphanRecord[] = [
    ...scanDirectoryOrphans(
      rootDir,
      PERSISTENT_PROJECTS_DIR,
      'PERSISTENT_WORKSPACE',
      registeredSet,
      referencedPaths,
    ),
    ...scanDirectoryOrphans(
      rootDir,
      GENERATED_BUILDER_WORKSPACES_DIR,
      'GENERATED_BUILDER_WORKSPACE',
      registeredSet,
      referencedPaths,
    ),
  ];

  const historyDir = join(rootDir, GENERATED_BUILD_HISTORY_DIR);
  if (existsSync(historyDir)) {
    for (const entry of readdirSync(historyDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const rel = `${GENERATED_BUILD_HISTORY_DIR}/${entry.name}`.replace(/\\/g, '/');
      if (referencedPaths.has(rel)) continue;
      orphans.push({
        readOnly: true,
        orphanId: `orphan-BUILD_HISTORY-${entry.name}`,
        path: rel,
        artifactType: 'BUILD_HISTORY',
        suggestedOwnerProjectId: null,
        detectedAt: nowIso(),
      });
    }
  }

  return {
    readOnly: true,
    scannedAt: nowIso(),
    registeredProjectIds,
    orphans,
    orphanCount: orphans.length,
    referencedArtifactCount: referencedPaths.size,
  };
}

export function deleteOrphanPath(rootDir: string, orphanPath: string): boolean {
  const normalized = orphanPath.replace(/\\/g, '/');
  if (
    normalized.startsWith('src/') ||
    normalized.startsWith('server/') ||
    normalized.startsWith('architecture/') ||
    normalized === '.aidevengine/project-registry-v1.json'
  ) {
    return false;
  }
  const abs = join(rootDir, normalized);
  if (!existsSync(abs)) return false;
  const stat = statSync(abs);
  if (stat.isDirectory()) {
    rmSync(abs, { recursive: true, force: true });
  } else {
    rmSync(abs, { force: true });
  }
  return true;
}
