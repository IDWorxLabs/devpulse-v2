/**
 * Autonomous Builder Execution Planner — constants and plan mappings.
 */

import type { RepairLoopAction } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import type {
  ExecutionPlanComplexity,
  ExecutionPlanRiskLevel,
  ExecutionPlanType,
} from './autonomous-builder-execution-planner-types.js';

export const AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN =
  'AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS';
export const AUTONOMOUS_BUILDER_EXECUTION_PLANNER_OWNER_MODULE =
  'devpulse_autonomous_builder_execution_planner';
export const AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PHASE =
  'Phase 24I — Autonomous Builder Execution Planner';
export const AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REPORT_TITLE =
  'AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REPORT';
export const EXECUTION_PLANNER_CACHE_KEY_PREFIX = 'autonomous-builder-execution-planner-v1';
export const MAX_EXECUTION_PLANNER_HISTORY = 16;
export const MAX_PLAN_STEPS = 12;
export const MAX_SUCCESS_CRITERIA = 8;

export const EXECUTION_PLANNER_CORE_QUESTION =
  'Given a repair decision: what exact plan should be executed?';

export const EXECUTION_PLAN_TYPES: readonly ExecutionPlanType[] = [
  'FIX_PLAN',
  'REFACTOR_PLAN',
  'VALIDATION_PLAN',
  'RETEST_PLAN',
  'ROLLBACK_PLAN',
  'ESCALATION_PLAN',
] as const;

export const EXECUTION_PLAN_RISK_LEVELS: readonly ExecutionPlanRiskLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export const EXECUTION_PLAN_COMPLEXITIES: readonly ExecutionPlanComplexity[] = [
  'TRIVIAL',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'VERY_LARGE',
] as const;

export const REPAIR_ACTION_TO_PLAN_TYPE: Record<RepairLoopAction, ExecutionPlanType | null> = {
  RETRY_FIX: 'VALIDATION_PLAN',
  APPLY_DIFFERENT_FIX: 'FIX_PLAN',
  REVERT_FIX: 'ROLLBACK_PLAN',
  ESCALATE: 'ESCALATION_PLAN',
  RETEST: 'RETEST_PLAN',
  ACCEPT_FIX: 'VALIDATION_PLAN',
  STOP: null,
};

export function mapRepairActionToPlanType(action: RepairLoopAction): ExecutionPlanType | null {
  return REPAIR_ACTION_TO_PLAN_TYPE[action];
}

export function isExecutionPlanType(value: string): value is ExecutionPlanType {
  return (EXECUTION_PLAN_TYPES as readonly string[]).includes(value);
}

export function riskFromFindingSeverity(
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined,
): ExecutionPlanRiskLevel {
  return severity ?? 'MEDIUM';
}

export function complexityFromPlan(
  planType: ExecutionPlanType,
  riskLevel: ExecutionPlanRiskLevel,
): ExecutionPlanComplexity {
  if (planType === 'ESCALATION_PLAN' || planType === 'VALIDATION_PLAN') {
    return riskLevel === 'CRITICAL' ? 'SMALL' : 'TRIVIAL';
  }
  if (planType === 'RETEST_PLAN') return 'SMALL';
  if (planType === 'ROLLBACK_PLAN') return 'MEDIUM';
  if (planType === 'FIX_PLAN') {
    if (riskLevel === 'CRITICAL') return 'VERY_LARGE';
    if (riskLevel === 'HIGH') return 'LARGE';
    if (riskLevel === 'MEDIUM') return 'MEDIUM';
    return 'SMALL';
  }
  if (planType === 'REFACTOR_PLAN') return 'LARGE';
  return 'SMALL';
}
