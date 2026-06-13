/**
 * Planning Chain Simulator — planning gate and planning brief (V1).
 */

import { runPlanningGateAuthority } from '../planning-gate-authority/index.js';
import { runPlanningBriefGenerator } from '../planning-brief-generator/index.js';
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

export function simulatePlanningChain(input: {
  context: FounderSimulationChainContext;
  log?: (message: string) => void;
}): { stages: FounderSimulationStageResult[]; context: FounderSimulationChainContext } {
  const stages: FounderSimulationStageResult[] = [];
  const log = input.log ?? (() => undefined);
  const ctx = { ...input.context };

  if (!ctx.unifiedIntakeAnalysis) {
    stages.push(
      stage('PLANNING_GATE_AUTHORITY', 'BLOCKED', {
        failureReason: 'MISSING_UNIFIED_INTAKE',
        evidence: ['CHAIN_BLOCKED'],
      }),
    );
    stages.push(stage('PLANNING_BRIEF_GENERATOR', 'SKIPPED', { evidence: ['GATE_NOT_REACHED'] }));
    return { stages, context: ctx };
  }

  log('Assessing planning gate');
  const gate = runPlanningGateAuthority({
    unifiedIntakeAnalysis: ctx.unifiedIntakeAnalysis,
    requirementCompletenessAnalysis: ctx.completenessAnalysis,
    voiceNotesAnalysis: ctx.voiceAnalysis,
    visualReferenceAnalysis: ctx.visualAnalysis,
    skipHistoryRecording: true,
  });
  ctx.planningGateAnalysis = gate.analysis;

  const gateStatus =
    gate.orchestrationState !== 'PLANNING_GATE_AUTHORITY_COMPLETE' || !gate.analysis
      ? 'FAILED'
      : gate.analysis.planningGateDecision === 'REJECT_PLANNING'
        ? 'BLOCKED'
        : gate.analysis.planningGateDecision === 'REQUEST_CLARIFICATION'
          ? 'LOW_CONFIDENCE'
          : 'PASSED';

  stages.push(
    stage('PLANNING_GATE_AUTHORITY', gateStatus, {
      confidence: gate.analysis?.planningGateExplanation.confidence ?? 0,
      readiness: gate.analysis?.planningReadiness.planningReadinessCategory ?? null,
      orchestrationState: gate.orchestrationState,
      failureReason: gate.failureReason ?? gate.analysis?.planningGateDecision,
      evidence: gate.analysis ? [gate.analysis.planningGateDecision] : ['GATE_NULL'],
    }),
  );

  if (!gate.analysis || gate.analysis.planningGateDecision === 'REJECT_PLANNING') {
    stages.push(stage('PLANNING_BRIEF_GENERATOR', 'SKIPPED', { evidence: ['PLANNING_REJECTED'] }));
    return { stages, context: ctx };
  }

  log('Generating planning brief');
  const planningBrief = runPlanningBriefGenerator({
    planningGateAnalysis: gate.analysis,
    unifiedIntakeAnalysis: ctx.unifiedIntakeAnalysis,
    requirementCompletenessAnalysis: ctx.completenessAnalysis,
    voiceNotesAnalysis: ctx.voiceAnalysis,
    visualReferenceAnalysis: ctx.visualAnalysis,
    skipHistoryRecording: true,
  });
  ctx.planningBrief = planningBrief.planningBrief;

  stages.push(
    stage(
      'PLANNING_BRIEF_GENERATOR',
      planningBrief.orchestrationState === 'PLANNING_BRIEF_GENERATOR_COMPLETE' && ctx.planningBrief
        ? 'PASSED'
        : 'FAILED',
      {
        confidence: ctx.planningBrief?.planningBriefConfidence ?? 0,
        readiness: ctx.planningBrief?.planningBriefReadiness ?? null,
        orchestrationState: planningBrief.orchestrationState,
        failureReason: planningBrief.failureReason,
        evidence: ctx.planningBrief ? ['PLANNING_BRIEF_PRODUCED'] : ['PLANNING_BRIEF_NULL'],
      },
    ),
  );

  return { stages, context: ctx };
}
