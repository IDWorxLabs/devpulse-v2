/**
 * Controlled apply risk engine — classifies apply step and plan risk.
 */

import type { BuilderPacketExecutionStep } from '../world2-builder-packet-execution/types.js';
import type {
  ControlledApplyApprovalLevel,
  ControlledApplyRiskLevel,
  ControlledApplyState,
  ControlledApplyStep,
} from './types.js';

let stepCounter = 0;

function nextStepId(): string {
  stepCounter += 1;
  return `castep-${stepCounter.toString().padStart(4, '0')}`;
}

export function resetControlledApplyStepCounterForTests(): void {
  stepCounter = 0;
}

function escalate(current: ControlledApplyRiskLevel, next: ControlledApplyRiskLevel): ControlledApplyRiskLevel {
  const order: ControlledApplyRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

function isCriticalStep(step: BuilderPacketExecutionStep): boolean {
  const text = `${step.title} ${step.description} ${step.targetArea} ${step.stepType}`.toLowerCase();
  return (
    step.riskLevel === 'CRITICAL' ||
    !step.allowedInThisPhase ||
    text.includes('world1') ||
    text.includes('world 1') ||
    text.includes('direct file write') ||
    text.includes('writefilesync') ||
    text.includes('shell') ||
    text.includes('delete') ||
    text.includes('approval bypass') ||
    text.includes('duplicate authority') ||
    text.includes('constitutional') ||
    text.includes('workspace escape') ||
    text.includes('hidden execution')
  );
}

function approvalLevelForRisk(risk: ControlledApplyRiskLevel): ControlledApplyApprovalLevel {
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

function applyStateForStep(step: BuilderPacketExecutionStep, critical: boolean): ControlledApplyState {
  if (critical || !step.allowedInThisPhase) return 'BLOCKED';
  if (step.requiresApproval) return 'WAITING_APPROVAL';
  return 'READY_FOR_FUTURE_APPLY';
}

export function buildControlledApplySteps(
  executionSteps: BuilderPacketExecutionStep[],
): ControlledApplyStep[] {
  return executionSteps.map((execStep) => {
    const critical = isCriticalStep(execStep);
    const riskLevel: ControlledApplyRiskLevel = critical
      ? 'CRITICAL'
      : (execStep.riskLevel as ControlledApplyRiskLevel);
    const approvalLevel = approvalLevelForRisk(riskLevel);
    const applyState = applyStateForStep(execStep, critical);

    return {
      stepId: nextStepId(),
      title: execStep.title,
      sourceExecutionStep: execStep.stepId,
      targetArea: execStep.targetArea,
      riskLevel,
      approvalLevel,
      applyState,
      blockedReason: critical
        ? `Critical apply risk — ${execStep.stepType} blocked in Phase 15.3`
        : execStep.blockedReason,
    };
  });
}

export function aggregateControlledApplyRisk(steps: ControlledApplyStep[]): ControlledApplyRiskLevel {
  let aggregate: ControlledApplyRiskLevel = 'LOW';
  for (const step of steps) {
    aggregate = escalate(aggregate, step.riskLevel);
  }
  return aggregate;
}

export function hasCriticalApplyViolation(steps: ControlledApplyStep[]): boolean {
  return steps.some((s) => s.riskLevel === 'CRITICAL' || s.applyState === 'BLOCKED');
}
