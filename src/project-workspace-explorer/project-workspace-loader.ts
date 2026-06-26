/**
 * Project Workspace Explorer V1 — resolve persistent workspace paths per project.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getRegistryProject } from '../project-registry-v1/project-registry-v1-store.js';
import { persistentProjectPaths, relativeFromProjectRoot } from '../persistent-project-reality/persistent-project-reality-paths.js';
import type { ProjectWorkspaceContext } from './project-workspace-types.js';
import { validateProjectId } from './project-workspace-validator.js';

function resolveRegistryPath(rootDir: string, maybePath: string | null | undefined): string | null {
  const trimmed = maybePath?.trim().replace(/\\/g, '/');
  if (!trimmed) return null;
  const abs =
    /^[a-zA-Z]:/.test(trimmed) || trimmed.startsWith('/')
      ? trimmed
      : join(rootDir, ...trimmed.split('/').filter(Boolean));
  return existsSync(abs) ? abs : null;
}

export function loadProjectWorkspaceContext(
  rootDir: string,
  projectId: string,
): ProjectWorkspaceContext | null {
  if (!validateProjectId(projectId)) return null;

  const registryRecord = getRegistryProject(projectId, rootDir);
  if (!registryRecord || registryRecord.status !== 'ACTIVE') return null;

  const paths = persistentProjectPaths(rootDir, projectId);
  const workspaceRootAbs =
    resolveRegistryPath(rootDir, registryRecord.persistentWorkspacePath) ?? paths.root;

  if (!existsSync(workspaceRootAbs)) return null;

  const sourceRootAbs =
    resolveRegistryPath(rootDir, registryRecord.sourceRoot) ?? paths.source;

  const aidevDirAbs = paths.aidev;
  const workspacePathRel = relativeFromProjectRoot(rootDir, workspaceRootAbs);
  const sourceRootRel = relativeFromProjectRoot(rootDir, sourceRootAbs);

  return {
    readOnly: true,
    projectId,
    projectName: registryRecord.name,
    workspaceRootAbs,
    workspacePathRel,
    sourceRootAbs,
    sourceRootRel,
    aidevDirAbs,
  };
}

export function listMetadataShortcuts(ctx: ProjectWorkspaceContext): Array<{
  label: string;
  relativePath: string;
  category: 'manifest' | 'validation' | 'history' | 'trace';
}> {
  const shortcuts: Array<{
    label: string;
    relativePath: string;
    category: 'manifest' | 'validation' | 'history' | 'trace';
  }> = [];

  const candidates = [
    { label: 'Generated App Manifest', rel: 'source/.generated-app-manifest.json', category: 'manifest' as const },
    { label: 'Feature Contract Reality', rel: '.aidev/feature-contract-reality.json', category: 'validation' as const },
    { label: 'Workspace Reality Audit', rel: '.aidev/workspace-reality-audit.json', category: 'validation' as const },
    { label: 'Materialization Quality Score', rel: '.aidev/materialization-quality-score.json', category: 'validation' as const },
    { label: 'Feature Contract', rel: '.aidev/feature-contract.json', category: 'manifest' as const },
    { label: 'Build History Links', rel: '.aidev/build-history-links.json', category: 'history' as const },
    { label: 'Export Metadata', rel: '.aidev/export-metadata.json', category: 'manifest' as const },
    { label: 'Project File Index', rel: '.aidev/project-file-index.json', category: 'manifest' as const },
    { label: 'Audit Log', rel: '.aidev/audit-log.json', category: 'trace' as const },
    { label: 'Project Record', rel: 'project.json', category: 'manifest' as const },
  ];

  for (const entry of candidates) {
    const abs = join(ctx.workspaceRootAbs, entry.rel);
    if (existsSync(abs)) {
      shortcuts.push({
        label: entry.label,
        relativePath: entry.rel.replace(/\\/g, '/'),
        category: entry.category,
      });
    }
  }

  return shortcuts;
}
