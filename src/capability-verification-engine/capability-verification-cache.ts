/**
 * Capability Verification Engine — lookup cache.
 */

import type {
  CapabilityDuplicateValidation,
  CapabilityReadinessEvaluation,
  CapabilityRequirementValidation,
  CapabilityTrustValidation,
} from './capability-verification-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const requirementCache = new Map<string, CapabilityRequirementValidation>();
const duplicateCache = new Map<string, CapabilityDuplicateValidation>();
const trustCache = new Map<string, CapabilityTrustValidation>();
const readinessCache = new Map<string, CapabilityReadinessEvaluation>();

export function getCachedRequirementValidation(key: string): CapabilityRequirementValidation | undefined {
  const cached = requirementCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedRequirementValidation(key: string, result: CapabilityRequirementValidation): void {
  requirementCache.set(key, result);
}

export function getCachedDuplicateValidation(key: string): CapabilityDuplicateValidation | undefined {
  const cached = duplicateCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedDuplicateValidation(key: string, result: CapabilityDuplicateValidation): void {
  duplicateCache.set(key, result);
}

export function getCachedTrustValidation(key: string): CapabilityTrustValidation | undefined {
  const cached = trustCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedTrustValidation(key: string, result: CapabilityTrustValidation): void {
  trustCache.set(key, result);
}

export function getCachedReadinessEvaluation(key: string): CapabilityReadinessEvaluation | undefined {
  const cached = readinessCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedReadinessEvaluation(key: string, result: CapabilityReadinessEvaluation): void {
  readinessCache.set(key, result);
}

export function getCapabilityVerificationCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetCapabilityVerificationCacheForTests(): void {
  requirementCache.clear();
  duplicateCache.clear();
  trustCache.clear();
  readinessCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
