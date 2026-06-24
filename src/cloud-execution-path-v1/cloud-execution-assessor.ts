/**
 * Cloud Execution Path V1 — full multi-job assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CloudExecutionPathV1Assessment } from './cloud-execution-path-v1-types.js';
import {
  CLOUD_EXECUTION_PATH_V1_PASS_TOKEN,
  CLOUD_EXECUTION_PATH_V1_FAIL_TOKEN,
  CLOUD_EXECUTION_PROOF_PROFILES,
  MIN_CONCURRENT_JOBS_PROOF,
} from './cloud-execution-path-v1-bounds.js';
import {
  submitCloudExecutionJob,
  claimCloudExecutionJob,
} from './cloud-execution-job-lifecycle.js';
import { getCloudExecutionQueueSnapshot, resetCloudExecutionQueueForTests } from './cloud-execution-queue.js';
import { runCloudExecutionJob } from './cloud-execution-runner.js';
import { recordCloudExecutionAssessment } from './cloud-execution-history.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

export function runCloudExecutionPathV1(input?: {
  projectRootDir?: string;
  profiles?: readonly string[];
  resetQueue?: boolean;
}): CloudExecutionPathV1Assessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const profiles = input?.profiles ?? CLOUD_EXECUTION_PROOF_PROFILES;

  if (input?.resetQueue !== false) {
    resetCloudExecutionQueueForTests(projectRootDir);
  }

  const submittedJobs = profiles.map((profile) =>
    submitCloudExecutionJob({
      projectRootDir,
      profile,
      executionMode: 'CLOUD_SIMULATED',
    }),
  );

  const jobIds = submittedJobs.map((j) => j.jobId);
  const jobResults = submittedJobs.map((submitted) => {
    const claimed = claimCloudExecutionJob(projectRootDir, `worker-${submitted.jobId.slice(0, 8)}`);
    if (!claimed) {
      throw new Error(`Claim failure: could not claim job ${submitted.jobId}`);
    }
    return runCloudExecutionJob({
      projectRootDir,
      job: claimed,
      workerId: claimed.workerId ?? 'cloud-worker',
      otherJobIds: jobIds.filter((id) => id !== claimed.jobId),
    });
  });

  const jobsCompleted = jobResults.filter((r) => r.passed).length;
  const jobsFailed = jobResults.filter((r) => !r.passed).length;
  const contaminationIncidents = jobResults.filter((r) => !r.contaminationCheckPassed).length;
  const cloudReadyPackagesGenerated = jobResults.filter((r) => r.cloudJobPackage !== null).length;

  const queueSnapshot = getCloudExecutionQueueSnapshot(projectRootDir);

  const cloudSimulatedProofStatus: CloudExecutionPathV1Assessment['cloudSimulatedProofStatus'] =
    jobsCompleted >= MIN_CONCURRENT_JOBS_PROOF && contaminationIncidents === 0
      ? 'PROVEN'
      : jobsCompleted > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const passToken =
    cloudSimulatedProofStatus === 'PROVEN' &&
    jobsCompleted >= MIN_CONCURRENT_JOBS_PROOF &&
    contaminationIncidents === 0 &&
    jobResults.every((r) => r.buildProof && r.previewProof && r.cloudJobPackage !== null)
      ? CLOUD_EXECUTION_PATH_V1_PASS_TOKEN
      : CLOUD_EXECUTION_PATH_V1_FAIL_TOKEN;

  const assessment: CloudExecutionPathV1Assessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Cloud Execution Path V1',
    passToken,
    version: 'V1',
    generatedAt: new Date().toISOString(),
    jobsSubmitted: submittedJobs.length,
    jobsCompleted,
    jobsFailed,
    concurrentJobsProven: jobsCompleted,
    contaminationIncidents,
    cloudSimulatedProofStatus,
    cloudReadyPackagesGenerated,
    jobResults,
    queueSnapshot: {
      queued: queueSnapshot.queued,
      active: queueSnapshot.active,
      completed: queueSnapshot.completed,
      failed: queueSnapshot.failed,
    },
  };

  recordCloudExecutionAssessment(assessment);
  return assessment;
}
