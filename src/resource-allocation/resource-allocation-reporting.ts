/**
 * Resource Allocation — allocation reporting.
 */

import type { ResourceAllocationReport } from './resource-allocation-types.js';
import { getAllCapacitySnapshots } from './resource-capacity-manager.js';
import { listAllocations } from './resource-registry.js';
import { listQueuedAllocations, getQueueSize } from './resource-queue-manager.js';
import { detectResourceContention, getTotalContentionCount } from './resource-contention-detector.js';
import { getReservationCount } from './resource-reservation-manager.js';

let reportCounter = 0;

export function generateResourceAllocationReport(): ResourceAllocationReport {
  reportCounter += 1;

  const capacities = getAllCapacitySnapshots();
  const allocations = listAllocations();
  const queueSize = getQueueSize();

  const contentions = capacities.map((c) => detectResourceContention(c.resourceType));
  const activeContentions = contentions.filter((c) => c.severity !== 'NONE');

  const totalCapacity = capacities.reduce((sum, c) => sum + c.totalCapacity, 0);
  const totalUsed = capacities.reduce((sum, c) => sum + c.usedCapacity + c.reservedCapacity, 0);
  const utilizationPercent = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  const recommendations: string[] = [];
  if (queueSize > 0) {
    recommendations.push(`Process ${queueSize} queued allocation request(s)`);
  }
  if (getReservationCount() > 0) {
    recommendations.push('Review active reservations for release opportunities');
  }
  for (const c of activeContentions) {
    recommendations.push(c.recommendedAction);
  }
  if (recommendations.length === 0) {
    recommendations.push('Resource utilization healthy');
  }

  return {
    reportId: `resource-allocation-report-${reportCounter}`,
    capacities,
    allocations,
    queueSize,
    contentionCount: getTotalContentionCount(),
    utilizationPercent,
    recommendations,
    generatedAt: Date.now(),
  };
}

export function resetAllocationReportCounterForTests(): void {
  reportCounter = 0;
}
