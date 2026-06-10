/**
 * Resource Allocation — allocation queue management.
 */

import type { QueuedAllocationRequest, ResourcePriority, ResourceType } from './resource-allocation-types.js';
import { compareResourcePriority } from './resource-priority-engine.js';
import { getCachedQueue, invalidateQueueCache, setCachedQueue } from './resource-cache.js';

const queue: QueuedAllocationRequest[] = [];
let queueCounter = 0;

export function enqueueAllocation(
  projectId: string,
  resourceType: ResourceType,
  priority: ResourcePriority,
  requestedUnits: number,
): QueuedAllocationRequest {
  queueCounter += 1;
  const entry: QueuedAllocationRequest = {
    queueId: `allocation-queue-${queueCounter}`,
    projectId,
    resourceType,
    priority,
    requestedUnits,
    enqueuedAt: Date.now(),
  };

  queue.push(entry);
  queue.sort((a, b) => {
    const priorityDiff = compareResourcePriority(a.priority, b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.enqueuedAt - b.enqueuedAt;
  });

  invalidateQueueCache();
  return entry;
}

export function dequeueAllocation(): QueuedAllocationRequest | undefined {
  const item = queue.shift();
  invalidateQueueCache();
  return item;
}

export function listQueuedAllocations(limit = 100): QueuedAllocationRequest[] {
  const cached = getCachedQueue();
  if (cached) return cached.slice(0, limit);

  const snapshot = [...queue];
  setCachedQueue(snapshot);
  return snapshot.slice(0, limit);
}

export function getQueueSize(): number {
  return queue.length;
}

export function resetResourceQueueForTests(): void {
  queue.length = 0;
  queueCounter = 0;
  invalidateQueueCache();
}
