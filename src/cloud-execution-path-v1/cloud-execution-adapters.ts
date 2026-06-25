/**
 * Cloud Execution Path V1 — execution mode adapters.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CloudExecutionJob,
  CloudExecutionJobResult,
  CloudExecutionMode,
} from './cloud-execution-path-v1-types.js';
import { buildCloudJobPackage } from './cloud-execution-job-lifecycle.js';
import { runCloudExecutionWorker } from './cloud-execution-worker.js';
import { CLOUD_EXECUTION_JOBS_DIR } from './cloud-execution-path-v1-bounds.js';

export interface CloudExecutionAdapter {
  readonly mode: CloudExecutionMode;
  execute(input: { projectRootDir: string; job: CloudExecutionJob; workerId: string; otherJobIds?: readonly string[] }): CloudExecutionJobResult;
}

export const LocalExecutionAdapter: CloudExecutionAdapter = {
  mode: 'LOCAL',
  execute(input) {
    return runCloudExecutionWorker({
      projectRootDir: input.projectRootDir,
      job: { ...input.job, executionMode: 'LOCAL' },
      workerId: input.workerId,
      otherJobIds: input.otherJobIds,
    });
  },
};

export const CloudSimulatedExecutionAdapter: CloudExecutionAdapter = {
  mode: 'CLOUD_SIMULATED',
  execute(input) {
    return runCloudExecutionWorker({
      projectRootDir: input.projectRootDir,
      job: { ...input.job, executionMode: 'CLOUD_SIMULATED' },
      workerId: input.workerId,
      otherJobIds: input.otherJobIds,
    });
  },
};

export const CloudReadyPackageAdapter: CloudExecutionAdapter = {
  mode: 'CLOUD_READY',
  execute(input) {
    const jobArtifactsDir = join(
      input.projectRootDir,
      CLOUD_EXECUTION_JOBS_DIR,
      input.job.jobId,
    );
    mkdirSync(jobArtifactsDir, { recursive: true });
    const cloudJobPackage = buildCloudJobPackage(input.job);
    writeFileSync(
      join(jobArtifactsDir, 'cloud-job-package.json'),
      `${JSON.stringify(cloudJobPackage, null, 2)}\n`,
      'utf8',
    );

    return {
      readOnly: true,
      job: { ...input.job, status: 'COMPLETED', currentStage: 'COMPLETED' },
      passed: true,
      failureReport: null,
      artifactStatus: {
        readOnly: true,
        sourceManifest: false,
        buildLogs: false,
        previewProof: false,
        uvlVerificationProof: false,
        productArchitectProof: false,
        aflaVerdict: false,
        productionReadinessResult: false,
        executionSummary: false,
        cloudJobPackage: true,
      },
      cloudJobPackage,
      buildProof: false,
      previewProof: false,
      verificationProof: false,
      aflaVerdict: null,
      paiResult: null,
      productionReadinessScore: null,
      productionReadinessVerdict: null,
      executionSummary: 'Cloud-ready package generated without local execution.',
      contaminationCheckPassed: true,
    };
  },
};

export function resolveCloudExecutionAdapter(mode: CloudExecutionMode): CloudExecutionAdapter {
  switch (mode) {
    case 'LOCAL':
      return LocalExecutionAdapter;
    case 'CLOUD_SIMULATED':
      return CloudSimulatedExecutionAdapter;
    case 'CLOUD_READY':
      return CloudReadyPackageAdapter;
  }
}
