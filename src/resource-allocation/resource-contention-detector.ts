/**
 * Resource Allocation — resource contention detection.
 */

import type { ContentionReport, ContentionSeverity, ResourceType } from './resource-allocation-types.js';
import { getResourceCapacity } from './resource-capacity-manager.js';
import { listQueuedAllocations } from './resource-queue-manager.js';
import { getReservationCount } from './resource-reservation-manager.js';

let contentionCount = 0;

export function detectResourceContention(resourceType: ResourceType): ContentionReport {
  const capacity = getResourceCapacity(resourceType);
  const queue = listQueuedAllocations().filter((q) => q.resourceType === resourceType);

  let severity: ContentionSeverity = 'NONE';
  let detail = 'No contention detected';
  let recommendedAction = 'Continue normal allocation';

  if (capacity.availableCapacity <= 0) {
    severity = 'CRITICAL';
    detail = `${resourceType} capacity exhausted`;
    recommendedAction = 'Queue lower-priority requests and release unused reservations';
    contentionCount += 1;
  } else if (capacity.availableCapacity < capacity.totalCapacity * 0.1) {
    severity = 'HIGH';
    detail = `${resourceType} capacity critically low`;
    recommendedAction = 'Prioritize CRITICAL and HIGH requests only';
    contentionCount += 1;
  } else if (queue.length > 10) {
    severity = 'MEDIUM';
    detail = `${queue.length} queued requests for ${resourceType}`;
    recommendedAction = 'Review queue and increase capacity if sustained';
    contentionCount += 1;
  } else if (capacity.reservedCapacity > capacity.totalCapacity * 0.5) {
    severity = 'LOW';
    detail = `High reservation ratio for ${resourceType}`;
    recommendedAction = 'Release expired reservations';
    contentionCount += 1;
  }

  if (getReservationCount() > 0 && capacity.usedCapacity + capacity.reservedCapacity > capacity.totalCapacity) {
    severity = 'CRITICAL';
    detail = `Over-allocation detected for ${resourceType}`;
    recommendedAction = 'Halt new allocations until capacity normalized';
    contentionCount += 1;
  }

  return { resourceType, severity, detail, recommendedAction };
}

export function getTotalContentionCount(): number {
  return contentionCount;
}

export function resetContentionDetectorForTests(): void {
  contentionCount = 0;
}
