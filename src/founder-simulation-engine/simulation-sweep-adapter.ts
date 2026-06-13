/**
 * Chain-derived sweep report for founder test automation stage (V1).
 */

import type { FounderTestRealitySweepReport } from '../founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import type {
  FounderSimulationChainContext,
  FounderSimulationStageResult,
} from './founder-simulation-types.js';

export function buildChainDerivedSweepReport(input: {
  simulationId: string;
  context: FounderSimulationChainContext;
  stageResults: readonly FounderSimulationStageResult[];
}): FounderTestRealitySweepReport {
  const failedStages = input.stageResults.filter((s) => s.status === 'FAILED' || s.status === 'BLOCKED');
  const passedStages = input.stageResults.filter((s) => s.status === 'PASSED');

  let launchReadinessPercent = 25;
  launchReadinessPercent += passedStages.length * 6;
  if (input.context.buildPlan) launchReadinessPercent += 20;
  if (input.context.architectureBrief) launchReadinessPercent += 10;
  if (input.context.planningBrief) launchReadinessPercent += 8;
  launchReadinessPercent -= failedStages.length * 8;
  launchReadinessPercent = Math.max(0, Math.min(100, Math.round(launchReadinessPercent)));

  const launchBlockers = failedStages.map((stage, index) => ({
    readOnly: true as const,
    blockerId: `sim-blocker-${index + 1}`,
    severity: stage.status === 'BLOCKED' ? ('CRITICAL' as const) : ('HIGH' as const),
    category: 'EXECUTION_REALITY' as const,
    title: `${stage.stageId} did not pass simulation`,
    explanation: stage.failureReason ?? `${stage.stageId} returned ${stage.status}`,
    sourceAuthority: 'founder-simulation-engine',
    recommendedAction: `Review ${stage.stageId} inputs and evidence chain.`,
    impactRank: index + 1,
  }));

  const launchStrengths = passedStages.slice(0, 4).map((stage, index) => ({
    readOnly: true as const,
    strengthId: `sim-strength-${index + 1}`,
    category: 'EXECUTION_REALITY' as const,
    explanation: `${stage.stageId} passed with confidence ${stage.confidence ?? 'n/a'}`,
    sourceAuthority: stage.stageId,
    evidenceScore: stage.confidence ?? 60,
  }));

  let founderLaunchVerdict: FounderTestRealitySweepReport['founderLaunchVerdict'] = 'NOT_READY_TO_LAUNCH';
  if (launchReadinessPercent >= 85 && failedStages.length === 0 && input.context.buildPlan) {
    founderLaunchVerdict = 'READY_WITH_WARNINGS';
  } else if (launchReadinessPercent >= 70 && input.context.buildPlan) {
    founderLaunchVerdict = 'READY_WITH_WARNINGS';
  } else if (failedStages.length >= 3) {
    founderLaunchVerdict = 'BLOCK_LAUNCH';
  }

  let launchRecommendation: FounderTestRealitySweepReport['launchRecommendation'] = 'DO_NOT_RECOMMEND_LAUNCH';
  if (founderLaunchVerdict === 'READY_WITH_WARNINGS') launchRecommendation = 'RECOMMEND_LAUNCH_WITH_WARNINGS';
  if (founderLaunchVerdict === 'BLOCK_LAUNCH') launchRecommendation = 'BLOCK_LAUNCH';

  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Did the founder intelligence chain produce a credible readiness path?',
    sweepId: `simulation-sweep-${input.simulationId}`,
    generatedAt: new Date().toISOString(),
    launchReadinessPercent,
    launchRecommendation,
    founderLaunchVerdict,
    categoryScores: [],
    launchBlockers,
    launchWarnings: [],
    launchStrengths,
    missingCapabilities: [],
    competitiveGaps: [],
    topLaunchRisks: [],
    recommendedLaunchWork: [],
    topBlockers: launchBlockers.slice(0, 3),
    topStrengths: launchStrengths,
    topMissingCapabilities: [],
    mostImportantNextBuildItems: [],
    inputSnapshot: {
      readOnly: true,
      founderTestAssessment: null,
      founderExecutionProofAssessment: null,
      founderTestLaunchReadinessAssessment: null,
      founderAcceptanceAssessment: null,
      launchCouncilAssessment: null,
      firstTimeUserRealityAssessment: null,
      livePreviewRealityAssessment: null,
      verificationRealityAssessment: null,
      interactiveExplanationsEvaluation: null,
      uiReviewerAssessment: null,
      competitiveRealityAssessment: null,
      missingAuthorities: ['simulation-derived-sweep'],
    },
    blockingReasons: launchBlockers.map((b) => b.explanation),
    warningReasons: [],
    cacheKey: `simulation:${input.simulationId}`,
  };
}
