/**
 * Autonomous Debugging Engine — human review escalation.
 */

import type {
  HumanReviewEscalation,
  NormalizedFailure,
  RepairAttemptRecord,
  RepairPlan,
} from './autonomous-debugging-types.js';

let escalationCounter = 0;

export function resetHumanReviewEscalatorForTests(): void {
  escalationCounter = 0;
}

export function escalateToHumanReview(input: {
  failure: NormalizedFailure;
  repairPlan?: RepairPlan;
  attempts: readonly RepairAttemptRecord[];
  blockedReason: string;
}): HumanReviewEscalation {
  escalationCounter += 1;

  const attemptSummaries = input.attempts.map(
    (a) =>
      `Attempt ${a.attemptNumber}: ${a.patchScope} — targeted ${a.targetedValidationPassed ? 'PASS' : 'FAIL'}, regression ${a.regressionValidationPassed ? 'PASS' : 'FAIL'} (${a.outcome})`,
  );

  return {
    readOnly: true,
    escalationId: `escalation-${escalationCounter}`,
    problemSummary: `${input.failure.category}: ${input.failure.observed}`,
    evidence: [input.failure.evidence, input.failure.expected, ...input.failure.repairHints],
    autonomousAttempts: attemptSummaries,
    blockedReason: input.blockedReason,
    recommendedHumanDecision:
      input.repairPlan?.repairStrategy === 'RESTORE_PROMPT_REQUIREMENT'
        ? 'Review prompt requirement conflict and approve faithful repair scope'
        : 'Review repair evidence and approve or redirect autonomous repair',
    safeNextOptions: [
      'Approve suggested repair scope',
      'Provide manual fix guidance',
      'Relax non-critical requirement with explicit consent',
      'Defer feature to post-launch backlog',
    ],
  };
}
