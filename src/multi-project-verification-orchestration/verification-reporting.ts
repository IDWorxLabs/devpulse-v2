/**
 * Multi Project Verification Orchestration — reporting.
 */

import type {
  VerificationOrchestrationPlan,
  VerificationOrchestrationProjectInput,
  VerificationOrchestrationReport,
} from './verification-orchestration-types.js';
import { detectVerificationConflicts } from './verification-conflict-detector.js';
import { buildVerificationDependencyChains } from './verification-dependency-manager.js';
import { evaluateVerificationCapacity } from './verification-capacity-evaluator.js';

let reportCounter = 0;

export function generateVerificationOrchestrationReport(
  plan: VerificationOrchestrationPlan,
  projects?: VerificationOrchestrationProjectInput[],
): VerificationOrchestrationReport {
  reportCounter += 1;

  const dependencyResult = projects
    ? buildVerificationDependencyChains(projects)
    : { chains: plan.dependencyChains, cycles: [], invalid: [], missing: [] };

  const conflicts = projects
    ? detectVerificationConflicts(projects, dependencyResult, plan.groups)
    : [];

  const capacity = projects ? evaluateVerificationCapacity(projects) : { bottlenecks: [], estimatedParallelism: plan.estimatedVerificationParallelism, safeLimit: 1 };

  const projectCount = plan.groups.reduce((sum, g) => sum + g.projectIds.length, 0);

  const recommendations: string[] = [];
  if (plan.blockedProjects.length > 0) {
    recommendations.push(`Resolve ${plan.blockedProjects.length} blocked project(s)`);
  }
  if (plan.waitingProjects.length > 0) {
    recommendations.push(`Monitor ${plan.waitingProjects.length} waiting project(s) for dependency completion`);
  }
  for (const bottleneck of capacity.bottlenecks) {
    recommendations.push(`Address bottleneck: ${bottleneck}`);
  }
  for (const c of conflicts) {
    recommendations.push(c.recommendedAction);
  }
  if (recommendations.length === 0) {
    recommendations.push('Verification orchestration plan ready for portfolio coordination');
  }

  return {
    reportId: `verification-orchestration-report-${reportCounter}`,
    planId: plan.planId,
    projectCount,
    groups: plan.groups.map((g) => ({ ...g, projectIds: [...g.projectIds] })),
    dependencyChains: plan.dependencyChains.map((c) => [...c]),
    readyProjects: [...plan.readyProjects],
    waitingProjects: [...plan.waitingProjects],
    blockedProjects: [...plan.blockedProjects],
    conflicts,
    bottlenecks: capacity.bottlenecks,
    estimatedParallelism: plan.estimatedVerificationParallelism,
    recommendations: [...new Set(recommendations)],
    generatedAt: Date.now(),
  };
}

export function resetVerificationOrchestrationReportCounterForTests(): void {
  reportCounter = 0;
}
