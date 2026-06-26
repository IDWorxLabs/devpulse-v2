/**
 * ASE — route planner.
 */

import type { AseRouteDecision, AseRouteTarget, AseStageId, AseStageResult } from './ase-types.js';
import { routeAseFailure } from './ase-failure-router.js';

export function planAseRoute(input: {
  failedStage: AseStageId;
  stageResult: AseStageResult;
}): AseRouteDecision {
  return routeAseFailure({
    stageId: input.failedStage,
    failure: input.stageResult.blockedReason ?? `${input.failedStage} failed`,
    evidenceId: input.stageResult.evidenceId,
  });
}

export function resolveNextStageAfterRoute(destination: AseRouteTarget): AseStageId | null {
  const map: Partial<Record<AseRouteTarget, AseStageId>> = {
    MISSING_CAPABILITY_EVOLUTION: 'MISSING_CAPABILITY_EVOLUTION',
    AUTONOMOUS_DEBUGGING: 'AUTONOMOUS_DEBUGGING',
    CONTINUOUS_IMPROVEMENT: 'CONTINUOUS_IMPROVEMENT',
    LAUNCH_READINESS_AUTHORITY: 'LAUNCH_READINESS_AUTHORITY',
    LIVE_PREVIEW_GATE: 'LIVE_PREVIEW_GATE',
  };
  return map[destination] ?? null;
}

export function shouldContinuePipeline(destination: AseRouteTarget): boolean {
  return destination !== 'HUMAN_REVIEW' && destination !== 'EVIDENCE_REGENERATION';
}
