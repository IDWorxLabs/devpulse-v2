/**
 * World 2 execution planner founder-readable report.
 */

import type { ExecutionPlan, World2ExecutionPlannerState, World2PlannerReport } from './types.js';
import { WORLD2_EXECUTION_PLANNER_OWNER_MODULE } from './types.js';

export function buildWorld2PlannerReport(
  state: World2ExecutionPlannerState,
  plan: ExecutionPlan,
): World2PlannerReport {
  return {
    ownerModule: WORLD2_EXECUTION_PLANNER_OWNER_MODULE,
    planId: plan.planId,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    stageCount: plan.executionStages.length,
    riskCount: plan.riskItems.length,
    verificationCount: plan.verificationPoints.length,
    rollbackCount: plan.rollbackPoints.length,
    completionCount: plan.completionCriteria.length,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'World 2 Execution Planner V1 — planning only. No execution, file modification, or code generation.',
  };
}

export function formatWorld2PlannerReport(
  state: World2ExecutionPlannerState,
  plan: ExecutionPlan,
): string {
  const report = buildWorld2PlannerReport(state, plan);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'World 2 Execution Planner Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Planner ID: ${state.plannerId}`,
    `Plan ID: ${report.planId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Stage count: ${report.stageCount}`,
    `Risk count: ${report.riskCount}`,
    `Verification count: ${report.verificationCount}`,
    `Rollback count: ${report.rollbackCount}`,
    `Completion criteria count: ${report.completionCount}`,
    '',
    'Planning-only confirmations:',
    '  Planning only: CONFIRMED',
    '  No execution performed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '',
    `Next recommended step: ${plan.nextRecommendedStep}`,
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
