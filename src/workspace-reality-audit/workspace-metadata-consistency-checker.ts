/**
 * Workspace Reality Audit V1 — metadata consistency checker.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import {
  AIDEV_EXPORT_METADATA_FILENAME,
  AIDEV_FEATURE_CONTRACT_REALITY_FILENAME,
  AIDEV_MANIFEST_FILENAME,
  AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME,
  AIDEV_PROJECT_FILE_INDEX_FILENAME,
} from '../persistent-project-reality/persistent-project-reality-types.js';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';

export function auditMetadataConsistency(input: {
  projectRootDir: string;
  manifest: GeneratedAppManifest;
}): {
  dimension: WorkspaceRealityDimensionResult;
  staleMetadata: string[];
} {
  const staleMetadata: string[] = [];
  const failureReasons: string[] = [];
  const warnings: string[] = [];
  const evidencePaths: string[] = [];

  if (!input.manifest.persistentProjectId || input.manifest.promotionStatus !== 'PASS') {
    return {
      staleMetadata,
      dimension: {
        readOnly: true,
        id: 'metadataConsistency',
        label: 'Metadata Consistency',
        status: 'WARN',
        score: 50,
        evidencePaths,
        failureReasons: [],
        warnings: ['Persistent project not promoted — metadata audit partial'],
      },
    };
  }

  const paths = persistentProjectPaths(input.projectRootDir, input.manifest.persistentProjectId);
  const required = [
    { path: paths.manifest, label: AIDEV_MANIFEST_FILENAME },
    { path: paths.projectFileIndex, label: AIDEV_PROJECT_FILE_INDEX_FILENAME },
    { path: paths.exportMetadata, label: AIDEV_EXPORT_METADATA_FILENAME },
    { path: paths.featureContractReality, label: AIDEV_FEATURE_CONTRACT_REALITY_FILENAME },
    { path: paths.projectJson, label: 'project.json' },
  ];

  const optional = [
    { path: paths.materializationQualityScore, label: AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME },
  ];

  let present = 0;
  for (const item of required) {
    if (existsSync(item.path)) {
      present += 1;
      evidencePaths.push(item.path.replace(/\\/g, '/'));
    } else {
      staleMetadata.push(item.label);
      failureReasons.push(`Missing metadata artifact: ${item.label}`);
    }
  }

  for (const item of optional) {
    if (!existsSync(item.path)) {
      warnings.push(`Optional metadata not yet recorded: ${item.label}`);
    } else {
      evidencePaths.push(item.path.replace(/\\/g, '/'));
    }
  }

  if (existsSync(paths.projectFileIndex)) {
    const index = JSON.parse(readFileSync(paths.projectFileIndex, 'utf8')) as {
      sourceFiles: Array<{ relativePath: string }>;
      fileHashes: Record<string, string>;
    };
    const sample = index.sourceFiles[0];
    if (sample) {
      const diskPath = join(paths.source, sample.relativePath.replace(/^source\//, ''));
      if (!existsSync(diskPath)) {
        staleMetadata.push('project-file-index mismatch');
        failureReasons.push('Project file index does not match disk');
      }
    }
    if (Object.keys(index.fileHashes).length === 0) {
      failureReasons.push('Project file index has no file hashes');
    }
  }

  if (input.manifest.buildHistoryRecordPath) {
    const historyPath = join(input.projectRootDir, input.manifest.buildHistoryRecordPath);
    if (!existsSync(historyPath)) {
      staleMetadata.push('build-history-record');
      failureReasons.push('Manifest build history link missing on disk');
    }
  }

  const score = Math.round((present / required.length) * 100);
  return {
    staleMetadata,
    dimension: {
      readOnly: true,
      id: 'metadataConsistency',
      label: 'Metadata Consistency',
      status: failureReasons.length > 0 ? 'FAIL' : 'PASS',
      score,
      evidencePaths,
      failureReasons,
      warnings,
    },
  };
}
