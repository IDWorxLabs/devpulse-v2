/**
 * Parallel Build Orchestration — reporting.
 */

import type { OrchestrationReport } from './orchestration-types.js';
import type { OrchestrationPlan, OrchestrationProjectInput } from './orchestration-types.js';
import { detectOrchestrationConflicts } from './orchestration-conflict-detector.js';
import { buildDependencyChains } from './orchestration-dependency-manager.js';

let reportCounter = 0;

export function generateOrchestrationReport(
  plan: OrchestrationPlan,
  projects?: OrchestrationProjectInput[],
): OrchestrationReport {
  reportCounter += 1;

  const dependencyResult = projects ? buildDependencyChains(projects) : { chains: plan.dependencyChains, cycles: [], invalid: [], missing: [] };
  const conflicts = projects
    ? detectOrchestrationConflicts(projects, dependencyResult, plan.executionGroups)
    : [];

  const recommendations: string[] = [];
  if (plan.blockedProjects.length > 0) {
    recommendations.push(`Resolve ${plan.blockedProjects.length} blocked project(s)`);
  }
  if (plan.waitingProjects.length > 0) {
    recommendations.push(`Monitor ${plan.waitingProjects.length} waiting project(s) for dependency completion`);
  }
  for (const c of conflicts) {
    recommendations.push(c.recommendedAction);
  }
  if (recommendations.length === 0) {
    recommendations.push('Orchestration plan ready for parallel build coordination');
  }

  return {
    reportId: `orchestration-report-${reportCounter}`,
    planId: plan.planId,
    projectCount: plan.projects.length,
    readyProjects: [...plan.readyProjects],
    waitingProjects: [...plan.waitingProjects],
    blockedProjects: [...plan.blockedProjects],
    executionGroups: plan.executionGroups.map((g) => [...g]),
    dependencyChains: plan.dependencyChains.map((c) => [...c]),
    conflicts,
    estimatedParallelism: plan.estimatedParallelism,
    recommendations: [...new Set(recommendations)],
    generatedAt: Date.now(),
  };
}

export function resetOrchestrationReportCounterForTests(): void {
  reportCounter = 0;
}
