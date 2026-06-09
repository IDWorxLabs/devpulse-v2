/**
 * Completion verification engine — records verification requirements.
 */

import type { PrepareCompletionPlanInput, VerificationRequirement } from './types.js';

export function buildVerificationRequirements(input: PrepareCompletionPlanInput): VerificationRequirement[] {
  const requirements: VerificationRequirement[] = [
    'RUNTIME_VERIFICATION',
    'TASK_GOVERNOR',
    'CONSTITUTION',
    'FOUNDER_APPROVAL',
    'NO_CRITICAL_RISKS',
    'WORKSPACE_ISOLATION',
    'WORLD1_PROTECTION',
    'DUPLICATE_AUTHORITY_DETECTION',
  ];

  if (input.rollbackPlan !== null) {
    requirements.push('ROLLBACK_PLAN_EXISTS');
  }
  if (input.recoveryPlan !== null) {
    requirements.push('RECOVERY_PLAN_EXISTS');
  }

  return [...new Set(requirements)];
}

export function evaluateVerificationSatisfaction(
  requirements: VerificationRequirement[],
  input: PrepareCompletionPlanInput,
): { satisfied: VerificationRequirement[]; unsatisfied: VerificationRequirement[] } {
  const satisfied: VerificationRequirement[] = [];
  const unsatisfied: VerificationRequirement[] = [];

  for (const req of requirements) {
    let ok = false;
    switch (req) {
      case 'RUNTIME_VERIFICATION':
        ok = input.runtimeVerificationPassed && input.verificationRequirementsMet;
        break;
      case 'TASK_GOVERNOR':
        ok = input.taskGovernorPassed;
        break;
      case 'CONSTITUTION':
        ok = input.constitutionPassed;
        break;
      case 'FOUNDER_APPROVAL':
        ok = input.founderApprovalRecorded;
        break;
      case 'ROLLBACK_PLAN_EXISTS':
        ok = input.rollbackPlan !== null;
        break;
      case 'RECOVERY_PLAN_EXISTS':
        ok = input.recoveryPlan !== null;
        break;
      case 'NO_CRITICAL_RISKS':
        ok = input.noCriticalFailures && !input.markCompleteAttempt;
        break;
      case 'WORKSPACE_ISOLATION':
        ok = input.world2Isolated;
        break;
      case 'WORLD1_PROTECTION':
        ok = input.world1Protected && input.targetWorld !== 'WORLD_1';
        break;
      case 'DUPLICATE_AUTHORITY_DETECTION':
        ok = !input.duplicateAuthorityDetected;
        break;
      default:
        ok = false;
    }
    if (ok) satisfied.push(req);
    else unsatisfied.push(req);
  }

  return { satisfied, unsatisfied };
}
