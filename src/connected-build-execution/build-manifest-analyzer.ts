/**
 * Build Manifest Analyzer — verify generated artifacts connect to build-ready contract.
 */

import type {
  BuildManifestAssessment,
  ExpectedArtifactEntry,
  GeneratedFileEvidence,
} from './connected-build-execution-types.js';
import { listOrphanPaths } from './generated-file-analyzer.js';
import type { ObservedFileEvidence } from './connected-build-execution-types.js';

export function analyzeBuildManifest(input: {
  expectedArtifacts: ExpectedArtifactEntry[];
  generatedFileEvidence: GeneratedFileEvidence;
  observed: ObservedFileEvidence;
  workspacePrefix: string;
}): BuildManifestAssessment {
  const generatedSet = new Set(input.generatedFileEvidence.generatedPaths);
  const linkedArtifacts = input.expectedArtifacts.filter((a) =>
    generatedSet.has(a.expectedPath),
  );
  const missingArtifacts = input.expectedArtifacts
    .filter((a) => !generatedSet.has(a.expectedPath))
    .map((a) => `${a.artifactId} → ${a.expectedPath}`);

  const orphanArtifacts = listOrphanPaths({
    expectedPaths: input.expectedArtifacts.map((a) => a.expectedPath),
    observed: input.observed,
    workspacePrefix: input.workspacePrefix,
  });

  const manifestExists = generatedSet.has(
    input.expectedArtifacts.find((a) => a.artifactId.endsWith('-manifest'))?.expectedPath ?? '',
  );

  const traceabilityScore =
    input.expectedArtifacts.length === 0
      ? 0
      : Math.round((linkedArtifacts.length / input.expectedArtifacts.length) * 100);

  return {
    readOnly: true,
    manifestExists,
    linkedArtifacts,
    orphanArtifacts,
    missingArtifacts,
    traceabilityScore,
  };
}
