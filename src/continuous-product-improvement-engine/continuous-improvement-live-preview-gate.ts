/**
 * Continuous Product Improvement Engine — Live Preview gate.
 */

import type {
  ContinuousImprovementPipelineResult,
  LivePreviewContinuousImprovementGateResult,
} from './continuous-improvement-types.js';

export function assessContinuousImprovementReadiness(input: {
  autonomousDebuggingReady: boolean;
  autonomousDebuggingBlockedReason?: string | null;
  pendingSignalCount?: number;
}): import('./continuous-improvement-types.js').ContinuousImprovementReadinessResult {
  if (!input.autonomousDebuggingReady) {
    return {
      readOnly: true,
      ready: false,
      pendingSignalCount: input.pendingSignalCount ?? 0,
      blockedReason:
        input.autonomousDebuggingBlockedReason ??
        'Autonomous debugging not ready for continuous improvement.',
    };
  }

  return {
    readOnly: true,
    ready: true,
    pendingSignalCount: input.pendingSignalCount ?? 0,
    blockedReason: null,
  };
}

export function evaluateLivePreviewContinuousImprovementGate(
  result: ContinuousImprovementPipelineResult,
): LivePreviewContinuousImprovementGateResult {
  const unlocked =
    result.permissionVerdict === 'READY_FOR_PREVIEW' ||
    result.permissionVerdict === 'DEFERRED_ACCEPTABLE';

  const highest = result.highestPriorityOpportunity;

  return {
    readOnly: true,
    unlocked,
    blockedReason: unlocked
      ? null
      : result.blockedReason ?? 'Critical safe improvements remain unresolved',
    improvementSignals: result.signals.length
      ? `${result.signals.length} signal(s) discovered`
      : null,
    highestPriorityOpportunity: highest
      ? `${highest.priority}: ${highest.summary}`
      : null,
    safetyVerdict: result.blockedOpportunities.length
      ? `${result.blockedOpportunities.length} blocked — ${result.blockedOpportunities[0]?.reason ?? ''}`
      : 'No unsafe improvements applied',
    attemptedImprovements: result.improvementAttempts.length
      ? `${result.improvementAttempts.length} attempt(s); ${result.improvementAttempts.filter((a) => a.outcome === 'APPLIED').length} applied`
      : null,
    deferredImprovements: result.deferredOpportunities.length
      ? `${result.deferredOpportunities.length} deferred`
      : null,
    residualRisk: result.qualityScore.residualRisk.length
      ? result.qualityScore.residualRisk.slice(0, 3).join('; ')
      : null,
    gateStatus: unlocked
      ? 'CONTINUOUS_PRODUCT_IMPROVEMENT_PASS'
      : 'CONTINUOUS_PRODUCT_IMPROVEMENT_BLOCKED',
  };
}
