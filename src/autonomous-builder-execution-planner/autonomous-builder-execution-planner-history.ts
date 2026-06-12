/**
 * Autonomous Builder Execution Planner — bounded planning history.
 */

import { MAX_EXECUTION_PLANNER_HISTORY } from './autonomous-builder-execution-planner-registry.js';
import type {
  ExecutionPlannerAssessment,
  ExecutionPlannerHistorySummary,
  ExecutionPlanType,
} from './autonomous-builder-execution-planner-types.js';

const history: ExecutionPlannerAssessment[] = [];

export function resetAutonomousBuilderExecutionPlannerHistoryForTests(): void {
  history.length = 0;
}

export function recordExecutionPlannerAssessment(assessment: ExecutionPlannerAssessment): void {
  history.push(assessment);
  while (history.length > MAX_EXECUTION_PLANNER_HISTORY) {
    history.shift();
  }
}

export function getExecutionPlannerHistorySize(): number {
  return history.length;
}

export function getLatestExecutionPlannerAssessment(): ExecutionPlannerAssessment | null {
  return history.at(-1) ?? null;
}

export function getExecutionPlannerHistory(): readonly ExecutionPlannerAssessment[] {
  return history;
}

export function buildExecutionPlannerHistorySummary(
  assessments: readonly ExecutionPlannerAssessment[] = history,
): ExecutionPlannerHistorySummary {
  const summary: ExecutionPlannerHistorySummary = {
    totalPlansGenerated: 0,
    fixPlans: 0,
    rollbackPlans: 0,
    escalationPlans: 0,
    validationPlans: 0,
    retestPlans: 0,
    refactorPlans: 0,
    nonExecutablePlans: 0,
  };

  for (const item of assessments) {
    if (!item.plan) {
      summary.nonExecutablePlans += 1;
      continue;
    }
    summary.totalPlansGenerated += 1;
    switch (item.plan.planType) {
      case 'FIX_PLAN':
        summary.fixPlans += 1;
        break;
      case 'ROLLBACK_PLAN':
        summary.rollbackPlans += 1;
        break;
      case 'ESCALATION_PLAN':
        summary.escalationPlans += 1;
        break;
      case 'VALIDATION_PLAN':
        summary.validationPlans += 1;
        break;
      case 'RETEST_PLAN':
        summary.retestPlans += 1;
        break;
      case 'REFACTOR_PLAN':
        summary.refactorPlans += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function countPlansByType(
  planType: ExecutionPlanType,
  assessments: readonly ExecutionPlannerAssessment[] = history,
): number {
  return assessments.filter((item) => item.plan?.planType === planType).length;
}
