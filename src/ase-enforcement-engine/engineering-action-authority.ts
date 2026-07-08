/**
 * ASE Enforcement — sole module authorized to permit engineering actions.
 */

import type {
  EngineeringActionType,
  EngineeringDecision,
} from './ase-enforcement-engine-types.js';
import {
  getEngineeringActionLog,
  recordEngineeringAction,
  resetEngineeringExecutionMonitorForTests,
  updateEngineeringActionStatus,
} from './engineering-execution-monitor.js';

let lastDecision: EngineeringDecision | null = null;

const DECISION_ACTION_ALLOWLIST: Partial<Record<EngineeringDecision['decision'], readonly EngineeringActionType[]>> = {
  CONTINUE_BUILD: ['MATERIALIZATION', 'INCREMENTAL_BUILD', 'INTENT_UNDERSTANDING', 'PROMPT_FAITHFULNESS', 'CAPABILITY_PLANNING'],
  RUN_VALIDATION: ['BEHAVIOR_SIMULATION', 'VIRTUAL_USER', 'VIRTUAL_DEVICE', 'INTERACTION_PROOF', 'LAUNCH_READINESS'],
  RUN_BEHAVIOR_SIMULATION: ['BEHAVIOR_SIMULATION'],
  RUN_VIRTUAL_USERS: ['VIRTUAL_USER'],
  RUN_VIRTUAL_DEVICES: ['VIRTUAL_DEVICE'],
  RUN_INTERACTION_PROOF: ['INTERACTION_PROOF'],
  RUN_AUTONOMOUS_DEBUGGING: ['AUTONOMOUS_DEBUGGING', 'REPAIR'],
  RUN_CAPABILITY_EVOLUTION: ['MISSING_CAPABILITY_EVOLUTION'],
  RUN_CONTINUOUS_IMPROVEMENT: ['CONTINUOUS_IMPROVEMENT'],
  RETRY_LAST_STEP: ['RETRY', 'REPAIR'],
  ROLLBACK_TO_LAST_STABLE_STATE: ['ROLLBACK'],
  READY_FOR_LAUNCH: ['LAUNCH_READINESS', 'LIVE_PREVIEW_GATE', 'MATERIALIZATION'],
};

export function resetEngineeringActionAuthorityForTests(): void {
  lastDecision = null;
  resetEngineeringExecutionMonitorForTests();
}

export function setLastEngineeringDecision(decision: EngineeringDecision): void {
  lastDecision = decision;
}

export function getLastEngineeringDecision(): EngineeringDecision | null {
  return lastDecision;
}

export function requestEngineeringAction(input: {
  actionType: EngineeringActionType;
  reason: string;
}): { authorized: boolean; actionId: string; deniedReason: string | null } {
  const decision = lastDecision;
  if (!decision) {
    const record = recordEngineeringAction(input.actionType, 'FAILED', 'No ASE decision available.');
    return { authorized: false, actionId: record.actionId, deniedReason: 'No ASE decision available.' };
  }

  if (!decision.authorized) {
    const record = recordEngineeringAction(input.actionType, 'FAILED', decision.reason);
    return { authorized: false, actionId: record.actionId, deniedReason: decision.reason };
  }

  const allowed = DECISION_ACTION_ALLOWLIST[decision.decision];
  const authorized =
    !allowed ||
    allowed.includes(input.actionType) ||
    (decision.recoveryRoute !== null && decision.recoveryRoute === input.actionType);

  if (!authorized) {
    const record = recordEngineeringAction(
      input.actionType,
      'FAILED',
      `ASE denied ${input.actionType}: ${decision.reason}`,
    );
    return {
      authorized: false,
      actionId: record.actionId,
      deniedReason: `ASE denied ${input.actionType}`,
    };
  }

  const record = recordEngineeringAction(input.actionType, 'RUNNING', input.reason);
  return { authorized: true, actionId: record.actionId, deniedReason: null };
}

export function completeEngineeringAction(actionId: string, success: boolean, detail: string): void {
  updateEngineeringActionStatus(actionId, success ? 'COMPLETED' : 'FAILED', detail);
}

export function engineeringDecisionAllowsAction(
  decision: EngineeringDecision,
  actionType: EngineeringActionType,
): boolean {
  if (!decision.authorized) return false;
  if (decision.decision === 'ESCALATE_TO_HUMAN_REVIEW' || decision.decision === 'STOP_ENGINEERING') {
    return false;
  }
  const allowed = DECISION_ACTION_ALLOWLIST[decision.decision];
  return (
    !allowed ||
    allowed.includes(actionType) ||
    (decision.recoveryRoute !== null && decision.recoveryRoute === actionType)
  );
}

export function authorizeMaterialization(decision: EngineeringDecision, evidenceReady: boolean): boolean {
  return evidenceReady && engineeringDecisionAllowsAction(decision, 'MATERIALIZATION');
}

export function getAuthorizedActionLog(): readonly import('./ase-enforcement-engine-types.js').EngineeringActionRecord[] {
  return getEngineeringActionLog();
}
