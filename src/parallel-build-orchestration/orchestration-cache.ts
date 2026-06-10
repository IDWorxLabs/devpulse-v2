/**
 * Parallel Build Orchestration — lookup cache.
 */

import type { OrchestrationPlan } from './orchestration-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const planByIdCache = new Map<string, OrchestrationPlan>();
const plansByProjectCache = new Map<string, OrchestrationPlan[]>();
const dependencyCache = new Map<string, string[][]>();
const readinessCache = new Map<string, string>();
const scheduleCache = new Map<string, string[][]>();

export function getCachedPlan(planId: string): OrchestrationPlan | undefined {
  const cached = planByIdCache.get(planId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedPlan(plan: OrchestrationPlan): void {
  planByIdCache.set(plan.planId, plan);
  for (const p of plan.projects) {
    plansByProjectCache.delete(p.projectId);
  }
}

export function getCachedPlansByProject(projectId: string): OrchestrationPlan[] | undefined {
  const cached = plansByProjectCache.get(projectId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedPlansByProject(projectId: string, plans: OrchestrationPlan[]): void {
  plansByProjectCache.set(projectId, plans);
}

export function getCachedDependencies(key: string): string[][] | undefined {
  const cached = dependencyCache.get(key);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedDependencies(key: string, chains: string[][]): void {
  dependencyCache.set(key, chains);
}

export function getCachedReadiness(projectId: string): string | undefined {
  const cached = readinessCache.get(projectId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedReadiness(projectId: string, status: string): void {
  readinessCache.set(projectId, status);
}

export function getCachedSchedule(planId: string): string[][] | undefined {
  const cached = scheduleCache.get(planId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedSchedule(planId: string, groups: string[][]): void {
  scheduleCache.set(planId, groups);
}

export function getOrchestrationCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetOrchestrationCacheForTests(): void {
  planByIdCache.clear();
  plansByProjectCache.clear();
  dependencyCache.clear();
  readinessCache.clear();
  scheduleCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
