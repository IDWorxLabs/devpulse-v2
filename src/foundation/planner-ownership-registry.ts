/**
 * Planner ownership registry — Phase 24XB.
 * world2_execution_planner owns project plans (planSource: builder).
 * autonomous_builder_execution_planner owns repair plans (planSource: repair).
 * No third planner.
 */

import type { OwnershipDomain } from './types.js';

export type PlannerPlanSource = 'builder' | 'repair';

export interface PlannerOwnershipRule {
  planSource: PlannerPlanSource;
  ownerDomain: OwnershipDomain;
  ownerModule: string;
  scope: string;
}

export const PLANNER_OWNERSHIP_RULES: Readonly<Record<PlannerPlanSource, PlannerOwnershipRule>> = {
  builder: {
    planSource: 'builder',
    ownerDomain: 'world2_execution_planner',
    ownerModule: 'devpulse_v2_world2_execution_planner',
    scope: 'project plans',
  },
  repair: {
    planSource: 'repair',
    ownerDomain: 'autonomous_builder_execution_planner',
    ownerModule: 'devpulse_autonomous_builder_execution_planner',
    scope: 'repair plans',
  },
} as const;

export const PLANNER_OWNERSHIP_PASS_TOKEN = 'PLANNER_OWNERSHIP_RULES_ENFORCED';

export function resolvePlannerOwnerForPlanSource(planSource: PlannerPlanSource): PlannerOwnershipRule {
  return PLANNER_OWNERSHIP_RULES[planSource];
}

export function assertPlannerOwnership(planSource: PlannerPlanSource, domain: OwnershipDomain): boolean {
  return PLANNER_OWNERSHIP_RULES[planSource].ownerDomain === domain;
}

export function assertNoThirdPlanner(domain: OwnershipDomain): boolean {
  return (
    domain === PLANNER_OWNERSHIP_RULES.builder.ownerDomain ||
    domain === PLANNER_OWNERSHIP_RULES.repair.ownerDomain
  );
}
