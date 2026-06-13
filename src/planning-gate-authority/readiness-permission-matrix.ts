/**
 * Readiness Permission Matrix — Planning Gate downstream readiness caps (V1).
 */

import type { PlanningGateDecision } from './planning-gate-types.js';

export type DownstreamAuthorityKind =
  | 'PLANNING_BRIEF'
  | 'ARCHITECTURE_BRIEF'
  | 'BUILD_PLAN'
  | 'FOUNDER_TEST';

export const GATE_READINESS_PERMISSIONS: Record<
  PlanningGateDecision,
  Record<DownstreamAuthorityKind, string>
> = {
  REJECT_PLANNING: {
    PLANNING_BRIEF: 'NOT_READY',
    ARCHITECTURE_BRIEF: 'NOT_READY',
    BUILD_PLAN: 'NOT_READY',
    FOUNDER_TEST: 'NOT_READY',
  },
  REQUEST_CLARIFICATION: {
    PLANNING_BRIEF: 'DRAFT_READY',
    ARCHITECTURE_BRIEF: 'NOT_READY',
    BUILD_PLAN: 'NOT_READY',
    FOUNDER_TEST: 'HIGH_RISK',
  },
  ALLOW_LIMITED_PLANNING: {
    PLANNING_BRIEF: 'DRAFT_READY',
    ARCHITECTURE_BRIEF: 'ARCHITECTURE_DRAFT_READY',
    BUILD_PLAN: 'DRAFT_BUILD_PLAN',
    FOUNDER_TEST: 'READY_WITH_ACTIONS',
  },
  ALLOW_FULL_PLANNING: {
    PLANNING_BRIEF: 'PLANNING_READY',
    ARCHITECTURE_BRIEF: 'ARCHITECTURE_READY',
    BUILD_PLAN: 'READY_FOR_EXECUTION_PLANNING',
    FOUNDER_TEST: 'READY_FOR_EXECUTION',
  },
};

const READINESS_RANK: Record<string, number> = {
  NOT_READY: 0,
  HIGH_RISK: 1,
  NEEDS_CLARIFICATION: 1,
  INSUFFICIENT: 1,
  DRAFT_READY: 2,
  READY_WITH_GAPS: 2,
  ALLOW_LIMITED_PLANNING: 2,
  PLANNING_READY: 3,
  READY_WITH_ACTIONS: 3,
  READY_FOR_PLANNING: 3,
  ARCHITECTURE_DRAFT_READY: 4,
  DRAFT_BUILD_PLAN: 4,
  ARCHITECTURE_READY: 5,
  READY_FOR_EXECUTION_PLANNING: 5,
  READY_FOR_EXECUTION: 6,
  READY_FOR_EXECUTION_GATE: 6,
};

export function readinessRank(readiness: string): number {
  const upper = readiness.toUpperCase();
  if (READINESS_RANK[upper] != null) return READINESS_RANK[upper];
  for (const [key, rank] of Object.entries(READINESS_RANK)) {
    if (upper.includes(key)) return rank;
  }
  return 0;
}

export function getMaxAllowedReadiness(
  gateDecision: PlanningGateDecision,
  authorityKind: DownstreamAuthorityKind,
): string {
  return GATE_READINESS_PERMISSIONS[gateDecision][authorityKind];
}

export function capReadinessToGatePermission<T extends string>(
  gateDecision: PlanningGateDecision,
  authorityKind: DownstreamAuthorityKind,
  readiness: T,
): T {
  const maxAllowed = getMaxAllowedReadiness(gateDecision, authorityKind);
  if (readinessRank(readiness) <= readinessRank(maxAllowed)) return readiness;
  return maxAllowed as T;
}

export function isReadinessEscalation(
  gateDecision: PlanningGateDecision,
  authorityKind: DownstreamAuthorityKind,
  readiness: string,
): boolean {
  return readinessRank(readiness) > readinessRank(getMaxAllowedReadiness(gateDecision, authorityKind));
}

export function gateDecisionToAuthorityKind(
  authorityId: string,
): DownstreamAuthorityKind | null {
  switch (authorityId) {
    case 'PLANNING_BRIEF_GENERATOR':
      return 'PLANNING_BRIEF';
    case 'ARCHITECTURE_BRIEF_GENERATOR':
      return 'ARCHITECTURE_BRIEF';
    case 'BUILD_PLAN_GENERATOR':
      return 'BUILD_PLAN';
    case 'FOUNDER_TEST_AUTOMATION':
      return 'FOUNDER_TEST';
    default:
      return null;
  }
}
