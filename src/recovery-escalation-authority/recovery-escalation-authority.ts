/**
 * Recovery Escalation Authority — evidence-boundary escalation only.
 */

import type {
  RecoveryEscalationDecision,
  RecoveryEscalationInput,
} from './recovery-escalation-types.js';

export function evaluateRecoveryEscalation(input: RecoveryEscalationInput): RecoveryEscalationDecision {
  const humanBoundary = input.blockers.some((b) =>
    /payment|unsafe|human review|architecture conflict|evidence boundary/i.test(b),
  );

  const allStrategiesAttempted =
    input.attemptedStrategies.length > 0 &&
    input.attemptedRecoveries.length >= input.attemptedStrategies.length;

  const anySuccess = input.attemptedRecoveries.some((r) => r.success);

  const safePathsExhausted =
    allStrategiesAttempted && !anySuccess && input.attemptedRecoveries.length > 0;

  const escalate = humanBoundary || safePathsExhausted;

  const attemptedSummary = input.attemptedRecoveries.map(
    (r) => `${r.operation}:${r.success ? 'ok' : 'fail'}`,
  );

  const remainingBlocker =
    input.blockers[0] ??
    (safePathsExhausted ? 'All safe autonomous recovery strategies exhausted.' : null);

  return {
    readOnly: true,
    escalate,
    reason: escalate
      ? humanBoundary
        ? 'Evidence boundary requires human judgment — no safe autonomous path remains.'
        : 'All evidence-ranked safe recovery strategies failed validation replay.'
      : 'Autonomous recovery may continue.',
    attemptedRecoveries: attemptedSummary,
    evidenceCollected: input.evidenceRefs ?? [],
    remainingBlocker,
    humanJudgmentRequired: escalate,
  };
}
