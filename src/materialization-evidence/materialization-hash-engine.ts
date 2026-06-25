/**
 * Materialization hash fingerprints — immutable build identity.
 */

import { createHash } from 'node:crypto';
import type { GeneratedFileInventoryEntry } from './materialization-evidence-types.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';

export function computeWorkspaceHash(files: GeneratedFileInventoryEntry[]): string {
  const payload = files
    .map((file) => `${file.path}:${file.size}:${file.hash}`)
    .sort()
    .join('\n');
  return createHash('sha256').update(payload).digest('hex');
}

export function computeManifestHash(manifestForHash: Record<string, unknown>): string {
  const clone = { ...manifestForHash };
  delete clone.workspaceHash;
  delete clone.manifestHash;
  delete clone.materializationHash;
  return createHash('sha256').update(JSON.stringify(clone)).digest('hex');
}

export function computeMaterializationHash(input: {
  buildRunId: string;
  projectId: string;
  selectedProfile: string;
  generatedFilesCount: number;
  totalLinesGenerated: number;
  workspaceHash: string;
  validationStatus: string;
}): string {
  return createHash('sha256')
    .update(
      [
        input.buildRunId,
        input.projectId,
        input.selectedProfile,
        String(input.generatedFilesCount),
        String(input.totalLinesGenerated),
        input.workspaceHash,
        input.validationStatus,
      ].join('|'),
    )
    .digest('hex');
}

export function attachManifestHashes(
  manifest: GeneratedAppManifest,
  files: GeneratedFileInventoryEntry[],
): GeneratedAppManifest {
  const workspaceHash = computeWorkspaceHash(files);
  const manifestHash = computeManifestHash(manifest as unknown as Record<string, unknown>);
  const materializationHash = computeMaterializationHash({
    buildRunId: manifest.buildRunId,
    projectId: manifest.projectId,
    selectedProfile: String(manifest.selectedProfile),
    generatedFilesCount: manifest.generatedFilesCount,
    totalLinesGenerated: manifest.totalLinesGenerated,
    workspaceHash,
    validationStatus: manifest.validationStatus,
  });

  return {
    ...manifest,
    workspaceHash,
    manifestHash,
    materializationHash,
  };
}
