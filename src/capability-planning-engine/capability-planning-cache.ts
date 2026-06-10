/**
 * Capability Planning Engine — lookup cache.
 */

import type {
  CapabilityDependencyPlan,
  CapabilityImpactAnalysis,
  CapabilityPlan,
  CapabilityRiskAnalysis,
} from './capability-planning-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const planCache = new Map<string, CapabilityPlan>();
const impactCache = new Map<string, CapabilityImpactAnalysis>();
const riskCache = new Map<string, CapabilityRiskAnalysis>();
const dependencyCache = new Map<string, CapabilityDependencyPlan>();

export function getCachedPlan(key: string): CapabilityPlan | undefined {
  const cached = planCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedPlan(key: string, plan: CapabilityPlan): void {
  planCache.set(key, plan);
}

export function getCachedImpact(key: string): CapabilityImpactAnalysis | undefined {
  const cached = impactCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedImpact(key: string, analysis: CapabilityImpactAnalysis): void {
  impactCache.set(key, analysis);
}

export function getCachedRisk(key: string): CapabilityRiskAnalysis | undefined {
  const cached = riskCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedRisk(key: string, analysis: CapabilityRiskAnalysis): void {
  riskCache.set(key, analysis);
}

export function getCachedDependency(key: string): CapabilityDependencyPlan | undefined {
  const cached = dependencyCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedDependency(key: string, plan: CapabilityDependencyPlan): void {
  dependencyCache.set(key, plan);
}

export function getCapabilityPlanningCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetCapabilityPlanningCacheForTests(): void {
  planCache.clear();
  impactCache.clear();
  riskCache.clear();
  dependencyCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
