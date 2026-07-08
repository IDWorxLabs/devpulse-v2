/**
 * ASE Enforcement — recovery routing for engineering failures.
 */

import { routeAseFailure } from '../autonomous-software-engineering-engine/ase-failure-router.js';
import type { AseStageId } from '../autonomous-software-engineering-engine/ase-types.js';
import type { EngineeringActionType, EngineeringRecoveryPlan } from './ase-enforcement-engine-types.js';

const ROUTE_MAP: Record<string, EngineeringRecoveryPlan['route']> = {
  AUTONOMOUS_DEBUGGING: 'AUTONOMOUS_DEBUGGING',
  MISSING_CAPABILITY_EVOLUTION: 'CAPABILITY_EVOLUTION',
  HUMAN_REVIEW: 'HUMAN_REVIEW',
  EVIDENCE_REGENERATION: 'VALIDATION_REPLAY',
  CONTINUOUS_IMPROVEMENT: 'VALIDATION_REPLAY',
  LAUNCH_READINESS_AUTHORITY: 'VALIDATION_REPLAY',
  LIVE_PREVIEW_GATE: 'VALIDATION_REPLAY',
};

export function routeEngineeringRecovery(input: {
  failedStage: AseStageId;
  failure: string;
  evidenceId: string | null;
}): EngineeringRecoveryPlan {
  const route = routeAseFailure({
    stageId: input.failedStage,
    failure: input.failure,
    evidenceId: input.evidenceId,
  });

  const recoveryRoute = ROUTE_MAP[route.destination] ?? 'AUTONOMOUS_DEBUGGING';

  return {
    readOnly: true,
    route: recoveryRoute,
    reason: route.reason,
    retryAuthorized: recoveryRoute !== 'HUMAN_REVIEW',
  };
}

export function mapRecoveryToAction(route: EngineeringRecoveryPlan['route']): EngineeringActionType {
  switch (route) {
    case 'AUTONOMOUS_DEBUGGING':
      return 'AUTONOMOUS_DEBUGGING';
    case 'CAPABILITY_EVOLUTION':
      return 'MISSING_CAPABILITY_EVOLUTION';
    case 'VALIDATION_REPLAY':
      return 'INTERACTION_PROOF';
    case 'ROLLBACK':
      return 'ROLLBACK';
    case 'HUMAN_REVIEW':
      return 'HUMAN_REVIEW';
    default:
      return 'RETRY';
  }
}
