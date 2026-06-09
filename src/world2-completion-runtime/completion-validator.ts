/**
 * Completion validator — validates completion plan preconditions.
 */

import { evidenceSufficient } from './completion-evidence-engine.js';
import { hasCriticalCompletionViolation } from './completion-risk-engine.js';
import type { CompletionEvidence, VerificationRequirement } from './types.js';
import type { PrepareCompletionPlanInput } from './types.js';

export interface CompletionGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface CompletionValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  approvalRequirements: string[];
}

export function evaluateCompletionGates(input: PrepareCompletionPlanInput): CompletionGateReport {
  const gates = [
    {
      name: 'Recovery Plan Exists',
      satisfied: input.recoveryPlan !== null,
      summary: 'Phase 15.5 recovery plan required',
    },
    {
      name: 'Rollback Plan Exists',
      satisfied: input.rollbackPlan !== null,
      summary: 'Phase 15.4 rollback plan required',
    },
    {
      name: 'Controlled Apply Plan Exists',
      satisfied: input.applyPlan !== null,
      summary: 'Phase 15.3 controlled apply plan required',
    },
    {
      name: 'Execution Packet Exists',
      satisfied: input.executionPacket !== null,
      summary: 'Phase 15.2 execution packet required',
    },
    {
      name: 'Project Context Exists',
      satisfied: input.projectContext !== null,
      summary: 'Project context required for completion criteria',
    },
    {
      name: 'Evidence Provided',
      satisfied: input.evidenceProvided,
      summary: 'Completion evidence must be recorded',
    },
    {
      name: 'Verification Requirements Met',
      satisfied: input.verificationRequirementsMet && input.runtimeVerificationPassed,
      summary: 'Runtime verification must pass before completion',
    },
    {
      name: 'Workspace Isolation',
      satisfied: input.world2Isolated,
      summary: 'World 2 workspace must be isolated',
    },
    {
      name: 'World 1 Protection',
      satisfied: input.world1Protected && input.targetWorld !== 'WORLD_1',
      summary: 'Completion must not target World 1',
    },
    {
      name: 'Constitution',
      satisfied: input.constitutionPassed,
      summary: 'Constitutional enforcement must pass',
    },
    {
      name: 'Task Governor',
      satisfied: input.taskGovernorPassed,
      summary: 'Task Governor check must pass',
    },
    {
      name: 'Founder Approval',
      satisfied: input.founderApprovalRecorded,
      summary: 'Founder approval requirement must be recorded',
    },
    {
      name: 'Duplicate Authority Detection',
      satisfied: !input.duplicateAuthorityDetected,
      summary: 'No duplicate execution authority',
    },
    {
      name: 'No Mark Complete Attempt',
      satisfied: !input.markCompleteAttempt,
      summary: 'Direct completion marking blocked in Phase 15.6',
    },
  ];

  const blockers = gates.filter((g) => !g.satisfied).map((g) => `Gate unsatisfied: ${g.name} — ${g.summary}`);

  return { gates, blockers };
}

export function validateCompletion(opts: {
  gateReport: CompletionGateReport;
  evidence: CompletionEvidence[];
  unsatisfiedVerification: VerificationRequirement[];
  input: PrepareCompletionPlanInput;
  riskLevel: string;
}): CompletionValidationResult {
  const blockers = [...opts.gateReport.blockers];
  const warnings: string[] = [];
  const approvalRequirements: string[] = [
    'Founder approval required before any future completion declaration',
    'Constitution gate required before completion',
    'Task Governor scheduling required',
    'Multi-gate approval for completion criteria',
  ];

  if (!evidenceSufficient(opts.evidence)) {
    blockers.push('Missing evidence — at least 3 evidence records with 2 satisfied required');
  }

  if (opts.unsatisfiedVerification.length > 0) {
    blockers.push(
      `Missing verification — unsatisfied: ${opts.unsatisfiedVerification.join(', ')}`,
    );
  }

  if (hasCriticalCompletionViolation(opts.input, opts.riskLevel as import('./types.js').CompletionRiskLevel)) {
    blockers.push('Critical completion risk detected — cannot mark complete without evidence and verification');
  }

  if (!opts.input.founderApprovalRecorded) {
    warnings.push('Founder approval requirement recorded but not yet satisfied');
  }

  warnings.push('Phase 15.6 completion plans only — completionAllowed must remain false');
  warnings.push('No project marked complete — completion criteria and evidence recorded only');

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    approvalRequirements,
  };
}
