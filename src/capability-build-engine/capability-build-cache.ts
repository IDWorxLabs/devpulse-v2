/**
 * Capability Build Engine — lookup cache.
 */

import type {
  CapabilityBuildPlan,
  CapabilityBuildValidationPlan,
  CapabilityIntegrationPlan,
  CapabilityModulePlan,
  CapabilitySequencePlan,
} from './capability-build-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const moduleCache = new Map<string, CapabilityModulePlan>();
const integrationCache = new Map<string, CapabilityIntegrationPlan>();
const sequenceCache = new Map<string, CapabilitySequencePlan>();
const validationCache = new Map<string, CapabilityBuildValidationPlan>();
const buildPlanCache = new Map<string, CapabilityBuildPlan>();

export function getCachedModulePlan(key: string): CapabilityModulePlan | undefined {
  const cached = moduleCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedModulePlan(key: string, plan: CapabilityModulePlan): void {
  moduleCache.set(key, plan);
}

export function getCachedIntegrationPlan(key: string): CapabilityIntegrationPlan | undefined {
  const cached = integrationCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedIntegrationPlan(key: string, plan: CapabilityIntegrationPlan): void {
  integrationCache.set(key, plan);
}

export function getCachedSequencePlan(key: string): CapabilitySequencePlan | undefined {
  const cached = sequenceCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedSequencePlan(key: string, plan: CapabilitySequencePlan): void {
  sequenceCache.set(key, plan);
}

export function getCachedValidationPlan(key: string): CapabilityBuildValidationPlan | undefined {
  const cached = validationCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedValidationPlan(key: string, plan: CapabilityBuildValidationPlan): void {
  validationCache.set(key, plan);
}

export function getCachedBuildPlan(key: string): CapabilityBuildPlan | undefined {
  const cached = buildPlanCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedBuildPlan(key: string, plan: CapabilityBuildPlan): void {
  buildPlanCache.set(key, plan);
}

export function getCapabilityBuildCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetCapabilityBuildCacheForTests(): void {
  moduleCache.clear();
  integrationCache.clear();
  sequenceCache.clear();
  validationCache.clear();
  buildPlanCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
