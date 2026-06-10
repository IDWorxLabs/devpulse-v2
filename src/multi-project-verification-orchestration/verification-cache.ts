/**
 * Multi Project Verification Orchestration — lookup cache.
 */

import type { VerificationOrchestrationPlan } from './verification-orchestration-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const planByIdCache = new Map<string, VerificationOrchestrationPlan>();
const plansByProjectCache = new Map<string, VerificationOrchestrationPlan[]>();
const dependencyCache = new Map<string, string[][]>();
const readinessCache = new Map<string, string>();
const scheduleCache = new Map<string, VerificationOrchestrationPlan['groups']>();

export function getCachedVerificationPlan(planId: string): VerificationOrchestrationPlan | undefined {
  const cached = planByIdCache.get(planId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedVerificationPlan(plan: VerificationOrchestrationPlan): void {
  planByIdCache.set(plan.planId, plan);
  for (const group of plan.groups) {
    for (const projectId of group.projectIds) {
      plansByProjectCache.delete(projectId);
    }
  }
}

export function getCachedPlansByProject(projectId: string): VerificationOrchestrationPlan[] | undefined {
  const cached = plansByProjectCache.get(projectId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedPlansByProject(projectId: string, plans: VerificationOrchestrationPlan[]): void {
  plansByProjectCache.set(projectId, plans);
}

export function getCachedVerificationDependencies(key: string): string[][] | undefined {
  const cached = dependencyCache.get(key);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedVerificationDependencies(key: string, chains: string[][]): void {
  dependencyCache.set(key, chains);
}

export function getCachedVerificationReadiness(projectId: string): string | undefined {
  const cached = readinessCache.get(projectId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedVerificationReadiness(projectId: string, status: string): void {
  readinessCache.set(projectId, status);
}

export function getCachedVerificationSchedule(planId: string): VerificationOrchestrationPlan['groups'] | undefined {
  const cached = scheduleCache.get(planId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedVerificationSchedule(planId: string, groups: VerificationOrchestrationPlan['groups']): void {
  scheduleCache.set(planId, groups);
}

export function getVerificationOrchestrationCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetVerificationOrchestrationCacheForTests(): void {
  planByIdCache.clear();
  plansByProjectCache.clear();
  dependencyCache.clear();
  readinessCache.clear();
  scheduleCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
