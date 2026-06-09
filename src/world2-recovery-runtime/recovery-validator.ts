/**
 * Recovery validator — validates recovery plan preconditions.
 */

import type { ControlledApplyPlan } from '../world2-controlled-apply-runtime/types.js';
import type { RollbackPlan } from '../world2-rollback-runtime/types.js';
import { hasCriticalRecoveryViolation } from './recovery-risk-engine.js';
import type { FailureContext, RecoveryStep } from './types.js';

export interface RecoveryGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface RecoveryValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  approvalRequirements: string[];
}

export function evaluateRecoveryGates(opts: {
  rollbackPlan: RollbackPlan | null;
  applyPlan: ControlledApplyPlan | null;
  failureContext: FailureContext | null;
  executionPacketLinked: boolean;
  world2Isolated: boolean;
  world1Protected: boolean;
  constitutionPassed: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
  runtimeVerificationPassed: boolean;
  duplicateAuthorityDetected: boolean;
  targetWorld: 'WORLD_1' | 'WORLD_2';
  directRecoveryAttempt: boolean;
  repeatedFailureLimitReached: boolean;
}): RecoveryGateReport {
  const gates = [
    {
      name: 'Rollback Plan Exists',
      satisfied: opts.rollbackPlan !== null,
      summary: 'Phase 15.4 rollback plan required',
    },
    {
      name: 'Controlled Apply Plan Exists',
      satisfied: opts.applyPlan !== null,
      summary: 'Phase 15.3 controlled apply plan required',
    },
    {
      name: 'Execution Packet Linked',
      satisfied: opts.executionPacketLinked,
      summary: 'Apply plan must link to execution packet',
    },
    {
      name: 'Failure Context Exists',
      satisfied: opts.failureContext !== null,
      summary: 'Failure context required for recovery planning',
    },
    {
      name: 'Workspace Isolation',
      satisfied: opts.world2Isolated,
      summary: 'World 2 workspace must be isolated',
    },
    {
      name: 'World 1 Protection',
      satisfied: opts.world1Protected && opts.targetWorld !== 'WORLD_1',
      summary: 'Recovery must not target World 1',
    },
    {
      name: 'Constitution',
      satisfied: opts.constitutionPassed,
      summary: 'Constitutional enforcement must pass',
    },
    {
      name: 'Task Governor',
      satisfied: opts.taskGovernorPassed,
      summary: 'Task Governor check must pass',
    },
    {
      name: 'Founder Approval',
      satisfied: opts.founderApprovalRecorded,
      summary: 'Founder approval requirement must be recorded',
    },
    {
      name: 'Runtime Verification',
      satisfied: opts.runtimeVerificationPassed,
      summary: 'Runtime verification linkage required',
    },
    {
      name: 'Duplicate Authority Detection',
      satisfied: !opts.duplicateAuthorityDetected,
      summary: 'No duplicate execution authority',
    },
    {
      name: 'No Direct Recovery',
      satisfied: !opts.directRecoveryAttempt,
      summary: 'Direct recovery actions blocked in Phase 15.5',
    },
    {
      name: 'Repeated Failure Limit',
      satisfied: !opts.repeatedFailureLimitReached || opts.founderApprovalRecorded,
      summary: 'Repeated failure limit requires founder approval before self-evolution',
    },
  ];

  const blockers = gates.filter((g) => !g.satisfied).map((g) => `Gate unsatisfied: ${g.name} — ${g.summary}`);

  return { gates, blockers };
}

export function validateRecovery(opts: {
  gateReport: RecoveryGateReport;
  recoverySteps: RecoveryStep[];
  founderApprovalRecorded: boolean;
  strategyRepeated: boolean;
}): RecoveryValidationResult {
  const blockers = [...opts.gateReport.blockers];
  const warnings: string[] = [];
  const approvalRequirements: string[] = [
    'Founder approval required before any future recovery',
    'Constitution gate required before recovery',
    'Task Governor scheduling required',
  ];

  if (hasCriticalRecoveryViolation(opts.recoverySteps)) {
    blockers.push('Critical recovery risk detected — direct recovery actions blocked');
  }

  if (opts.strategyRepeated) {
    blockers.push(
      'Repeated failure rule — same recovery strategy must not repeat after 3 failures; escalate to self-evolution review',
    );
  }

  for (const step of opts.recoverySteps) {
    if (step.recoveryState === 'BLOCKED') {
      blockers.push(`Recovery step blocked: ${step.title} — ${step.blockedReason ?? 'blocked'}`);
    }
    if (step.escalationLevel === 'FOUNDER' || step.escalationLevel === 'MULTI_GATE' || step.escalationLevel === 'SELF_EVOLUTION_REVIEW') {
      approvalRequirements.push(
        `Approval [${step.escalationLevel}] for step ${step.stepId}: ${step.title}`,
      );
    }
  }

  if (!opts.founderApprovalRecorded) {
    warnings.push('Founder approval requirement recorded but not yet satisfied');
  }

  warnings.push('Phase 15.5 recovery plans only — recoveryAllowed must remain false');
  warnings.push('No self-evolution performed — escalation requirement recorded only');

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    approvalRequirements,
  };
}
