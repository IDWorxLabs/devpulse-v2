/**
 * Cloud Execution Path V1 — file-backed durable queue.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CloudExecutionJob, CloudExecutionJobStatus } from './cloud-execution-path-v1-types.js';
import { CLOUD_EXECUTION_QUEUE_DIR } from './cloud-execution-path-v1-bounds.js';

function queueRoot(projectRootDir: string): string {
  return join(projectRootDir, CLOUD_EXECUTION_QUEUE_DIR);
}

function ensureQueueDirs(projectRootDir: string): void {
  for (const sub of ['queued', 'active', 'completed', 'failed']) {
    mkdirSync(join(queueRoot(projectRootDir), sub), { recursive: true });
  }
}

function jobPath(projectRootDir: string, bucket: string, jobId: string): string {
  return join(queueRoot(projectRootDir), bucket, `${jobId}.json`);
}

function readJobFile(path: string): CloudExecutionJob | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as CloudExecutionJob;
  } catch {
    return null;
  }
}

function writeJobFile(path: string, job: CloudExecutionJob): void {
  writeFileSync(path, `${JSON.stringify(job, null, 2)}\n`, 'utf8');
}

function listBucket(projectRootDir: string, bucket: string): CloudExecutionJob[] {
  const dir = join(queueRoot(projectRootDir), bucket);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJobFile(join(dir, name)))
    .filter((job): job is CloudExecutionJob => job !== null);
}

function moveJob(
  projectRootDir: string,
  jobId: string,
  fromBucket: string,
  toBucket: string,
): void {
  const from = jobPath(projectRootDir, fromBucket, jobId);
  const to = jobPath(projectRootDir, toBucket, jobId);
  if (existsSync(from)) {
    renameSync(from, to);
  }
}

export function enqueueCloudExecutionJob(
  projectRootDir: string,
  job: CloudExecutionJob,
): CloudExecutionJob {
  ensureQueueDirs(projectRootDir);
  writeJobFile(jobPath(projectRootDir, 'queued', job.jobId), job);
  return job;
}

export function claimNextCloudExecutionJob(
  projectRootDir: string,
  workerId: string,
): CloudExecutionJob | null {
  ensureQueueDirs(projectRootDir);
  const queued = listBucket(projectRootDir, 'queued').sort(
    (a, b) => a.requestedAt.localeCompare(b.requestedAt),
  );
  const next = queued[0];
  if (!next) return null;

  const claimed: CloudExecutionJob = {
    ...next,
    status: 'CLAIMED',
    claimedAt: new Date().toISOString(),
    workerId,
    currentStage: 'CLAIMED',
  };

  moveJob(projectRootDir, next.jobId, 'queued', 'active');
  writeJobFile(jobPath(projectRootDir, 'active', next.jobId), claimed);
  return claimed;
}

export function updateCloudExecutionJob(
  projectRootDir: string,
  job: CloudExecutionJob,
): CloudExecutionJob {
  ensureQueueDirs(projectRootDir);
  const bucket =
    job.status === 'COMPLETED'
      ? 'completed'
      : job.status === 'FAILED' || job.status === 'CANCELLED'
        ? 'failed'
        : 'active';
  writeJobFile(jobPath(projectRootDir, bucket, job.jobId), job);
  return job;
}

export function completeCloudExecutionJob(
  projectRootDir: string,
  job: CloudExecutionJob,
): CloudExecutionJob {
  const completed: CloudExecutionJob = {
    ...job,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    currentStage: 'COMPLETED',
  };
  if (existsSync(jobPath(projectRootDir, 'active', job.jobId))) {
    moveJob(projectRootDir, job.jobId, 'active', 'completed');
  }
  writeJobFile(jobPath(projectRootDir, 'completed', job.jobId), completed);
  return completed;
}

export function failCloudExecutionJob(
  projectRootDir: string,
  job: CloudExecutionJob,
): CloudExecutionJob {
  const failed: CloudExecutionJob = {
    ...job,
    status: 'FAILED',
    completedAt: new Date().toISOString(),
    currentStage: 'FAILED',
  };
  if (existsSync(jobPath(projectRootDir, 'active', job.jobId))) {
    moveJob(projectRootDir, job.jobId, 'active', 'failed');
  }
  writeJobFile(jobPath(projectRootDir, 'failed', job.jobId), failed);
  return failed;
}

export function getCloudExecutionQueueSnapshot(projectRootDir: string): {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  queuedJobs: readonly CloudExecutionJob[];
  activeJobs: readonly CloudExecutionJob[];
  completedJobs: readonly CloudExecutionJob[];
  failedJobs: readonly CloudExecutionJob[];
} {
  ensureQueueDirs(projectRootDir);
  const queuedJobs = listBucket(projectRootDir, 'queued');
  const activeJobs = listBucket(projectRootDir, 'active');
  const completedJobs = listBucket(projectRootDir, 'completed');
  const failedJobs = listBucket(projectRootDir, 'failed');
  return {
    queued: queuedJobs.length,
    active: activeJobs.length,
    completed: completedJobs.length,
    failed: failedJobs.length,
    queuedJobs,
    activeJobs,
    completedJobs,
    failedJobs,
  };
}

export function resetCloudExecutionQueueForTests(projectRootDir: string): void {
  const root = queueRoot(projectRootDir);
  if (!existsSync(root)) return;
  for (const bucket of ['queued', 'active', 'completed', 'failed']) {
    const dir = join(root, bucket);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name.endsWith('.json')) {
        unlinkSync(join(dir, name));
      }
    }
  }
}

export function getCloudExecutionJob(
  projectRootDir: string,
  jobId: string,
): CloudExecutionJob | null {
  for (const bucket of ['queued', 'active', 'completed', 'failed']) {
    const job = readJobFile(jobPath(projectRootDir, bucket, jobId));
    if (job) return job;
  }
  return null;
}

export function setJobStatus(
  job: CloudExecutionJob,
  status: CloudExecutionJobStatus,
  stage: string,
): CloudExecutionJob {
  return { ...job, status, currentStage: stage };
}
