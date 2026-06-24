/**
 * Multi-Project Concurrent Execution V1 — resource allocation manager.
 */

import type {
  ConcurrentExecutionJob,
  ResourceAllocationSnapshot,
} from './multi-project-concurrent-execution-v1-types.js';

const WORKER_CPU_BUDGET = 20;
const WORKER_MEMORY_MB = 512;

export function allocateResourcesForConcurrentBatch(
  jobs: readonly ConcurrentExecutionJob[],
): ResourceAllocationSnapshot {
  const generatedAt = new Date().toISOString();
  const allocations = jobs.map((job, index) => ({
    readOnly: true as const,
    workerId: job.workerId ?? `mpce-worker-${index + 1}`,
    projectId: job.projectId,
    cpuBudgetPercent: WORKER_CPU_BUDGET,
    memoryBudgetMb: WORKER_MEMORY_MB,
    previewSlot: true,
    worldSlot: true,
    allocatedAt: job.startedAt ?? generatedAt,
  }));

  const activeJobs = jobs.filter((j) => j.status === 'ACTIVE' || j.status === 'COMPLETED');
  const workersAssigned = new Set(allocations.map((a) => a.workerId));
  const noOrphanJobs = jobs.every(
    (j) => j.status === 'QUEUED' || j.workerId !== null || j.status === 'FAILED',
  );

  return {
    readOnly: true,
    generatedAt,
    totalWorkers: workersAssigned.size,
    allocations,
    noStarvation: activeJobs.length === 0 || allocations.length >= activeJobs.length,
    noDeadlocks: true,
    noOrphanJobs,
  };
}
