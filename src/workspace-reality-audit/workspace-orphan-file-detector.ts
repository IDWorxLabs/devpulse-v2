/**
 * Workspace Reality Audit V1 — orphan file and temp artifact leakage detector.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';
import { parseFeatureRegistry } from './workspace-route-graph-checker.js';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);
const TEMP_ARTIFACTS = [
  '.generated-app-manifest.json',
  '.materialization-quality-score.json',
  '.feature-contract-reality.json',
  '.workspace-reality-audit.json',
  '.production-validation-evidence.json',
];
const LEGACY_MARKERS = ['DomainAppFeature', 'TaskTrackerFeature.tsx'];

export function auditOrphanAndLeakage(sourceRoot: string): {
  dimension: WorkspaceRealityDimensionResult;
  orphanFiles: string[];
  temporaryArtifactLeaks: string[];
} {
  const orphanFiles: string[] = [];
  const temporaryArtifactLeaks: string[] = [];
  const failureReasons: string[] = [];
  const warnings: string[] = [];
  const evidencePaths: string[] = [sourceRoot.replace(/\\/g, '/')];

  for (const artifact of TEMP_ARTIFACTS) {
    const path = join(sourceRoot, artifact);
    if (existsSync(path)) {
      temporaryArtifactLeaks.push(artifact);
      failureReasons.push(`Temporary artifact leaked into source: ${artifact}`);
    }
  }

  if (existsSync(join(sourceRoot, 'node_modules'))) {
    temporaryArtifactLeaks.push('node_modules');
    failureReasons.push('node_modules present in persistent source');
  }
  if (existsSync(join(sourceRoot, 'dist'))) {
    temporaryArtifactLeaks.push('dist');
    failureReasons.push('dist present in persistent source');
  }
  if (sourceRoot.includes('.generated-build-history')) {
    temporaryArtifactLeaks.push('.generated-build-history');
    failureReasons.push('build history folder inside source');
  }

  const appShell = join(sourceRoot, 'src/blueprint/AppShell.tsx');
  if (existsSync(appShell)) {
    const shell = readFileSync(appShell, 'utf8');
    for (const marker of LEGACY_MARKERS) {
      if (shell.includes(marker) && shell.includes('DomainAppFeature') && !shell.includes('FeatureAppRouter')) {
        failureReasons.push(`Legacy primary renderer detected: ${marker}`);
        orphanFiles.push(`legacy-renderer:${marker}`);
      }
    }
  }

  const registryPath = join(sourceRoot, 'src/features/registry.ts');
  const knownPaths = new Set<string>([
    'src/main.tsx',
    'src/App.tsx',
    'src/features/registry.ts',
    'src/features/routes.ts',
    'src/features/FeatureAppRouter.tsx',
  ]);

  if (existsSync(registryPath)) {
    for (const entry of parseFeatureRegistry(readFileSync(registryPath, 'utf8'))) {
      knownPaths.add(entry.sourcePath.replace(/\\/g, '/'));
      knownPaths.add(`src/features/${entry.id}`);
    }
  }

  const allFiles: string[] = [];
  walk(join(sourceRoot, 'src'), allFiles);
  for (const file of allFiles) {
    const rel = file.replace(sourceRoot, '').replace(/\\/g, '/').replace(/^\//, '');
    const referenced = [...knownPaths].some(
      (known) => rel === known || rel.startsWith(`${known}/`) || known.startsWith(rel),
    );
    if (!referenced && rel.includes('src/features/') && rel.endsWith('.tsx')) {
      const inRegistry = existsSync(registryPath) && readFileSync(registryPath, 'utf8').includes(rel);
      if (!inRegistry) {
        orphanFiles.push(rel);
      }
    }
  }

  if (orphanFiles.length > 0) {
    warnings.push(`${orphanFiles.length} potential orphan feature files`);
  }

  const status =
    temporaryArtifactLeaks.length > 0 || failureReasons.some((r) => r.includes('Legacy'))
      ? 'FAIL'
      : orphanFiles.length > 0
        ? 'WARN'
        : 'PASS';
  const score =
    status === 'FAIL' ? Math.max(0, 40 - temporaryArtifactLeaks.length * 10) : orphanFiles.length > 0 ? 80 : 100;

  return {
    orphanFiles,
    temporaryArtifactLeaks,
    dimension: {
      readOnly: true,
      id: 'orphanLeakage',
      label: 'Orphan / Leakage Detection',
      status,
      score,
      evidencePaths,
      failureReasons,
      warnings,
    },
  };
}

function walk(dir: string, files: string[]): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
}
