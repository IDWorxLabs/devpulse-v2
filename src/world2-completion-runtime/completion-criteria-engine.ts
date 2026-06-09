/**
 * Completion criteria engine — evaluates which criteria would be required.
 */

import type { CompletionCriterion } from './types.js';
import type { PrepareCompletionPlanInput } from './types.js';

export function evaluateCompletionCriteria(input: PrepareCompletionPlanInput): CompletionCriterion[] {
  const criteria: CompletionCriterion[] = [
    'PROJECT_GOAL_SATISFIED',
    'FEATURES_IMPLEMENTED',
    'TESTS_PASS',
    'VERIFICATION_PASS',
    'NO_CRITICAL_FAILURES',
    'NO_OPEN_BLOCKERS',
    'WORLD1_PROTECTION_PRESERVED',
  ];

  if (input.rollbackPlan !== null) {
    criteria.push('ROLLBACK_DEFINED');
  }
  if (input.recoveryPlan !== null) {
    criteria.push('RECOVERY_DEFINED');
  }
  if (input.founderApprovalRecorded) {
    criteria.push('APPROVAL_REQUIREMENTS_SATISFIED');
  }

  return [...new Set(criteria)];
}

export function isProjectGoalCriterionSatisfied(input: PrepareCompletionPlanInput): boolean {
  return input.projectContext !== null && input.projectContext.goalSummary.length > 0;
}
