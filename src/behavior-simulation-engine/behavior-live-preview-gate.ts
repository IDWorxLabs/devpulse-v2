/**
 * Behavior Simulation Engine — Live Preview gate.
 */

import type {
  BehaviorSimulationPipelineResult,
  LivePreviewBehaviorGateResult,
} from './behavior-simulation-types.js';

export function evaluateLivePreviewBehaviorGate(
  result: BehaviorSimulationPipelineResult,
): LivePreviewBehaviorGateResult {
  const failed = result.scenarioResults.find((r) => !r.passed);
  const unlocked =
    result.permissionVerdict === 'READY_FOR_PREVIEW' &&
    result.wholeAppSweep.passed &&
    !failed;

  return {
    readOnly: true,
    unlocked,
    blockedReason: unlocked ? null : result.blockedReason ?? 'Behavior simulation did not pass',
    failureSummary: failed?.failure?.likelyCause ?? null,
    affectedWorkflow: failed ? result.scenarios.find((s) => s.scenarioId === failed.scenarioId)?.name ?? null : null,
    responsibleFeature: failed?.failure?.responsibleFeatureSliceId ?? null,
    repairPlan: failed?.repairRecommendation?.suggestedRepairScope ?? null,
  };
}
