/**
 * Resource Allocation — lookup cache.
 */

import type {
  AllocationStatus,
  QueuedAllocationRequest,
  ResourceAllocation,
  ResourceCapacitySnapshot,
  ResourceReservation,
  ResourceType,
} from './resource-allocation-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const allocationByIdCache = new Map<string, ResourceAllocation>();
const capacityCache = new Map<ResourceType, ResourceCapacitySnapshot>();
let queueCacheValid = false;
let cachedQueue: QueuedAllocationRequest[] = [];
const reservationByProjectCache = new Map<string, ResourceReservation[]>();

export function getCachedAllocation(allocationId: string): ResourceAllocation | undefined {
  const cached = allocationByIdCache.get(allocationId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedAllocation(allocation: ResourceAllocation): void {
  allocationByIdCache.set(allocation.allocationId, allocation);
}

export function getCachedCapacity(resourceType: ResourceType): ResourceCapacitySnapshot | undefined {
  const cached = capacityCache.get(resourceType);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedCapacity(snapshot: ResourceCapacitySnapshot): void {
  capacityCache.set(snapshot.resourceType, snapshot);
}

export function invalidateCapacityCache(resourceType?: ResourceType): void {
  if (resourceType) capacityCache.delete(resourceType);
  else capacityCache.clear();
}

export function getCachedQueue(): QueuedAllocationRequest[] | undefined {
  if (queueCacheValid) {
    cacheHits += 1;
    return cachedQueue;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedQueue(queue: QueuedAllocationRequest[]): void {
  cachedQueue = queue;
  queueCacheValid = true;
}

export function invalidateQueueCache(): void {
  queueCacheValid = false;
}

export function getCachedReservations(projectId: string): ResourceReservation[] | undefined {
  const cached = reservationByProjectCache.get(projectId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedReservations(projectId: string, reservations: ResourceReservation[]): void {
  reservationByProjectCache.set(projectId, reservations);
}

export function invalidateReservationCache(projectId?: string): void {
  if (projectId) reservationByProjectCache.delete(projectId);
  else reservationByProjectCache.clear();
}

export function getResourceCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetResourceCacheForTests(): void {
  allocationByIdCache.clear();
  capacityCache.clear();
  queueCacheValid = false;
  cachedQueue = [];
  reservationByProjectCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
