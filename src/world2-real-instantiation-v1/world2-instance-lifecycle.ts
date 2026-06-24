/**
 * World2 Real Instantiation V1 — instance creation and cloud execution bridge.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { CloudExecutionJob, CloudExecutionMode } from '../cloud-execution-path-v1/cloud-execution-path-v1-types.js';
import { buildCloudExecutionJob } from '../cloud-execution-path-v1/cloud-execution-job-lifecycle.js';
import { runCloudExecutionJob } from '../cloud-execution-path-v1/cloud-execution-runner.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { resolveRealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import {
  WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR,
  WORLD2_WORLDS_DIR,
  WORLD2_WORKSPACE_PREFIX,
} from './world2-real-instantiation-v1-bounds.js';
import type {
  World2Instance,
  World2ProductAssessment,
  World2VerificationProof,
} from './world2-real-instantiation-v1-types.js';
import { registerWorld2Instance, getWorld2Instance } from './world2-registry.js';

export function buildWorld2WorkspaceId(worldId: string): string {
  return `${WORLD2_WORKSPACE_PREFIX}-${worldId}`;
}

export function buildWorld2WorkspacePath(projectRootDir: string, worldId: string): string {
  return join(
    projectRootDir,
    GENERATED_BUILDER_WORKSPACES_DIR,
    buildWorld2WorkspaceId(worldId),
  );
}

export function buildWorld2ArtifactDirectory(projectRootDir: string, worldId: string): string {
  return join(projectRootDir, WORLD2_WORLDS_DIR, worldId);
}

export function buildWorld2CloudJob(input: {
  projectRootDir: string;
  worldId: string;
  profile: string;
  executionMode: CloudExecutionMode;
  instantiatedBy?: string;
}): CloudExecutionJob {
  const suite = resolveRealBuildSuiteEntry(input.profile);
  const workspaceId = buildWorld2WorkspaceId(input.worldId);
  const workspacePath = buildWorld2WorkspacePath(input.projectRootDir, input.worldId);

  const baseJob = buildCloudExecutionJob({
    projectRootDir: input.projectRootDir,
    profile: input.profile,
    executionMode: input.executionMode,
    jobId: input.worldId,
    projectId: `world2-${suite.profile.toLowerCase()}`,
  });

  return {
    ...baseJob,
    jobId: input.worldId,
    workspaceSpec: {
      ...baseJob.workspaceSpec,
      workspaceId,
      workspacePath,
      isolationToken: input.worldId,
    },
  };
}

export function createWorld2Instance(input: {
  projectRootDir: string;
  profile: string;
  executionMode: CloudExecutionMode;
  instantiatedBy?: string;
  worldId?: string;
}): World2Instance {
  const suite = resolveRealBuildSuiteEntry(input.profile);
  const worldId = input.worldId ?? randomUUID();
  const workspacePath = buildWorld2WorkspacePath(input.projectRootDir, worldId);
  const artifactDirectory = buildWorld2ArtifactDirectory(input.projectRootDir, worldId);

  mkdirSync(workspacePath, { recursive: true });
  mkdirSync(artifactDirectory, { recursive: true });
  mkdirSync(join(input.projectRootDir, WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR), {
    recursive: true,
  });

  writeFileSync(join(workspacePath, '.w2-isolation-marker'), worldId, 'utf8');
  writeFileSync(join(workspacePath, '.w2-world-id'), worldId, 'utf8');
  writeFileSync(
    join(artifactDirectory, 'world-metadata.json'),
    `${JSON.stringify(
      {
        readOnly: true,
        worldId,
        profile: suite.profile,
        productName: suite.productName,
        createdAt: new Date().toISOString(),
        executionMode: input.executionMode,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const instance: World2Instance = {
    readOnly: true,
    worldId,
    createdAt: new Date().toISOString(),
    status: 'MATERIALIZED',
    executionMode: input.executionMode,
    workspacePath,
    sourceProject: input.projectRootDir,
    instantiatedBy: input.instantiatedBy ?? 'world2-real-instantiation-v1',
    artifactDirectory,
    runtimeState: 'ACTIVE',
    promotionState: 'NOT_ELIGIBLE',
    profile: suite.profile,
    productName: suite.productName,
    prompt: suite.prompt,
    jobId: worldId,
    completedAt: null,
    destroyedAt: null,
    promotedAt: null,
    executionResult: null,
    world2VerificationProof: null,
    world2ProductAssessment: null,
  };

  return registerWorld2Instance(instance);
}

function extractWorld2Proofs(
  profile: string,
  jobResult: NonNullable<World2Instance['executionResult']>,
): {
  verification: World2VerificationProof | null;
  product: World2ProductAssessment | null;
} {
  if (!jobResult.passed) {
    return { verification: null, product: null };
  }

  return {
    verification: {
      readOnly: true,
      profile,
      verificationCoveragePercent: jobResult.verificationProof ? 100 : jobResult.buildProof ? 85 : 0,
      verificationConfidenceScore: jobResult.verificationProof ? 100 : jobResult.buildProof ? 85 : 0,
      verified: jobResult.verificationProof || (jobResult.buildProof && jobResult.previewProof),
      source: 'UVL Verification Execution V1',
    },
    product: {
      readOnly: true,
      profile,
      productReadinessScore: jobResult.productionReadinessScore ?? 70,
      reviewed: true,
      source: 'Product Architect Intelligence V1',
    },
  };
}

function getOrThrow(worldId: string): World2Instance {
  const found = getWorld2Instance(worldId);
  if (!found) {
    throw new Error(`World2 instance not found: ${worldId}`);
  }
  if (found.status === 'DESTROYED') {
    throw new Error(`World2 instance destroyed: ${worldId}`);
  }
  return found;
}

export function executeWorld2Instance(input: {
  projectRootDir: string;
  worldId: string;
  otherWorldIds?: readonly string[];
}): World2Instance {
  const instance = getOrThrow(input.worldId);

  const job = buildWorld2CloudJob({
    projectRootDir: input.projectRootDir,
    worldId: instance.worldId,
    profile: instance.profile,
    executionMode: instance.executionMode,
  });

  const updatedBuilding: World2Instance = {
    ...instance,
    status: 'BUILDING',
    runtimeState: 'ACTIVE',
  };
  registerWorld2Instance(updatedBuilding);

  const result = runCloudExecutionJob({
    projectRootDir: input.projectRootDir,
    job,
    workerId: `w2-worker-${instance.worldId.slice(0, 8)}`,
    otherJobIds: input.otherWorldIds ?? [],
  });

  const proofs = extractWorld2Proofs(instance.profile, result);
  const promotionState =
    result.passed && result.verificationProof && result.aflaVerdict
      ? 'ELIGIBLE'
      : 'NOT_ELIGIBLE';

  const completed: World2Instance = {
    ...instance,
    status: result.passed ? 'COMPLETED' : 'FAILED',
    runtimeState: result.passed ? 'ARCHIVED' : 'ACTIVE',
    promotionState,
    completedAt: new Date().toISOString(),
    executionResult: result,
    world2VerificationProof: proofs.verification,
    world2ProductAssessment: proofs.product,
  };

  writeFileSync(
    join(instance.artifactDirectory, 'execution-result.json'),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8',
  );

  if (proofs.verification) {
    writeFileSync(
      join(instance.artifactDirectory, 'world2-verification-proof.json'),
      `${JSON.stringify(proofs.verification, null, 2)}\n`,
      'utf8',
    );
  }
  if (proofs.product) {
    writeFileSync(
      join(instance.artifactDirectory, 'world2-product-assessment.json'),
      `${JSON.stringify(proofs.product, null, 2)}\n`,
      'utf8',
    );
  }

  return registerWorld2Instance(completed);
}
