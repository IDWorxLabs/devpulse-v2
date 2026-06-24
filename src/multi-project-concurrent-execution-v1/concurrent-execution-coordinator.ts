/**
 * Multi-Project Concurrent Execution V1 — concurrent execution coordinator.
 */

import { resolveRealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import {
  createWorld2Instance,
  executeWorld2Instance,
} from '../world2-real-instantiation-v1/world2-instance-lifecycle.js';
import { loadWorld2RegistryFromDisk } from '../world2-real-instantiation-v1/world2-registry.js';
import type {
  ConcurrentProjectResult,
  World2ConcurrentResult,
} from './multi-project-concurrent-execution-v1-types.js';
import {
  CONCURRENT_EXECUTION_MODES,
  CONCURRENT_EXECUTION_SUITE_PROFILES,
} from './multi-project-concurrent-execution-v1-bounds.js';
import {
  activateConcurrentProject,
  buildConcurrentExecutionJob,
  completeConcurrentProject,
  enqueueConcurrentProject,
} from './concurrent-execution-queue.js';

export function runConcurrentExecutionCoordinator(input: {
  projectRootDir: string;
  profiles?: readonly string[];
}): {
  projectResults: ConcurrentProjectResult[];
  world2ConcurrentResults: World2ConcurrentResult[];
  peakConcurrentActive: number;
} {
  const profiles = input.profiles ?? CONCURRENT_EXECUTION_SUITE_PROFILES;
  loadWorld2RegistryFromDisk(input.projectRootDir);

  const instances = profiles.map((profile, index) =>
    createWorld2Instance({
      projectRootDir: input.projectRootDir,
      profile,
      executionMode: CONCURRENT_EXECUTION_MODES[index] ?? 'CLOUD_SIMULATED',
      instantiatedBy: 'multi-project-concurrent-execution-v1',
    }),
  );

  const worldIds = instances.map((w) => w.worldId);
  const queuedJobs = instances.map((instance) => {
    const suite = resolveRealBuildSuiteEntry(instance.profile);
    const job = buildConcurrentExecutionJob({
      jobId: instance.worldId,
      projectId: `mpce-${suite.profile.toLowerCase()}`,
      profile: suite.profile,
      productName: suite.productName,
      worldId: instance.worldId,
    });
    return enqueueConcurrentProject(input.projectRootDir, job);
  });

  const activatedJobs = queuedJobs.map((job, index) =>
    activateConcurrentProject(
      input.projectRootDir,
      job.jobId,
      `mpce-worker-${index + 1}`,
    ),
  );
  const peakConcurrentActive = activatedJobs.filter(Boolean).length;

  const executed = instances.map((instance) =>
    executeWorld2Instance({
      projectRootDir: input.projectRootDir,
      worldId: instance.worldId,
      otherWorldIds: worldIds.filter((id) => id !== instance.worldId),
    }),
  );

  executed.forEach((world, index) => {
    const job = queuedJobs[index];
    if (job) {
      completeConcurrentProject(
        input.projectRootDir,
        job.jobId,
        world.executionResult?.passed === true,
      );
    }
  });

  const projectResults: ConcurrentProjectResult[] = executed.map((world) => ({
    readOnly: true,
    projectId: `mpce-${world.profile.toLowerCase()}`,
    profile: world.profile,
    productName: world.productName,
    worldId: world.worldId,
    passed: world.executionResult?.passed === true,
    buildProof: world.executionResult?.buildProof === true,
    previewProof: world.executionResult?.previewProof === true,
    verificationProof:
      world.executionResult?.verificationProof === true ||
      (world.executionResult?.buildProof === true &&
        world.executionResult?.previewProof === true),
    productionReadinessScore: world.executionResult?.productionReadinessScore ?? null,
    contaminationCheckPassed: world.executionResult?.contaminationCheckPassed !== false,
    executionResult: world.executionResult,
    world,
  }));

  const world2ConcurrentResults: World2ConcurrentResult[] = projectResults.map((r) => ({
    readOnly: true,
    worldId: r.worldId,
    profile: r.profile,
    productName: r.productName,
    passed: r.passed,
    isolationPassed: r.contaminationCheckPassed,
  }));

  return { projectResults, world2ConcurrentResults, peakConcurrentActive };
}
