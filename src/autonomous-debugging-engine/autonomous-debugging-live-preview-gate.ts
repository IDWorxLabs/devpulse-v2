/**
 * Autonomous Debugging Engine — Live Preview gate.
 */

import type {
  AutonomousDebuggingPipelineResult,
  LivePreviewAutonomousDebuggingGateResult,
} from './autonomous-debugging-types.js';

export function evaluateLivePreviewAutonomousDebuggingGate(
  result: AutonomousDebuggingPipelineResult,
): LivePreviewAutonomousDebuggingGateResult {
  const unlocked = result.permissionVerdict === 'READY_FOR_PREVIEW';
  const unresolved = result.repairLoops.filter((l) => !l.resolved);

  return {
    readOnly: true,
    unlocked,
    blockedReason: unlocked
      ? null
      : result.blockedReason ??
        result.humanReview?.blockedReason ??
        'Autonomous debugging did not resolve all failures',
    failureSummary: result.normalizedFailures.length
      ? `${result.normalizedFailures.length} failure(s); ${unresolved.length} unresolved`
      : null,
    rootCause: result.rootCauses[0]?.causeSummary ?? null,
    repairAttempts: result.repairAttempts.length
      ? `${result.repairAttempts.length} attempt(s) across ${result.repairLoops.length} loop(s)`
      : null,
    whyAutonomousRepairStopped:
      result.humanReview?.blockedReason ?? result.blockedReason ?? null,
    humanReviewRequest: result.humanReview?.recommendedHumanDecision ?? null,
    gateStatus: unlocked ? 'AUTONOMOUS_DEBUGGING_PASS' : 'AUTONOMOUS_DEBUGGING_BLOCKED',
  };
}
