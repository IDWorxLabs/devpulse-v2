/**
 * Founder Journey Simulator — single scenario full chain (V1).
 */

import { assessFounderTestAutomation, buildUpstreamChainConfidenceFromSimulationContext } from '../founder-test-automation/index.js';
import { simulateArchitectureChain } from './architecture-chain-simulator.js';
import { simulateBuildPlanChain } from './build-plan-chain-simulator.js';
import { simulateIntakeChain } from './intake-chain-simulator.js';
import { simulatePlanningChain } from './planning-chain-simulator.js';
import { buildChainDerivedSweepReport } from './simulation-sweep-adapter.js';
import { analyzeSimulationFailures } from './simulation-failure-analyzer.js';
import { buildSystemIntegrationProof } from './cross-system-proof-analyzer.js';
import type {
  FounderReadinessCategory,
  FounderSimulationFinalVerdict,
  FounderSimulationResult,
  FounderSimulationScenario,
  FounderSimulationStageResult,
} from './founder-simulation-types.js';

let simulationCounter = 0;

export function resetFounderJourneyCounterForTests(): void {
  simulationCounter = 0;
}

function nextSimulationId(): string {
  simulationCounter += 1;
  return `founder-simulation-${simulationCounter}`;
}

function mapReadinessCategory(score: number): FounderReadinessCategory {
  if (score >= 95) return 'READY_FOR_EXECUTION_GATE';
  if (score >= 85) return 'READY_FOR_BUILD_PLAN';
  if (score >= 70) return 'READY_FOR_PLANNING';
  if (score >= 40) return 'NEEDS_CLARIFICATION';
  return 'NOT_READY';
}

function deriveFinalVerdict(input: {
  stageResults: readonly FounderSimulationStageResult[];
  readinessScore: number;
}): FounderSimulationFinalVerdict {
  const byStage = new Map(input.stageResults.map((s) => [s.stageId, s]));
  const gate = byStage.get('PLANNING_GATE_AUTHORITY');
  const buildPlan = byStage.get('BUILD_PLAN_GENERATOR');
  const arch = byStage.get('ARCHITECTURE_BRIEF_GENERATOR');
  const planningBrief = byStage.get('PLANNING_BRIEF_GENERATOR');
  const founderTest = byStage.get('FOUNDER_TEST_AUTOMATION');

  if (gate?.evidence.includes('REJECT_PLANNING') || gate?.status === 'BLOCKED') return 'NOT_READY';
  if (gate?.evidence.includes('REQUEST_CLARIFICATION') || gate?.status === 'LOW_CONFIDENCE') {
    return input.readinessScore >= 70 ? 'READY_FOR_PLANNING' : 'NEEDS_CLARIFICATION';
  }
  if (buildPlan?.status === 'PASSED' && input.readinessScore >= 95) return 'READY_FOR_EXECUTION_GATE';
  if (buildPlan?.status === 'PASSED') return 'READY_FOR_BUILD_PLAN';
  if (arch?.status === 'PASSED') return 'READY_FOR_ARCHITECTURE';
  if (planningBrief?.status === 'PASSED') return 'READY_FOR_PLANNING';
  if (founderTest?.status === 'PASSED' && input.readinessScore >= 40) return 'NEEDS_CLARIFICATION';
  return input.readinessScore >= 40 ? 'NEEDS_CLARIFICATION' : 'NOT_READY';
}

function computeReadinessScore(stageResults: readonly FounderSimulationStageResult[]): number {
  const weights: Record<string, number> = {
    UNIFIED_INTAKE_INTELLIGENCE: 15,
    PLANNING_GATE_AUTHORITY: 15,
    PLANNING_BRIEF_GENERATOR: 12,
    ARCHITECTURE_BRIEF_GENERATOR: 12,
    BUILD_PLAN_GENERATOR: 15,
    FOUNDER_TEST_AUTOMATION: 10,
  };
  let score = 10;
  for (const stage of stageResults) {
    const weight = weights[stage.stageId] ?? 3;
    if (stage.status === 'PASSED') score += weight;
    else if (stage.status === 'LOW_CONFIDENCE') score += weight * 0.5;
    else if (stage.status === 'SKIPPED') score += 0;
    else score -= weight * 0.4;
    if (stage.confidence != null) score += stage.confidence * 0.05;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildFounderExplanation(input: {
  scenario: FounderSimulationScenario;
  finalVerdict: FounderSimulationFinalVerdict;
  readinessScore: number;
  failedStages: readonly string[];
}): string {
  if (input.finalVerdict === 'NOT_READY') {
    return `Scenario "${input.scenario.scenarioName}" is not ready. The intelligence chain blocked or failed at: ${input.failedStages.join(', ') || 'early intake'}.`;
  }
  if (input.finalVerdict === 'NEEDS_CLARIFICATION') {
    return `Scenario "${input.scenario.scenarioName}" needs founder clarification before planning can proceed safely. Readiness score: ${input.readinessScore}/100.`;
  }
  if (input.finalVerdict === 'READY_FOR_EXECUTION_GATE') {
    return `Scenario "${input.scenario.scenarioName}" completed the full chain through build plan and founder test with strong readiness (${input.readinessScore}/100).`;
  }
  if (input.finalVerdict === 'READY_FOR_BUILD_PLAN') {
    return `Scenario "${input.scenario.scenarioName}" reached build plan readiness. Execution gate review is the next step.`;
  }
  return `Scenario "${input.scenario.scenarioName}" reached ${input.finalVerdict.replace(/_/g, ' ').toLowerCase()} with score ${input.readinessScore}/100.`;
}

function finalVerdictStage(
  finalVerdict: FounderSimulationFinalVerdict,
  readinessScore: number,
): FounderSimulationStageResult {
  return {
    readOnly: true,
    stageId: 'FINAL_FOUNDER_READINESS_VERDICT',
    status: finalVerdict === 'NOT_READY' ? 'BLOCKED' : 'PASSED',
    confidence: readinessScore,
    readiness: finalVerdict,
    orchestrationState: 'VERDICT_COMPLETE',
    failureReason: finalVerdict === 'NOT_READY' ? 'NOT_READY' : null,
    evidence: [finalVerdict],
  };
}

export function simulateFounderJourney(input: {
  scenario: FounderSimulationScenario;
  log?: (message: string) => void;
  applyAlignmentRepair?: boolean;
}): FounderSimulationResult {
  const simulationId = nextSimulationId();
  const log = input.log ?? (() => undefined);
  log(`Starting scenario: ${input.scenario.scenarioName}`);

  const intake = simulateIntakeChain({
    scenario: input.scenario,
    log,
    applyAlignmentRepair: input.applyAlignmentRepair ?? true,
  });
  let context = intake.context;
  const stageResults: FounderSimulationStageResult[] = [...intake.stages];

  const planning = simulatePlanningChain({ context, log });
  stageResults.push(...planning.stages);
  context = planning.context;

  const architecture = simulateArchitectureChain({ context, log });
  stageResults.push(...architecture.stages);
  context = architecture.context;

  const buildPlan = simulateBuildPlanChain({ context, log });
  stageResults.push(...buildPlan.stages);
  context = buildPlan.context;

  log('Running founder test automation interpretation');
  const sweepReport = buildChainDerivedSweepReport({ simulationId, context, stageResults });
  const founderTest = assessFounderTestAutomation({
    founderTestRealitySweepReport: sweepReport,
    requirementCompletenessAnalysis: context.completenessAnalysis,
    visualReferenceAnalysis: context.visualAnalysis,
    voiceNotesAnalysis: context.voiceAnalysis,
    upstreamChainConfidence: buildUpstreamChainConfidenceFromSimulationContext(context),
    skipHistoryRecording: true,
  });
  context = { ...context, founderTestAnalysis: founderTest.analysis };

  stageResults.push({
    readOnly: true,
    stageId: 'FOUNDER_TEST_AUTOMATION',
    status:
      founderTest.orchestrationState === 'FOUNDER_TEST_AUTOMATION_COMPLETE' && founderTest.analysis
        ? 'PASSED'
        : 'FAILED',
    confidence: founderTest.analysis?.executionReadiness.confidenceScore ?? 0,
    readiness: founderTest.analysis?.executionReadiness.executionReadinessState ?? null,
    orchestrationState: founderTest.orchestrationState,
    failureReason: founderTest.failureReason,
    evidence: founderTest.analysis ? ['FOUNDER_TEST_COMPLETE'] : ['FOUNDER_TEST_FAILED'],
  });

  const failedStages = stageResults
    .filter((s) => s.status === 'FAILED' || s.status === 'BLOCKED')
    .map((s) => s.stageId);
  const skippedStages = stageResults.filter((s) => s.status === 'SKIPPED').map((s) => s.stageId);
  const readinessScore = computeReadinessScore(stageResults);
  const readinessCategory = mapReadinessCategory(readinessScore);
  const finalVerdict = deriveFinalVerdict({ stageResults, readinessScore });
  stageResults.push(finalVerdictStage(finalVerdict, readinessScore));

  const systemIntegrationProof = buildSystemIntegrationProof(stageResults);
  const failureAnalysis = analyzeSimulationFailures({ scenario: input.scenario, stageResults });

  const nextBestAction =
    failureAnalysis.find((f) => f.blocksFounderLaunch)?.recommendedFix ??
    (finalVerdict === 'READY_FOR_EXECUTION_GATE'
      ? 'Proceed to execution gate review with founder approval.'
      : finalVerdict === 'READY_FOR_BUILD_PLAN'
        ? 'Review build plan phases and confirm founder priorities before execution planning.'
        : 'Provide clearer requirements and resolve conflicts before re-running founder test.');

  return {
    readOnly: true,
    simulationId,
    scenarioName: input.scenario.scenarioName,
    scenarioType: input.scenario.scenarioType,
    simulatedAt: new Date().toISOString(),
    stageResults,
    failedStages,
    skippedStages,
    readinessScore,
    readinessCategory,
    finalVerdict,
    founderFacingExplanation: buildFounderExplanation({
      scenario: input.scenario,
      finalVerdict,
      readinessScore,
      failedStages,
    }),
    systemIntegrationProof,
    failureAnalysis,
    nextBestAction,
    alignmentImpact: intake.alignmentImpact,
  };
}
