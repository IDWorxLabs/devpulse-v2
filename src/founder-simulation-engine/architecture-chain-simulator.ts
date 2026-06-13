/**
 * Architecture Chain Simulator — architecture brief generation (V1).
 */

import { runArchitectureBriefGenerator } from '../architecture-brief-generator/index.js';
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

export function simulateArchitectureChain(input: {
  context: FounderSimulationChainContext;
  log?: (message: string) => void;
}): { stages: FounderSimulationStageResult[]; context: FounderSimulationChainContext } {
  const stages: FounderSimulationStageResult[] = [];
  const log = input.log ?? (() => undefined);
  const ctx = { ...input.context };

  const gateDecision = ctx.planningGateAnalysis?.planningGateDecision;
  if (!ctx.planningBrief || !ctx.planningGateAnalysis || (gateDecision !== 'ALLOW_LIMITED_PLANNING' && gateDecision !== 'ALLOW_FULL_PLANNING')) {
    stages.push(stage('ARCHITECTURE_BRIEF_GENERATOR', 'SKIPPED', { evidence: ['PLANNING_NOT_ALLOWED'] }));
    return { stages, context: ctx };
  }

  log('Generating architecture brief');
  const arch = runArchitectureBriefGenerator({
    planningBrief: ctx.planningBrief,
    planningGateAnalysis: ctx.planningGateAnalysis,
    unifiedIntakeAnalysis: ctx.unifiedIntakeAnalysis,
    requirementCompletenessAnalysis: ctx.completenessAnalysis,
    skipHistoryRecording: true,
  });
  ctx.architectureBrief = arch.architectureBrief;

  stages.push(
    stage(
      'ARCHITECTURE_BRIEF_GENERATOR',
      arch.orchestrationState === 'ARCHITECTURE_BRIEF_GENERATOR_COMPLETE' && ctx.architectureBrief
        ? 'PASSED'
        : 'FAILED',
      {
        confidence: ctx.architectureBrief?.architectureBriefConfidence ?? 0,
        readiness: ctx.architectureBrief?.architectureBriefReadiness ?? null,
        orchestrationState: arch.orchestrationState,
        failureReason: arch.failureReason,
        evidence: ctx.architectureBrief ? ['ARCHITECTURE_BRIEF_PRODUCED'] : ['ARCHITECTURE_BRIEF_NULL'],
      },
    ),
  );

  return { stages, context: ctx };
}
