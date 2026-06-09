/**
 * Ownership lookup cache — bounded frozen copies of ownership records.
 */

import { resolveDevPulseV2OwnerRecord, listDevPulseV2Owners, type OwnerRecord } from './ownership-registry.js';
import type { OwnershipDomain } from './types.js';

export const MAX_OWNERSHIP_CACHE_SIZE = 512;

export interface OwnershipLookupCacheStats {
  hits: number;
  misses: number;
  size: number;
}

const recordCache = new Map<string, Readonly<OwnerRecord>>();
const capabilityCache = new Map<string, Readonly<OwnerRecord>>();
const moduleCache = new Map<string, Readonly<OwnerRecord>[]>();
let hits = 0;
let misses = 0;

function freezeRecord(record: OwnerRecord): Readonly<OwnerRecord> {
  return Object.freeze({ ...record });
}

function touchMap<T>(map: Map<string, T>, key: string, value: T): void {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > MAX_OWNERSHIP_CACHE_SIZE) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

export function getCachedOwnershipRecord(domain: OwnershipDomain): Readonly<OwnerRecord> {
  const key = `domain:${domain}`;
  const hit = recordCache.get(key);
  if (hit) {
    hits += 1;
    return hit;
  }
  misses += 1;
  const record = freezeRecord(resolveDevPulseV2OwnerRecord(domain));
  touchMap(recordCache, key, record);
  return record;
}

export function getCachedOwnershipByCapability(capabilityId: string): Readonly<OwnerRecord> | undefined {
  const key = `capability:${capabilityId}`;
  const hit = capabilityCache.get(key);
  if (hit) {
    hits += 1;
    return hit;
  }
  misses += 1;
  const match = listDevPulseV2Owners().find(
    (o) => o.ownerModule.includes(capabilityId.toLowerCase()) || o.description.includes(capabilityId),
  );
  if (!match) return undefined;
  const record = freezeRecord(match);
  touchMap(capabilityCache, key, record);
  return record;
}

export function getCachedOwnershipByModule(moduleId: string): readonly Readonly<OwnerRecord>[] {
  const key = `module:${moduleId}`;
  const hit = moduleCache.get(key);
  if (hit) {
    hits += 1;
    return hit;
  }
  misses += 1;
  const matches = listDevPulseV2Owners()
    .filter((o) => o.ownerModule === moduleId)
    .map((o) => freezeRecord(o));
  touchMap(moduleCache, key, matches);
  return matches;
}

export function getOwnershipLookupCacheStats(): OwnershipLookupCacheStats {
  return {
    hits,
    misses,
    size: recordCache.size + capabilityCache.size + moduleCache.size,
  };
}

export function clearOwnershipLookupCache(): void {
  recordCache.clear();
  capabilityCache.clear();
  moduleCache.clear();
  hits = 0;
  misses = 0;
}
