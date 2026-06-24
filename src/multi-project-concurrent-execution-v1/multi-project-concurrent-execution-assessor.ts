/**
 * Multi-Project Concurrent Execution V1 — full assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetWorld2RegistryForTests } from '../world2-real-instantiation-v1/world2-registry.js';
import type { MultiProjectConcurrentExecutionAssessment } from './multi-project-concurrent-execution-v1-types.js';
import {
  MIN_CONCURRENT_PASS_RATE,
  MIN_CONCURRENT_PROJECTS_PROOF,
  MIN_CONCURRENT_WORLD2_EXECUTIONS,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_FAIL_TOKEN,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN,
} from './multi-project-concurrent-execution-v1-bounds.js';
import { runConcurrentExecutionCoordinator } from './concurrent-execution-coordinator.js';
import {
  getConcurrentExecutionQueueSnapshot,
  resetConcurrentExecutionQueueForTests,
} from './concurrent-execution-queue.js';
import { allocateResourcesForConcurrentBatch } from './resource-allocation-manager.js';
import { assessConcurrentContamination } from './concurrent-contamination-assessor.js';
import { classifyConcurrentFailures } from './concurrent-failure-classifier.js';
import { buildConcurrentBuildProof } from './concurrent-build-proof.js';
import { assessConcurrentVerification } from './concurrent-verification-assessment.js';
import { enforceConcurrentEvolutionBoundary } from './concurrent-evolution-boundary.js';
import { writeMultiProjectConcurrentExecutionArtifacts } from './multi-project-concurrent-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

function resolveConcurrentProofStatus(input: {
  concurrentProjectsProven: number;
  concurrentPassRate: number;
  contaminationIncidents: number;
  concurrentWorld2Executions: number;
  peakConcurrentActive: number;
}): MultiProjectConcurrentExecutionAssessment['concurrentProofStatus'] {
  const proven =
    input.concurrentProjectsProven >= MIN_CONCURRENT_PROJECTS_PROOF &&
    input.concurrentPassRate >= MIN_CONCURRENT_PASS_RATE &&
    input.contaminationIncidents === 0 &&
    input.concurrentWorld2Executions >= MIN_CONCURRENT_WORLD2_EXECUTIONS &&
    input.peakConcurrentActive >= MIN_CONCURRENT_PROJECTS_PROOF;

  if (proven) return 'PROVEN';
  if (input.concurrentProjectsProven > 0) return 'PARTIAL';
  return 'NOT_PROVEN';
}

function resolvePassToken(
  status: MultiProjectConcurrentExecutionAssessment['concurrentProofStatus'],
): string {
  return status === 'PROVEN'
    ? MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN
    : MULTI_PROJECT_CONCURRENT_EXECUTION_V1_FAIL_TOKEN;
}

export function runMultiProjectConcurrentExecutionV1(input?: {
  projectRootDir?: string;
  resetRegistry?: boolean;
  resetQueue?: boolean;
}): MultiProjectConcurrentExecutionAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;

  if (input?.resetRegistry !== false) {
    resetWorld2RegistryForTests();
  }
  if (input?.resetQueue !== false) {
    resetConcurrentExecutionQueueForTests(projectRootDir);
  }

  const { projectResults, world2ConcurrentResults, peakConcurrentActive } =
    runConcurrentExecutionCoordinator({ projectRootDir });

  const queueSnapshot = getConcurrentExecutionQueueSnapshot(projectRootDir);
  const resourceAllocation = allocateResourcesForConcurrentBatch(queueSnapshot.jobs);
  const contaminationAssessment = assessConcurrentContamination({
    projectResults,
    queueSnapshot,
  });
  const buildProof = buildConcurrentBuildProof(projectResults);
  const verificationAssessment = assessConcurrentVerification(projectResults);
  const failureClassification = classifyConcurrentFailures(projectResults);
  const evolutionBoundary = enforceConcurrentEvolutionBoundary();

  const concurrentProjectsProven = projectResults.filter((r) => r.passed).length;
  const concurrentPassRate = verificationAssessment.concurrentPassRate;
  const contaminationIncidents = contaminationAssessment.contaminationIncidents;
  const concurrentWorld2Executions = world2ConcurrentResults.filter((r) => r.passed).length;

  const concurrentProofStatus = resolveConcurrentProofStatus({
    concurrentProjectsProven,
    concurrentPassRate,
    contaminationIncidents,
    concurrentWorld2Executions,
    peakConcurrentActive,
  });

  const assessment: MultiProjectConcurrentExecutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Multi-Project Concurrent Execution V1',
    passToken: resolvePassToken(concurrentProofStatus),
    version: 'V1',
    generatedAt: new Date().toISOString(),
    concurrentProjectsProven,
    concurrentPassRate,
    contaminationIncidents,
    concurrentWorld2Executions,
    concurrentProofStatus,
    queueSnapshot,
    resourceAllocation,
    contaminationAssessment,
    buildProof,
    verificationAssessment,
    failureClassification,
    world2ConcurrentResults,
    projectResults,
    evolutionBoundary,
  };

  writeMultiProjectConcurrentExecutionArtifacts(projectRootDir, assessment);
  return assessment;
}
