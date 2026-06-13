/**
 * Build Plan Chain Simulator — build plan generation (V1).
 */

import { runBuildPlanGenerator } from '../build-plan-generator/index.js';
import type {
  FounderSimulationChainContext,
  FounderSimulationStageResult,
} from './founder-simulation-types.js';

function stage(
  stageId: FounderSimulationStageResult['stageId'],
  status: FounderSimulationStageResult['status'],
  input: Partial<FounderSimulationStageResult>,
): FounderSimulationStageResult {
  return {
    readOnly: true,
    stageId,
    status,
    confidence: input.confidence ?? null,
    readiness: input.readiness ?? null,
    orchestrationState: input.orchestrationState ?? null,
    failureReason: input.failureReason ?? null,
    evidence: input.evidence ?? [],
  };
}

export function simulateBuildPlanChain(input: {
  context: FounderSimulationChainContext;
  log?: (message: string) => void;
}): { stages: FounderSimulationStageResult[]; context: FounderSimulationChainContext } {
  const stages: FounderSimulationStageResult[] = [];
  const log = input.log ?? (() => undefined);
  const ctx = { ...input.context };

  const archReadiness = ctx.architectureBrief?.architectureBriefReadiness;
  if (
    !ctx.architectureBrief ||
    (archReadiness !== 'ARCHITECTURE_DRAFT_READY' && archReadiness !== 'ARCHITECTURE_READY')
  ) {
    stages.push(stage('BUILD_PLAN_GENERATOR', 'SKIPPED', { evidence: ['ARCHITECTURE_NOT_READY'] }));
    return { stages, context: ctx };
  }

  log('Generating build plan');
  const buildPlan = runBuildPlanGenerator({
    architectureBrief: ctx.architectureBrief,
    planningBrief: ctx.planningBrief,
    planningGateAnalysis: ctx.planningGateAnalysis,
    unifiedIntakeAnalysis: ctx.unifiedIntakeAnalysis,
    requirementCompletenessAnalysis: ctx.completenessAnalysis,
    skipHistoryRecording: true,
  });
  ctx.buildPlan = buildPlan.buildPlan;

  stages.push(
    stage(
      'BUILD_PLAN_GENERATOR',
      buildPlan.orchestrationState === 'BUILD_PLAN_GENERATOR_COMPLETE' && ctx.buildPlan
        ? 'PASSED'
        : 'FAILED',
      {
        confidence: ctx.buildPlan?.buildPlanConfidence ?? 0,
        readiness: ctx.buildPlan?.buildPlanReadiness ?? null,
        orchestrationState: buildPlan.orchestrationState,
        failureReason: buildPlan.failureReason,
        evidence: ctx.buildPlan ? ['BUILD_PLAN_PRODUCED'] : ['BUILD_PLAN_NULL'],
      },
    ),
  );

  return { stages, context: ctx };
}
