/**
 * Rollback risk engine — classifies rollback step and plan risk.
 */

import type { ControlledApplyStep } from '../world2-controlled-apply-runtime/types.js';
import { mapApplyStepToRollbackAction } from './rollback-impact-analyzer.js';
import type {
  RollbackAction,
  RollbackApprovalLevel,
  RollbackRiskLevel,
  RollbackState,
  RollbackStep,
} from './types.js';
import { ALLOWED_ROLLBACK_ACTIONS, BLOCKED_ROLLBACK_ACTIONS } from './types.js';

let stepCounter = 0;

function nextStepId(): string {
  stepCounter += 1;
  return `rbstep-${stepCounter.toString().padStart(4, '0')}`;
}

export function resetRollbackStepCounterForTests(): void {
  stepCounter = 0;
}

function isAllowedAction(action: RollbackAction): boolean {
  return (ALLOWED_ROLLBACK_ACTIONS as readonly string[]).includes(action);
}

function isBlockedAction(action: RollbackAction): boolean {
  return (BLOCKED_ROLLBACK_ACTIONS as readonly string[]).includes(action);
}

function isCriticalRollback(
  action: RollbackAction,
  targetArea: string,
  title: string,
): boolean {
  const text = `${action} ${targetArea} ${title}`.toLowerCase();
  return (
    isBlockedAction(action) ||
    text.includes('world1') ||
    text.includes('world 1') ||
    text.includes('git reset') ||
    text.includes('git checkout') ||
    text.includes('shell') ||
    text.includes('execute_command') ||
    text.includes('delete_file') ||
    text.includes('direct restore') ||
    text.includes('approval bypass') ||
    text.includes('duplicate authority') ||
    text.includes('constitutional') ||
    text.includes('workspace escape')
  );
}

function baseRisk(action: RollbackAction, applyRisk: string): RollbackRiskLevel {
  if (isBlockedAction(action)) return 'CRITICAL';
  if (applyRisk === 'CRITICAL') return 'HIGH';
  if (applyRisk === 'HIGH') return 'HIGH';
  if (action === 'RESTORE_SNAPSHOT_PROPOSAL') return 'MEDIUM';
  if (action === 'REPORT_ROLLBACK_RESULT') return 'LOW';
  return 'MEDIUM';
}

function approvalForRisk(risk: RollbackRiskLevel): RollbackApprovalLevel {
  switch (risk) {
    case 'LOW':
      return 'NONE';
    case 'MEDIUM':
      return 'TASK_GOVERNOR';
    case 'HIGH':
      return 'FOUNDER';
    case 'CRITICAL':
      return 'MULTI_GATE';
    default:
      return 'TASK_GOVERNOR';
  }
}

function stateForStep(critical: boolean, needsApproval: boolean): RollbackState {
  if (critical) return 'BLOCKED';
  if (needsApproval) return 'WAITING_APPROVAL';
  return 'READY_FOR_FUTURE_ROLLBACK';
}

export function buildRollbackSteps(applySteps: ControlledApplyStep[]): RollbackStep[] {
  const steps: RollbackStep[] = applySteps.map((applyStep) => {
    const rollbackAction = mapApplyStepToRollbackAction(applyStep);
    const critical = isCriticalRollback(rollbackAction, applyStep.targetArea, applyStep.title);
    const allowed = isAllowedAction(rollbackAction) && !critical;
    const riskLevel = critical ? 'CRITICAL' : baseRisk(rollbackAction, applyStep.riskLevel);
    const approvalLevel = approvalForRisk(riskLevel);
    const needsApproval = approvalLevel !== 'NONE';

    return {
      stepId: nextStepId(),
      title: `Rollback proposal for: ${applyStep.title}`,
      targetArea: applyStep.targetArea,
      sourceApplyStep: applyStep.stepId,
      rollbackAction,
      riskLevel,
      approvalLevel,
      rollbackState: stateForStep(critical, needsApproval),
      blockedReason: allowed
        ? null
        : `Rollback action ${rollbackAction} blocked in Phase 15.4 — proposal only`,
    };
  });

  steps.push({
    stepId: nextStepId(),
    title: 'Report rollback readiness',
    targetArea: 'operator-feed',
    sourceApplyStep: 'summary',
    rollbackAction: 'REPORT_ROLLBACK_RESULT',
    riskLevel: 'LOW',
    approvalLevel: 'NONE',
    rollbackState: 'READY_FOR_FUTURE_ROLLBACK',
    blockedReason: null,
  });

  return steps;
}

export function aggregateRollbackRisk(steps: RollbackStep[]): RollbackRiskLevel {
  const order: RollbackRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  let aggregate: RollbackRiskLevel = 'LOW';
  for (const step of steps) {
    if (order.indexOf(step.riskLevel) > order.indexOf(aggregate)) {
      aggregate = step.riskLevel;
    }
  }
  return aggregate;
}

export function hasCriticalRollbackViolation(steps: RollbackStep[]): boolean {
  return steps.some((s) => s.riskLevel === 'CRITICAL' || s.rollbackState === 'BLOCKED');
}
