/**
 * Workspace Materialization Analyzer — verify workspace exists with valid structure.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type {
  BuildMaterializationAssessment,
  GeneratedFileEvidence,
  WorkspaceMaterializationAssessment,
} from './connected-build-execution-types.js';

const STRUCTURE_MARKERS = ['src', 'package.json', 'README.md', 'verification', 'build-manifest.json'];

export function analyzeWorkspaceMaterialization(input: {
  rootDir: string;
  materialization: BuildMaterializationAssessment;
  generatedFileEvidence: GeneratedFileEvidence;
}): WorkspaceMaterializationAssessment {
  const workspacePath = input.materialization.workspaceTargets[0] ?? null;
  const absWorkspace = workspacePath ? join(input.rootDir, workspacePath) : null;
  const pathsUnderWorkspace =
    workspacePath !== null &&
    input.generatedFileEvidence.generatedPaths.some(
      (p) => p === workspacePath || p.startsWith(`${workspacePath}/`),
    );
  const workspaceExists = absWorkspace
    ? existsSync(absWorkspace) || pathsUnderWorkspace
    : pathsUnderWorkspace;

  const missingAreas: string[] = [];
  let structureMarkersFound = 0;

  if (!workspaceExists) {
    missingAreas.push(`Workspace directory missing: ${workspacePath ?? 'unknown'}`);
  } else {
    const entries =
      absWorkspace && existsSync(absWorkspace) ? readdirSync(absWorkspace) : [];
    for (const marker of STRUCTURE_MARKERS) {
      const found =
        entries.includes(marker) ||
        input.generatedFileEvidence.generatedPaths.some(
          (p) => p.includes(`/${marker}`) || p.endsWith(marker),
        );
      if (found) structureMarkersFound += 1;
      else if (marker === 'src' || marker === 'package.json') {
        missingAreas.push(`Missing workspace marker: ${marker}`);
      }
    }
  }

  const workspaceStructureValid =
    workspaceExists && structureMarkersFound >= 2 && input.generatedFileEvidence.fileCount > 0;

  const artifactCoverage =
    input.materialization.expectedArtifacts.length === 0
      ? 0
      : Math.round(
          (input.generatedFileEvidence.generatedPaths.length /
            input.materialization.expectedArtifacts.length) *
            100,
        );

  return {
    readOnly: true,
    workspaceExists,
    workspaceStructureValid,
    artifactCoverage,
    missingAreas,
    workspacePath,
  };
}
