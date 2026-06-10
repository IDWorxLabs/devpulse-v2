/**
 * Self Evolution Governance — lookup cache.
 */

import type {
  GovernanceBoundaryValidation,
  GovernanceReadinessEvaluation,
  GovernanceRiskEvaluation,
  GovernanceTrustEvaluation,
} from './self-evolution-governance-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const boundaryCache = new Map<string, GovernanceBoundaryValidation>();
const riskCache = new Map<string, GovernanceRiskEvaluation>();
const trustCache = new Map<string, GovernanceTrustEvaluation>();
const readinessCache = new Map<string, GovernanceReadinessEvaluation>();

export function getCachedBoundaryValidation(key: string): GovernanceBoundaryValidation | undefined {
  const cached = boundaryCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedBoundaryValidation(key: string, result: GovernanceBoundaryValidation): void {
  boundaryCache.set(key, result);
}

export function getCachedRiskEvaluation(key: string): GovernanceRiskEvaluation | undefined {
  const cached = riskCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedRiskEvaluation(key: string, result: GovernanceRiskEvaluation): void {
  riskCache.set(key, result);
}

export function getCachedTrustEvaluation(key: string): GovernanceTrustEvaluation | undefined {
  const cached = trustCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedTrustEvaluation(key: string, result: GovernanceTrustEvaluation): void {
  trustCache.set(key, result);
}

export function getCachedReadinessEvaluation(key: string): GovernanceReadinessEvaluation | undefined {
  const cached = readinessCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedReadinessEvaluation(key: string, result: GovernanceReadinessEvaluation): void {
  readinessCache.set(key, result);
}

export function getGovernanceCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetGovernanceCacheForTests(): void {
  boundaryCache.clear();
  riskCache.clear();
  trustCache.clear();
  readinessCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
