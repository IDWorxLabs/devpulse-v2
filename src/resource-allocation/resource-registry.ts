/**
 * Resource Allocation — resource registry.
 */

import type { ResourceAllocation, ResourceRecord, ResourceType } from './resource-allocation-types.js';
import { setCachedAllocation, getCachedAllocation } from './resource-cache.js';

const resources = new Map<ResourceType, ResourceRecord>();
const allocations = new Map<string, ResourceAllocation>();
const allocationsByProject = new Map<string, ResourceAllocation[]>();

const DEFAULT_CAPACITIES: Record<ResourceType, number> = {
  BUILD_SLOT: 20,
  WORKSPACE_SLOT: 50,
  VERIFICATION_SLOT: 15,
  TESTING_SLOT: 25,
  FIXING_SLOT: 15,
  WORLD2_SLOT: 10,
};

export function registerResource(resourceType: ResourceType, capacity?: number): ResourceRecord {
  const existing = resources.get(resourceType);
  if (existing) return existing;

  const record: ResourceRecord = {
    resourceType,
    totalCapacity: capacity ?? DEFAULT_CAPACITIES[resourceType],
    usedCapacity: 0,
    reservedCapacity: 0,
    updatedAt: Date.now(),
  };
  resources.set(resourceType, record);
  return record;
}

export function getResource(resourceType: ResourceType): ResourceRecord | undefined {
  return resources.get(resourceType);
}

export function listResources(): ResourceRecord[] {
  return [...resources.values()];
}

export function registerAllDefaultResources(): ResourceRecord[] {
  const types: ResourceType[] = [
    'BUILD_SLOT', 'WORKSPACE_SLOT', 'VERIFICATION_SLOT',
    'TESTING_SLOT', 'FIXING_SLOT', 'WORLD2_SLOT',
  ];
  return types.map((t) => registerResource(t));
}

export function storeAllocation(allocation: ResourceAllocation): void {
  allocations.set(allocation.allocationId, allocation);
  setCachedAllocation(allocation);

  const projectAllocations = allocationsByProject.get(allocation.projectId) ?? [];
  projectAllocations.unshift(allocation);
  allocationsByProject.set(allocation.projectId, projectAllocations);
}

export function getAllocation(allocationId: string): ResourceAllocation | undefined {
  const cached = getCachedAllocation(allocationId);
  if (cached) return cached;
  return allocations.get(allocationId);
}

export function listAllocations(): ResourceAllocation[] {
  return [...allocations.values()];
}

export function listAllocationsByProject(projectId: string): ResourceAllocation[] {
  return allocationsByProject.get(projectId) ?? [];
}

export function getAllocationCount(): number {
  return allocations.size;
}

export function updateResourceUsage(resourceType: ResourceType, deltaUsed: number, deltaReserved = 0): void {
  const record = resources.get(resourceType);
  if (!record) return;
  record.usedCapacity = Math.max(0, record.usedCapacity + deltaUsed);
  record.reservedCapacity = Math.max(0, record.reservedCapacity + deltaReserved);
  record.updatedAt = Date.now();
}

export function resetResourceRegistryForTests(): void {
  resources.clear();
  allocations.clear();
  allocationsByProject.clear();
}
