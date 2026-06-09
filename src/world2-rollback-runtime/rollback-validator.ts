/**
 * Rollback validator — validates rollback plan preconditions.
 */

import type { ControlledApplyPlan } from '../world2-controlled-apply-runtime/types.js';
import type { SnapshotRequirement } from './types.js';
import { hasCriticalRollbackViolation } from './rollback-risk-engine.js';
import type { RollbackStep } from './types.js';

export interface RollbackGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface RollbackValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  approvalRequirements: string[];
}

export function evaluateRollbackGates(opts: {
  applyPlan: ControlledApplyPlan | null;
  executionPacketLinked: boolean;
  world2Isolated: boolean;
  world1Protected: boolean;
  snapshotRequirements: SnapshotRequirement[];
  snapshotRequirementsIdentified: boolean;
  constitutionPassed: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
  runtimeVerificationPassed: boolean;
  duplicateAuthorityDetected: boolean;
  targetWorld: 'WORLD_1' | 'WORLD_2';
  directRollbackAttempt: boolean;
}): RollbackGateReport {
  const gates = [
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
      name: 'Workspace Isolation',
      satisfied: opts.world2Isolated,
      summary: 'World 2 workspace must be isolated',
    },
    {
      name: 'Snapshot Requirement',
      satisfied: opts.snapshotRequirementsIdentified,
      summary: 'Pre-apply snapshot strategy must be identified',
    },
    {
      name: 'World 1 Protection',
      satisfied: opts.world1Protected && opts.targetWorld !== 'WORLD_1',
      summary: 'Rollback must not target World 1',
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
      name: 'No Direct Rollback',
      satisfied: !opts.directRollbackAttempt,
      summary: 'Direct rollback actions blocked in Phase 15.4',
    },
  ];

  const blockers = gates.filter((g) => !g.satisfied).map((g) => `Gate unsatisfied: ${g.name} — ${g.summary}`);

  return { gates, blockers };
}

export function validateRollback(opts: {
  gateReport: RollbackGateReport;
  rollbackSteps: RollbackStep[];
  snapshotRequirements: SnapshotRequirement[];
  founderApprovalRecorded: boolean;
}): RollbackValidationResult {
  const blockers = [...opts.gateReport.blockers];
  const warnings: string[] = [];
  const approvalRequirements: string[] = [
    'Founder approval required before any future rollback',
    'Constitution gate required before rollback',
    'Task Governor scheduling required',
  ];

  if (opts.snapshotRequirements.length < 3) {
    blockers.push('Missing snapshot strategy — at least workspace, file manifest, and diff manifest required');
  }

  if (hasCriticalRollbackViolation(opts.rollbackSteps)) {
    blockers.push('Critical rollback risk detected — direct rollback actions blocked');
  }

  for (const step of opts.rollbackSteps) {
    if (step.rollbackState === 'BLOCKED') {
      blockers.push(`Rollback step blocked: ${step.title} — ${step.blockedReason ?? 'blocked'}`);
    }
    if (step.approvalLevel === 'FOUNDER' || step.approvalLevel === 'MULTI_GATE') {
      approvalRequirements.push(`Approval [${step.approvalLevel}] for step ${step.stepId}: ${step.title}`);
    }
  }

  if (!opts.founderApprovalRecorded) {
    warnings.push('Founder approval requirement recorded but not yet satisfied');
  }

  warnings.push('Phase 15.4 rollback plans only — rollbackAllowed must remain false');
  warnings.push(`Snapshot requirements identified: ${opts.snapshotRequirements.join(', ')}`);

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    approvalRequirements,
  };
}
