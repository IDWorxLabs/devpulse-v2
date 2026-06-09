/**
 * Controlled apply validator — validates apply plan preconditions.
 */

import { hasCriticalApplyViolation } from './controlled-apply-risk-engine.js';
import type { ControlledApplyGateReport } from './controlled-apply-gate-engine.js';
import type { ControlledApplyStep } from './types.js';

export interface ControlledApplyValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  approvalRequirements: string[];
}

export function validateControlledApply(opts: {
  gateReport: ControlledApplyGateReport;
  applySteps: ControlledApplyStep[];
  founderApprovalRecorded: boolean;
}): ControlledApplyValidationResult {
  const blockers = [...opts.gateReport.blockers];
  const warnings: string[] = [];
  const approvalRequirements: string[] = [
    'Founder approval required before any future governed apply',
    'Constitution gate must pass before apply',
    'Task Governor scheduling required',
  ];

  if (hasCriticalApplyViolation(opts.applySteps)) {
    blockers.push('Critical apply risk detected — apply blocked in Phase 15.3');
  }

  for (const step of opts.applySteps) {
    if (step.applyState === 'BLOCKED') {
      blockers.push(`Apply step blocked: ${step.title} — ${step.blockedReason ?? 'blocked'}`);
    }
    if (step.approvalLevel === 'FOUNDER' || step.approvalLevel === 'MULTI_GATE') {
      approvalRequirements.push(`Approval [${step.approvalLevel}] for step ${step.stepId}: ${step.title}`);
    }
  }

  if (!opts.founderApprovalRecorded) {
    warnings.push('Founder approval requirement recorded but not yet satisfied');
  }

  warnings.push('Phase 15.3 apply plans only — applyAllowed must remain false');

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    approvalRequirements,
  };
}
