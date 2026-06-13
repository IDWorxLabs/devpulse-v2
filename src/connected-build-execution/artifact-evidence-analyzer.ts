/**
 * Artifact Evidence Analyzer — prove whether artifacts exist on disk.
 */

import type {
  ArtifactEvidenceAssessment,
  ArtifactEvidenceLevel,
  BuildManifestAssessment,
  GeneratedFileEvidence,
  WorkspaceMaterializationAssessment,
} from './connected-build-execution-types.js';

export function analyzeArtifactEvidence(input: {
  generatedFileEvidence: GeneratedFileEvidence;
  buildManifest: BuildManifestAssessment;
  workspaceMaterialization: WorkspaceMaterializationAssessment;
}): ArtifactEvidenceAssessment {
  const filesObserved = input.generatedFileEvidence.fileCount;
  const directoriesObserved = input.workspaceMaterialization.workspaceExists ? 1 : 0;
  const buildManifestObserved = input.buildManifest.manifestExists;
  const workspaceEvidenceObserved = input.workspaceMaterialization.workspaceExists;

  let artifactEvidenceLevel: ArtifactEvidenceLevel = 'NOT_PROVEN';
  if (
    filesObserved > 0 &&
    workspaceEvidenceObserved &&
    input.generatedFileEvidence.proofLevel === 'PROVEN' &&
    input.buildManifest.traceabilityScore >= 90
  ) {
    artifactEvidenceLevel = 'PROVEN';
  } else if (filesObserved > 0 || buildManifestObserved || workspaceEvidenceObserved) {
    artifactEvidenceLevel = 'PARTIAL';
  }

  let evidenceSummary = 'No artifact evidence observed on disk.';
  if (artifactEvidenceLevel === 'PROVEN') {
    evidenceSummary = `${filesObserved} file(s) observed with manifest and workspace evidence.`;
  } else if (artifactEvidenceLevel === 'PARTIAL') {
    evidenceSummary = `Partial evidence: ${filesObserved} file(s), workspace=${workspaceEvidenceObserved}, manifest=${buildManifestObserved}.`;
  }

  return {
    readOnly: true,
    artifactEvidenceLevel,
    filesObserved,
    directoriesObserved,
    buildManifestObserved,
    workspaceEvidenceObserved,
    evidenceSummary,
  };
}
