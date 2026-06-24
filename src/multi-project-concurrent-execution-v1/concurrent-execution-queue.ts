/**
 * Multi-Project Concurrent Execution V1 — concurrent execution queue.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONCURRENT_EXECUTION_QUEUE_DIR } from './multi-project-concurrent-execution-v1-bounds.js';
import type {
  ConcurrentExecutionJob,
  ConcurrentJobStatus,
  ConcurrentQueueSnapshot,
} from './multi-project-concurrent-execution-v1-types.js';

function queueRoot(projectRootDir: string): string {
  return join(projectRootDir, CONCURRENT_EXECUTION_QUEUE_DIR);
}

function ensureQueueDirs(projectRootDir: string): void {
  for (const sub of ['queued', 'active', 'completed', 'failed', 'cancelled']) {
    mkdirSync(join(queueRoot(projectRootDir), sub), { recursive: true });
  }
}

function bucketForStatus(status: ConcurrentJobStatus): string {
  switch (status) {
    case 'QUEUED':
      return 'queued';
    case 'ACTIVE':
      return 'active';
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'queued';
  }
}

function jobPath(projectRootDir: string, bucket: string, jobId: string): string {
  return join(queueRoot(projectRootDir), bucket, `${jobId}.json`);
}

function readJob(path: string): ConcurrentExecutionJob | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as ConcurrentExecutionJob;
  } catch {
    return null;
  }
}

function writeJob(path: string, job: ConcurrentExecutionJob): void {
  writeFileSync(path, `${JSON.stringify(job, null, 2)}\n`, 'utf8');
}

function listBucket(projectRootDir: string, bucket: string): ConcurrentExecutionJob[] {
  const dir = join(queueRoot(projectRootDir), bucket);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJob(join(dir, name)))
    .filter((job): job is ConcurrentExecutionJob => job !== null);
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

export function resetConcurrentExecutionQueueForTests(projectRootDir: string): void {
  const root = queueRoot(projectRootDir);
  if (!existsSync(root)) return;
  for (const sub of ['queued', 'active', 'completed', 'failed', 'cancelled']) {
    const dir = join(root, sub);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name.endsWith('.json')) {
        unlinkSync(join(dir, name));
      }
    }
  }
}

export function enqueueConcurrentProject(
  projectRootDir: string,
  job: ConcurrentExecutionJob,
): ConcurrentExecutionJob {
  ensureQueueDirs(projectRootDir);
  writeJob(jobPath(projectRootDir, 'queued', job.jobId), job);
  return job;
}

export function activateConcurrentProject(
  projectRootDir: string,
  jobId: string,
  workerId: string,
): ConcurrentExecutionJob | null {
  const queued = readJob(jobPath(projectRootDir, 'queued', jobId));
  if (!queued) return null;
  moveJob(projectRootDir, jobId, 'queued', 'active');
  const active: ConcurrentExecutionJob = {
    ...queued,
    status: 'ACTIVE',
    startedAt: new Date().toISOString(),
    workerId,
  };
  writeJob(jobPath(projectRootDir, 'active', jobId), active);
  return active;
}

export function completeConcurrentProject(
  projectRootDir: string,
  jobId: string,
  passed: boolean,
): ConcurrentExecutionJob | null {
  const active = readJob(jobPath(projectRootDir, 'active', jobId));
  if (!active) return null;
  moveJob(projectRootDir, jobId, 'active', passed ? 'completed' : 'failed');
  const bucket = passed ? 'completed' : 'failed';
  const finished: ConcurrentExecutionJob = {
    ...active,
    status: passed ? 'COMPLETED' : 'FAILED',
    completedAt: new Date().toISOString(),
  };
  writeJob(jobPath(projectRootDir, bucket, jobId), finished);
  return finished;
}

export function getConcurrentExecutionQueueSnapshot(
  projectRootDir: string,
): ConcurrentQueueSnapshot {
  ensureQueueDirs(projectRootDir);
  const queued = listBucket(projectRootDir, 'queued');
  const active = listBucket(projectRootDir, 'active');
  const completed = listBucket(projectRootDir, 'completed');
  const failed = listBucket(projectRootDir, 'failed');
  const cancelled = listBucket(projectRootDir, 'cancelled');
  return {
    readOnly: true,
    queued: queued.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    cancelled: cancelled.length,
    jobs: [...queued, ...active, ...completed, ...failed, ...cancelled].sort((a, b) =>
      a.queuedAt.localeCompare(b.queuedAt),
    ),
  };
}

export function buildConcurrentExecutionJob(input: {
  jobId: string;
  projectId: string;
  profile: string;
  productName: string;
  worldId: string;
}): ConcurrentExecutionJob {
  return {
    readOnly: true,
    jobId: input.jobId,
    projectId: input.projectId,
    profile: input.profile,
    productName: input.productName,
    worldId: input.worldId,
    status: 'QUEUED',
    queuedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    workerId: null,
  };
}
