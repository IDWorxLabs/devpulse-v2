/**
 * Cloud Execution Path V1 — job builder and lifecycle API.
 */

import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assessCqiMaturity } from '../clarifying-question-intelligence/index.js';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import { resolveRealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import type {
  CloudExecutionJob,
  CloudExecutionMode,
  CloudJobPackage,
} from './cloud-execution-path-v1-types.js';
import {
  CLOUD_EXECUTION_CONTRACT_VERSION,
  CLOUD_EXECUTION_WORKSPACE_PREFIX,
  DEFAULT_ARTIFACT_MAX_BYTES,
  DEFAULT_LOG_MAX_LINES,
  DEFAULT_RUNTIME_TIMEOUT_MS,
  EXPECTED_ARTIFACT_OUTPUTS,
} from './cloud-execution-path-v1-bounds.js';
import {
  enqueueCloudExecutionJob,
  claimNextCloudExecutionJob,
  completeCloudExecutionJob,
  failCloudExecutionJob,
  updateCloudExecutionJob,
} from './cloud-execution-queue.js';

export function buildWorkspaceId(jobId: string): string {
  return `${CLOUD_EXECUTION_WORKSPACE_PREFIX}-${jobId}`;
}

export function buildCloudExecutionJob(input: {
  projectRootDir: string;
  profile: string;
  executionMode: CloudExecutionMode;
  projectId?: string;
  jobId?: string;
}): CloudExecutionJob {
  const suite = resolveRealBuildSuiteEntry(input.profile);
  const jobId = input.jobId ?? randomUUID();
  const projectId = input.projectId ?? `proj-${suite.profile.toLowerCase()}`;
  const workspaceId = buildWorkspaceId(jobId);
  const workspacePath = join(input.projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId);

  const cqi = assessCqiMaturity({ userPrompt: suite.prompt });
  const contract = assessRequirementsToPlanExecutionContract({ rawPrompt: suite.prompt });

  return {
    readOnly: true,
    jobId,
    projectId,
    prompt: suite.prompt,
    requirementsSnapshot: {
      readOnly: true,
      profile: suite.profile,
      productName: suite.productName,
      prompt: suite.prompt,
      requirementConfidence: cqi.requirementConfidenceScore,
    },
    buildPlan: {
      readOnly: true,
      contractId: contract.report?.buildReadyContract?.contractId ?? null,
      planningSummary: contract.report?.buildReadyContract
      ? `Contract ${contract.report.buildReadyContract.contractId}`
      : 'Cloud execution build plan',
      codegenProfile: suite.codegenProfile,
    },
    workspaceSpec: {
      readOnly: true,
      workspaceId,
      workspacePath,
      isolationToken: jobId,
      boundedLogsMaxLines: DEFAULT_LOG_MAX_LINES,
      boundedArtifactsMaxBytes: DEFAULT_ARTIFACT_MAX_BYTES,
      runtimeTimeoutMs: DEFAULT_RUNTIME_TIMEOUT_MS,
    },
    executionMode: input.executionMode,
    requestedAt: new Date().toISOString(),
    status: 'QUEUED',
    claimedAt: null,
    completedAt: null,
    workerId: null,
    currentStage: null,
    runtimeDurationMs: null,
  };
}

export function buildCloudJobPackage(job: CloudExecutionJob): CloudJobPackage {
  return {
    readOnly: true,
    contractVersion: CLOUD_EXECUTION_CONTRACT_VERSION,
    jobId: job.jobId,
    projectId: job.projectId,
    executionMode: job.executionMode,
    jobMetadata: {
      profile: job.requirementsSnapshot.profile,
      productName: job.requirementsSnapshot.productName,
      requestedAt: job.requestedAt,
      workerId: job.workerId,
    },
    prompt: job.prompt,
    requirementsSnapshot: job.requirementsSnapshot,
    buildPlan: job.buildPlan,
    workspaceSpec: job.workspaceSpec,
    expectedArtifactOutputs: [...EXPECTED_ARTIFACT_OUTPUTS],
    validationRequirements: [
      'Build proof required',
      'Preview proof required',
      'UVL verification proof required',
      'AFLA verdict required',
      'Production readiness gate required',
      'Unique isolated workspace required',
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function submitCloudExecutionJob(input: {
  projectRootDir: string;
  profile: string;
  executionMode: CloudExecutionMode;
  projectId?: string;
  jobId?: string;
}): CloudExecutionJob {
  const job = buildCloudExecutionJob(input);
  return enqueueCloudExecutionJob(input.projectRootDir, job);
}

export {
  claimNextCloudExecutionJob as claimCloudExecutionJob,
  completeCloudExecutionJob,
  failCloudExecutionJob,
  updateCloudExecutionJob,
};
