/**
 * Founder Test integration — assess completed materialization manifest.
 */

import {
  isManifestEvidenceComplete,
  listManifestPlaceholderFields,
  type GeneratedAppManifest,
} from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { readCompletedGeneratedAppManifest } from './materialization-evidence-completer.js';
import type { FounderTestMaterializationEvidenceAssessment } from './materialization-evidence-types.js';

export function assessFounderTestMaterializationEvidence(input: {
  workspaceDir: string;
}): FounderTestMaterializationEvidenceAssessment {
  const manifest = readCompletedGeneratedAppManifest(input.workspaceDir);
  if (!manifest) {
    return {
      readOnly: true,
      manifestPresent: false,
      manifestComplete: false,
      generatedFilesCount: 0,
      generatedRoutesCount: 0,
      generatedFeatureModulesCount: 0,
      totalLinesGenerated: 0,
      workspaceSizeBytes: 0,
      workspaceHash: null,
      materializationHash: null,
      validationStatus: null,
      timingEvidencePresent: false,
      placeholderFieldsRemaining: ['manifest'],
    };
  }

  return buildFounderTestAssessment(manifest);
}

export function buildFounderTestAssessment(
  manifest: GeneratedAppManifest,
): FounderTestMaterializationEvidenceAssessment {
  const timingEvidencePresent =
    manifest.planningDurationMs > 0 ||
    manifest.materializationDurationMs > 0 ||
    manifest.npmInstallDurationMs > 0 ||
    manifest.npmBuildDurationMs > 0 ||
    manifest.previewDurationMs > 0 ||
    manifest.validationDurationMs > 0;

  return {
    readOnly: true,
    manifestPresent: true,
    manifestComplete: isManifestEvidenceComplete(manifest),
    generatedFilesCount: manifest.generatedFilesCount,
    generatedRoutesCount: manifest.generatedRoutesCount,
    generatedFeatureModulesCount: manifest.generatedFeatureModulesCount,
    totalLinesGenerated: manifest.totalLinesGenerated,
    workspaceSizeBytes: manifest.workspaceSizeBytes,
    workspaceHash: manifest.workspaceHash || null,
    materializationHash: manifest.materializationHash || null,
    validationStatus: manifest.validationStatus,
    timingEvidencePresent,
    placeholderFieldsRemaining: listManifestPlaceholderFields(manifest),
  };
}
