/**
 * Multi-Project Concurrent Execution V1 — contamination assessment.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ConcurrentContaminationAssessment,
  ConcurrentProjectResult,
  ConcurrentQueueSnapshot,
} from './multi-project-concurrent-execution-v1-types.js';

export function assessConcurrentContamination(input: {
  projectResults: readonly ConcurrentProjectResult[];
  queueSnapshot: ConcurrentQueueSnapshot;
}): ConcurrentContaminationAssessment {
  const violations: string[] = [];
  let contaminationIncidents = 0;

  const workspacePaths = input.projectResults.map((r) => r.world.workspacePath);
  const artifactDirs = input.projectResults.map((r) => r.world.artifactDirectory);
  const jobIds = input.projectResults.map((r) => r.worldId);

  const workspaceOverlap =
    workspacePaths.length !== new Set(workspacePaths).size ||
    !workspacePaths.every((p) => p.includes('w2-'));
  if (workspaceOverlap) {
    violations.push('Workspace overlap detected across concurrent projects');
    contaminationIncidents += 1;
  }

  const artifactOverwrite = artifactDirs.length !== new Set(artifactDirs).size;
  if (artifactOverwrite) {
    violations.push('Artifact directory collision across concurrent projects');
    contaminationIncidents += 1;
  }

  let sharedBuildOutput = false;
  for (const result of input.projectResults) {
    const markerPath = join(result.world.workspacePath, '.w2-isolation-marker');
    if (!existsSync(markerPath)) {
      sharedBuildOutput = true;
      violations.push(`Missing isolation marker for ${result.projectId}`);
      contaminationIncidents += 1;
    } else {
      const marker = readFileSync(markerPath, 'utf8').trim();
      if (marker !== result.worldId) {
        sharedBuildOutput = true;
        contaminationIncidents += 1;
        violations.push(`Isolation marker mismatch for ${result.projectId}`);
      }
    }
  }

  let crossProjectProofLeakage = false;
  for (let i = 0; i < input.projectResults.length; i++) {
    for (let j = i + 1; j < input.projectResults.length; j++) {
      const a = input.projectResults[i]!;
      const b = input.projectResults[j]!;
      if (a.profile === b.profile && a.worldId !== b.worldId && a.passed && b.passed) {
        const markerA = join(a.world.workspacePath, '.w2-isolation-marker');
        const markerB = join(b.world.workspacePath, '.w2-isolation-marker');
        if (existsSync(markerA) && existsSync(markerB)) {
          const valA = readFileSync(markerA, 'utf8').trim();
          const valB = readFileSync(markerB, 'utf8').trim();
          if (valA === valB) {
            crossProjectProofLeakage = true;
            contaminationIncidents += 1;
            violations.push(`Cross-project proof leakage: ${a.projectId} ↔ ${b.projectId}`);
          }
        }
      }
    }
  }

  const queueCorruption =
    input.queueSnapshot.jobs.length > 0 &&
    input.queueSnapshot.jobs.filter((j) => jobIds.includes(j.jobId)).length !== jobIds.length;
  if (queueCorruption) {
    violations.push('Queue state does not match concurrent project jobs');
    contaminationIncidents += 1;
  }

  const authorityContamination = input.projectResults.some(
    (r) => r.contaminationCheckPassed === false,
  );
  if (authorityContamination) {
    contaminationIncidents += input.projectResults.filter((r) => !r.contaminationCheckPassed).length;
    violations.push('Cloud execution contamination check failed for one or more projects');
  }

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    workspaceOverlap,
    artifactOverwrite,
    sharedBuildOutput,
    crossProjectProofLeakage,
    queueCorruption,
    authorityContamination,
    contaminationIncidents,
    violations,
    passed: contaminationIncidents === 0,
  };
}
