/**
 * ASE Enforcement — adaptive routing from decisions to actions.
 */

import type {
  EngineeringActionType,
  EngineeringDecision,
  EngineeringDecisionType,
} from './ase-enforcement-engine-types.js';

export function routeEngineeringAction(decision: EngineeringDecision): EngineeringActionType {
  if (decision.recoveryRoute) return decision.recoveryRoute;
  return mapDecisionToAction(decision.decision);
}

export function mapDecisionToAction(decision: EngineeringDecisionType): EngineeringActionType {
  switch (decision) {
    case 'CONTINUE_BUILD':
      return 'MATERIALIZATION';
    case 'RUN_VALIDATION':
      return 'BEHAVIOR_SIMULATION';
    case 'RUN_BEHAVIOR_SIMULATION':
      return 'BEHAVIOR_SIMULATION';
    case 'RUN_VIRTUAL_USERS':
      return 'VIRTUAL_USER';
    case 'RUN_VIRTUAL_DEVICES':
      return 'VIRTUAL_DEVICE';
    case 'RUN_INTERACTION_PROOF':
      return 'INTERACTION_PROOF';
    case 'RUN_AUTONOMOUS_DEBUGGING':
      return 'AUTONOMOUS_DEBUGGING';
    case 'RUN_CAPABILITY_EVOLUTION':
      return 'MISSING_CAPABILITY_EVOLUTION';
    case 'RUN_CONTINUOUS_IMPROVEMENT':
      return 'CONTINUOUS_IMPROVEMENT';
    case 'RETRY_LAST_STEP':
      return 'RETRY';
    case 'ROLLBACK_TO_LAST_STABLE_STATE':
      return 'ROLLBACK';
    case 'ESCALATE_TO_HUMAN_REVIEW':
      return 'HUMAN_REVIEW';
    case 'READY_FOR_LAUNCH':
      return 'LAUNCH_READINESS';
    case 'STOP_ENGINEERING':
      return 'HUMAN_REVIEW';
    default:
      return 'INCREMENTAL_BUILD';
  }
}
