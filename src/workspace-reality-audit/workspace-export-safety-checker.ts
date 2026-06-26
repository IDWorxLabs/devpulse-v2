/**
 * Workspace Reality Audit V1 — export safety checker.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  AIDEV_EXPORT_METADATA_FILENAME,
  type PersistentProjectExportMetadata,
} from '../persistent-project-reality/persistent-project-reality-types.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';

export function auditExportSafety(input: {
  sourceRoot: string;
  projectRootDir: string;
  manifest: GeneratedAppManifest;
}): {
  dimension: WorkspaceRealityDimensionResult;
  exportSafetyIssues: string[];
} {
  const exportSafetyIssues: string[] = [];
  const failureReasons: string[] = [];
  const warnings: string[] = [];
  const evidencePaths: string[] = [];

  const packageJson = join(input.sourceRoot, 'package.json');
  const srcDir = join(input.sourceRoot, 'src');
  const sourceValid = existsSync(packageJson) && existsSync(srcDir);

  let exportMetadata: PersistentProjectExportMetadata | null = null;
  if (input.manifest.persistentProjectId) {
    const paths = persistentProjectPaths(input.projectRootDir, input.manifest.persistentProjectId);
    const exportPath = join(paths.aidev, AIDEV_EXPORT_METADATA_FILENAME);
    if (existsSync(exportPath)) {
      evidencePaths.push(exportPath.replace(/\\/g, '/'));
      exportMetadata = JSON.parse(readFileSync(exportPath, 'utf8')) as PersistentProjectExportMetadata;
    }
  }

  if (exportMetadata?.exportReady && !sourceValid) {
    exportSafetyIssues.push('exportReady true while source tree invalid');
    failureReasons.push('Export metadata says ready while source tree is invalid');
  }

  const zipUnsafe = ['node_modules', 'dist', '.generated-app-manifest.json'].filter((name) =>
    existsSync(join(input.sourceRoot, name)),
  );
  for (const name of zipUnsafe) {
    exportSafetyIssues.push(`zip-unsafe artifact in source: ${name}`);
    failureReasons.push(`Source tree not zip-safe: ${name} present`);
  }

  if (exportMetadata?.excludedFiles) {
    for (const excluded of exportMetadata.excludedFiles) {
      const rel = excluded.replace(/^source\//, '');
      if (existsSync(join(input.sourceRoot, rel))) {
        warnings.push(`Excluded path still on disk: ${excluded}`);
      }
    }
  }

  let score = 100;
  score -= failureReasons.length * 25;
  score -= warnings.length * 5;

  const status =
    failureReasons.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : sourceValid ? 'PASS' : 'WARN';

  return {
    exportSafetyIssues,
    dimension: {
      readOnly: true,
      id: 'exportSafety',
      label: 'Export Safety',
      status,
      score: Math.max(0, Math.min(100, score)),
      evidencePaths,
      failureReasons,
      warnings,
    },
  };
}
