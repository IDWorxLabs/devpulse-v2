/**
 * Resource Allocation — capacity management.
 */

import type { ResourceCapacitySnapshot, ResourceType } from './resource-allocation-types.js';
import { getResource, registerResource } from './resource-registry.js';
import { getCachedCapacity, setCachedCapacity, invalidateCapacityCache } from './resource-cache.js';

export function configureResourceCapacity(resourceType: ResourceType, totalCapacity: number): ResourceCapacitySnapshot {
  const record = registerResource(resourceType, totalCapacity);
  record.totalCapacity = totalCapacity;
  record.updatedAt = Date.now();
  invalidateCapacityCache(resourceType);
  return getResourceCapacity(resourceType);
}

export function getResourceCapacity(resourceType: ResourceType): ResourceCapacitySnapshot {
  const cached = getCachedCapacity(resourceType);
  if (cached) return cached;

  const record = getResource(resourceType) ?? registerResource(resourceType);
  const snapshot: ResourceCapacitySnapshot = {
    resourceType,
    totalCapacity: record.totalCapacity,
    usedCapacity: record.usedCapacity,
    reservedCapacity: record.reservedCapacity,
    availableCapacity: Math.max(0, record.totalCapacity - record.usedCapacity - record.reservedCapacity),
  };
  setCachedCapacity(snapshot);
  return snapshot;
}

export function getRemainingCapacity(resourceType: ResourceType): number {
  return getResourceCapacity(resourceType).availableCapacity;
}

export function getAllCapacitySnapshots(): ResourceCapacitySnapshot[] {
  const types: ResourceType[] = [
    'BUILD_SLOT', 'WORKSPACE_SLOT', 'VERIFICATION_SLOT',
    'TESTING_SLOT', 'FIXING_SLOT', 'WORLD2_SLOT',
  ];
  return types.map((t) => getResourceCapacity(t));
}
