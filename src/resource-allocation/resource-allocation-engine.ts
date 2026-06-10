/**
 * Resource Allocation — allocation engine (planning only).
 */

import type { AllocateResourcesInput, AllocationStatus, ResourceAllocation } from './resource-allocation-types.js';
import { determineResourcePriority } from './resource-priority-engine.js';
import { getRemainingCapacity } from './resource-capacity-manager.js';
import { storeAllocation, updateResourceUsage } from './resource-registry.js';
import { enqueueAllocation } from './resource-queue-manager.js';
import { invalidateCapacityCache } from './resource-cache.js';
import { recordAllocationHistory } from './resource-allocation-history.js';

let allocationCounter = 0;

export function allocateResources(input: AllocateResourcesInput): ResourceAllocation {
  const priority = determineResourcePriority(input);
  const remaining = getRemainingCapacity(input.resourceType);

  allocationCounter += 1;
  let status: AllocationStatus;
  let allocatedUnits = 0;

  if (remaining >= input.requestedUnits) {
    status = 'ALLOCATED';
    allocatedUnits = input.requestedUnits;
    updateResourceUsage(input.resourceType, allocatedUnits);
    invalidateCapacityCache(input.resourceType);
    recordAllocationHistory(input.projectId, input.resourceType, 'ALLOCATION', `Allocated ${allocatedUnits} units`);
  } else if (remaining > 0) {
    status = 'WAITING';
    enqueueAllocation(input.projectId, input.resourceType, priority, input.requestedUnits);
    recordAllocationHistory(input.projectId, input.resourceType, 'ALLOCATION', 'Partial capacity — waiting');
  } else if (priority === 'CRITICAL' || priority === 'HIGH') {
    status = 'QUEUED';
    enqueueAllocation(input.projectId, input.resourceType, priority, input.requestedUnits);
    recordAllocationHistory(input.projectId, input.resourceType, 'ALLOCATION', 'Queued due to capacity exhaustion');
  } else {
    status = 'DENIED';
    recordAllocationHistory(input.projectId, input.resourceType, 'DENIAL', 'Denied — capacity exhausted and low priority');
  }

  const allocation: ResourceAllocation = {
    allocationId: `resource-allocation-${allocationCounter}`,
    projectId: input.projectId,
    resourceType: input.resourceType,
    priority,
    status,
    allocatedUnits,
    createdAt: Date.now(),
  };

  storeAllocation(allocation);
  return allocation;
}

export function resetAllocationEngineForTests(): void {
  allocationCounter = 0;
}
