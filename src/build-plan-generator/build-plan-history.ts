/**
 * Build Plan History — bounded plan history (max 32).
 */

import { MAX_BUILD_PLAN_HISTORY } from './build-plan-registry.js';
import type { BuildPlan, BuildPlanHistoryEntry } from './build-plan-types.js';

const history: BuildPlanHistoryEntry[] = [];
const plans: BuildPlan[] = [];

export function resetBuildPlanHistoryForTests(): void {
  history.length = 0;
  plans.length = 0;
}

export function recordBuildPlan(plan: BuildPlan): void {
  const entry: BuildPlanHistoryEntry = {
    planId: plan.planId,
    timestamp: plan.generatedAt,
    buildComplexityScore: plan.buildComplexityScore,
    buildComplexityCategory: plan.buildComplexityCategory,
    buildPlanReadiness: plan.buildPlanReadiness,
    buildPlanConfidence: plan.buildPlanConfidence,
    phaseCount: plan.phases.length,
  };

  history.unshift(entry);
  plans.unshift(plan);

  if (history.length > MAX_BUILD_PLAN_HISTORY) {
    history.length = MAX_BUILD_PLAN_HISTORY;
  }
  if (plans.length > MAX_BUILD_PLAN_HISTORY) {
    plans.length = MAX_BUILD_PLAN_HISTORY;
  }
}

export function getBuildPlanHistorySize(): number {
  return history.length;
}

export function getBuildPlanHistory(): readonly BuildPlanHistoryEntry[] {
  return [...history];
}

export function getBuildPlans(): readonly BuildPlan[] {
  return [...plans];
}

export function getLatestBuildPlan(): BuildPlan | null {
  return plans[0] ?? null;
}
