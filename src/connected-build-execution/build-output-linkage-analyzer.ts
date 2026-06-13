/**
 * Build Output Linkage Analyzer — contract → units → artifacts → files → workspace.
 */

import type {
  BuildManifestAssessment,
  BuildMaterializationAssessment,
  BuildOutputLinkageAnalysis,
  GeneratedFileEvidence,
  WorkspaceMaterializationAssessment,
} from './connected-build-execution-types.js';
import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';

export function analyzeBuildOutputLinkage(input: {
  contract: BuildReadyExecutionContract | null;
  materialization: BuildMaterializationAssessment;
  generatedFileEvidence: GeneratedFileEvidence;
  buildManifest: BuildManifestAssessment;
  workspaceMaterialization: WorkspaceMaterializationAssessment;
}): BuildOutputLinkageAnalysis {
  const missingLinks: string[] = [];

  const contractToBuildUnits =
    input.contract !== null &&
    input.materialization.buildUnits.length === input.contract.buildUnits.length &&
    input.materialization.buildUnits.every((id) =>
      input.contract!.buildUnits.some((u) => u.unitId === id),
    );

  if (!contractToBuildUnits) {
    missingLinks.push('contract→buildUnits: build unit IDs do not match contract');
  }

  const buildUnitsToArtifacts =
    input.materialization.expectedArtifacts.length > 0 &&
    input.materialization.expectedArtifacts.every(
      (a) => input.materialization.buildUnits.includes(a.buildUnitId) || a.buildUnitId.length > 0,
    ) &&
    new Set(input.materialization.expectedArtifacts.map((a) => a.buildUnitId)).size >= 1;

  if (!buildUnitsToArtifacts) {
    missingLinks.push('buildUnits→artifacts: expected artifacts not mapped to build units');
  }

  const artifactsToFiles =
    input.buildManifest.linkedArtifacts.length > 0 &&
    input.buildManifest.missingArtifacts.length === 0 &&
    input.generatedFileEvidence.proofLevel === 'PROVEN';

  if (!artifactsToFiles) {
    if (input.buildManifest.missingArtifacts.length > 0) {
      missingLinks.push(
        `artifacts→files: missing ${input.buildManifest.missingArtifacts.length} artifact file(s)`,
      );
    } else if (input.generatedFileEvidence.fileCount === 0) {
      missingLinks.push('artifacts→files: no generated files observed');
    }
  }

  const filesToWorkspace =
    input.workspaceMaterialization.workspaceExists &&
    input.workspaceMaterialization.artifactCoverage > 0;

  if (!filesToWorkspace) {
    missingLinks.push('files→workspace: workspace missing or has no artifact coverage');
  }

  const linkageConnected =
    contractToBuildUnits && buildUnitsToArtifacts && artifactsToFiles && filesToWorkspace;

  let firstBrokenLink: string | null = null;
  if (!contractToBuildUnits) firstBrokenLink = 'contract→buildUnits';
  else if (!buildUnitsToArtifacts) firstBrokenLink = 'buildUnits→artifacts';
  else if (!artifactsToFiles) firstBrokenLink = 'artifacts→files';
  else if (!filesToWorkspace) firstBrokenLink = 'files→workspace';

  const components = [contractToBuildUnits, buildUnitsToArtifacts, artifactsToFiles, filesToWorkspace];
  const traceabilityScore = Math.round((components.filter(Boolean).length / components.length) * 100);

  return {
    readOnly: true,
    linkageConnected,
    firstBrokenLink,
    missingLinks,
    traceabilityScore,
    contractToBuildUnits,
    buildUnitsToArtifacts,
    artifactsToFiles,
    filesToWorkspace,
  };
}
