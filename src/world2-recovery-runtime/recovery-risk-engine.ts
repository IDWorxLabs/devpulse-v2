/**
 * Recovery risk engine — classifies recovery step and plan risk.
 */

import type {
  EscalationLevel,
  RecoveryRiskLevel,
  RecoveryState,
  RecoveryStep,
  RecoveryStrategy,
} from './types.js';
import { ALLOWED_RECOVERY_STRATEGIES, BLOCKED_RECOVERY_STRATEGIES } from './types.js';

let stepCounter = 0;

function nextStepId(): string {
  stepCounter += 1;
  return `rcstep-${stepCounter.toString().padStart(4, '0')}`;
}

export function resetRecoveryStepCounterForTests(): void {
  stepCounter = 0;
}

function isAllowedStrategy(strategy: RecoveryStrategy): boolean {
  return (ALLOWED_RECOVERY_STRATEGIES as readonly string[]).includes(strategy);
}

function isBlockedStrategy(strategy: RecoveryStrategy): boolean {
  return (BLOCKED_RECOVERY_STRATEGIES as readonly string[]).includes(strategy);
}

function isCriticalRecovery(
  strategy: RecoveryStrategy,
  targetArea: string,
  title: string,
): boolean {
  const text = `${strategy} ${targetArea} ${title}`.toLowerCase();
  return (
    isBlockedStrategy(strategy) ||
    text.includes('world1') ||
    text.includes('world 1') ||
    text.includes('git reset') ||
    text.includes('git checkout') ||
    text.includes('shell') ||
    text.includes('execute_command') ||
    text.includes('write_file') ||
    text.includes('delete_file') ||
    text.includes('apply_patch') ||
    text.includes('run_test') ||
    text.includes('direct action') ||
    text.includes('approval bypass') ||
    text.includes('duplicate authority') ||
    text.includes('constitutional') ||
    text.includes('workspace escape') ||
    text.includes('repeat same strategy')
  );
}

function baseRisk(strategy: RecoveryStrategy, escalation: EscalationLevel): RecoveryRiskLevel {
  if (isBlockedStrategy(strategy)) return 'CRITICAL';
  if (escalation === 'SELF_EVOLUTION_REVIEW') return 'HIGH';
  if (escalation === 'MULTI_GATE' || escalation === 'CONSTITUTION') return 'HIGH';
  if (strategy === 'MARK_UNSAFE_AND_ABORT_PROPOSAL') return 'HIGH';
  if (strategy === 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL') return 'HIGH';
  if (strategy === 'CREATE_DIAGNOSTIC_REPORT_PROPOSAL') return 'LOW';
  if (strategy === 'STOP_AND_REPORT_PROPOSAL') return 'MEDIUM';
  return 'MEDIUM';
}

function stateForStep(critical: boolean, needsApproval: boolean, escalation: EscalationLevel): RecoveryState {
  if (critical) return 'BLOCKED';
  if (escalation === 'SELF_EVOLUTION_REVIEW') return 'ESCALATION_REQUIRED';
  if (needsApproval) return 'WAITING_APPROVAL';
  return 'READY_FOR_FUTURE_RECOVERY';
}

export function buildRecoverySteps(opts: {
  recoveryStrategy: RecoveryStrategy;
  escalationLevel: EscalationLevel;
  failurePath: string;
  strategyRepeated: boolean;
}): RecoveryStep[] {
  const steps: RecoveryStep[] = [];

  const primaryCritical =
    isCriticalRecovery(opts.recoveryStrategy, opts.failurePath, opts.recoveryStrategy) ||
    opts.strategyRepeated;
  const primaryAllowed = isAllowedStrategy(opts.recoveryStrategy) && !primaryCritical;
  const primaryRisk = primaryCritical ? 'CRITICAL' : baseRisk(opts.recoveryStrategy, opts.escalationLevel);
  const primaryNeedsApproval = opts.escalationLevel !== 'NONE';

  steps.push({
    stepId: nextStepId(),
    title: `Recovery proposal: ${opts.recoveryStrategy}`,
    targetArea: opts.failurePath,
    recoveryAction: opts.recoveryStrategy,
    riskLevel: primaryRisk,
    escalationLevel: opts.escalationLevel,
    recoveryState: stateForStep(primaryCritical, primaryNeedsApproval, opts.escalationLevel),
    blockedReason: primaryAllowed
      ? null
      : `Recovery action ${opts.recoveryStrategy} blocked in Phase 15.5 — proposal only`,
  });

  steps.push({
    stepId: nextStepId(),
    title: 'Create diagnostic report proposal',
    targetArea: 'operator-feed',
    recoveryAction: 'CREATE_DIAGNOSTIC_REPORT_PROPOSAL',
    riskLevel: 'LOW',
    escalationLevel: 'NONE',
    recoveryState: 'READY_FOR_FUTURE_RECOVERY',
    blockedReason: null,
  });

  if (opts.escalationLevel === 'SELF_EVOLUTION_REVIEW') {
    steps.push({
      stepId: nextStepId(),
      title: 'Escalate to self-evolution review proposal',
      targetArea: 'self-evolution-foundation',
      recoveryAction: 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL',
      riskLevel: 'HIGH',
      escalationLevel: 'SELF_EVOLUTION_REVIEW',
      recoveryState: 'ESCALATION_REQUIRED',
      blockedReason: null,
    });
  }

  return steps;
}

export function aggregateRecoveryRisk(steps: RecoveryStep[]): RecoveryRiskLevel {
  const order: RecoveryRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  let aggregate: RecoveryRiskLevel = 'LOW';
  for (const step of steps) {
    if (order.indexOf(step.riskLevel) > order.indexOf(aggregate)) {
      aggregate = step.riskLevel;
    }
  }
  return aggregate;
}

export function hasCriticalRecoveryViolation(steps: RecoveryStep[]): boolean {
  return steps.some((s) => s.riskLevel === 'CRITICAL' || s.recoveryState === 'BLOCKED');
}
