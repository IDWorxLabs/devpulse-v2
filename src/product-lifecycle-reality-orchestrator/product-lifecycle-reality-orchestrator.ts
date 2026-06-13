/**
 * Product Lifecycle Reality Orchestrator — read-only lifecycle proof chain orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessLiveIdeaToLaunchExecutionRunner } from '../live-idea-to-launch-execution-runner/index.js';
import { assessProductEvolutionReality } from '../product-evolution-reality-authority/index.js';
import { analyzeLifecycleGaps } from './lifecycle-gap-analyzer.js';
import { determineLifecycleNextAction } from './lifecycle-next-action-engine.js';
import { analyzeLifecycleRisk } from './lifecycle-risk-analyzer.js';
import { collectLifecycleSignals } from './lifecycle-signal-collector.js';
import { classifyLifecycleStage } from './lifecycle-stage-classifier.js';
import { recordProductLifecycleRealityAssessment } from './product-lifecycle-reality-history.js';
import { buildProductLifecycleRealityReportMarkdown } from './product-lifecycle-report-builder.js';
import {
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_CACHE_KEY_PREFIX,
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN,
} from './product-lifecycle-reality-registry.js';
import {
  computeLifecycleScores,
  computeProductLifecycleVerdict,
} from './product-lifecycle-verdict-engine.js';
import type {
  AssessProductLifecycleRealityInput,
  ProductLifecycleInputSnapshot,
  ProductLifecycleRealityArtifacts,
  ProductLifecycleRealityAssessment,
  ProductLifecycleRealityReport,
} from './product-lifecycle-reality-types.js';

let assessmentCounter = 0;

export function resetProductLifecycleRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetProductLifecycleRealityOrchestratorModuleForTests(): void {
  resetProductLifecycleRealityCounterForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `product-lifecycle-reality-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: string, score: number): string {
  const digest = createHash('sha256')
    .update([PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN, assessmentId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveInput<T>(
  input: AssessProductLifecycleRealityInput,
  key: keyof AssessProductLifecycleRealityInput,
  factory: () => T,
): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

export function assessProductLifecycleReality(
  input: AssessProductLifecycleRealityInput = {},
): ProductLifecycleRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const fixtureFlags = {
    planningOnlyFixture: input.planningOnlyFixture,
    buildOnlyFixture: input.buildOnlyFixture,
    runtimeOnlyFixture: input.runtimeOnlyFixture,
    launchReadinessOnlyFixture: input.launchReadinessOnlyFixture,
    adoptionOnlyFixture: input.adoptionOnlyFixture,
    revenueOnlyFixture: input.revenueOnlyFixture,
  };

  const productEvolutionReality = resolveInput(input, 'productEvolutionReality', () =>
    assessProductEvolutionReality({
      rootDir,
      rawPrompt: input.rawPrompt,
      requirementsToPlanContract: input.requirementsToPlanContract,
      observedBuildEvidence: input.observedBuildEvidence,
      runtimeSessionEvidence: input.runtimeSessionEvidence,
      previewSessionEvidence: input.previewSessionEvidence,
      verificationEvidenceFixture: input.verificationEvidenceFixture,
      launchReadinessFixture: input.launchReadinessFixture,
      postLaunchEvidenceFixture: input.postLaunchEvidenceFixture ?? undefined,
      adoptionEvidenceFixture: input.adoptionEvidenceFixture ?? undefined,
      revenueEvidenceFixture: input.revenueEvidenceFixture ?? undefined,
      evolutionEvidenceFixture: input.evolutionEvidenceFixture ?? undefined,
      skipHistoryRecording: true,
    }).report,
  );

  const revenueReality = resolveInput(input, 'revenueReality', () =>
    productEvolutionReality?.inputSnapshot.revenueReality ?? null,
  );
  const adoptionReality = resolveInput(input, 'adoptionReality', () =>
    productEvolutionReality?.inputSnapshot.adoptionReality ?? null,
  );
  const postLaunchReality = resolveInput(input, 'postLaunchReality', () =>
    productEvolutionReality?.inputSnapshot.postLaunchReality ?? null,
  );
  const founderLaunchDecision = resolveInput(input, 'founderLaunchDecision', () =>
    productEvolutionReality?.inputSnapshot.founderLaunchDecision ??
    postLaunchReality?.inputSnapshot.founderLaunchDecision ??
    null,
  );

  const liveExecutionRunner = resolveInput(input, 'liveExecutionRunner', () =>
    founderLaunchDecision?.inputSnapshot.liveExecutionRunner ??
    postLaunchReality?.inputSnapshot.liveExecutionRunner ??
    assessLiveIdeaToLaunchExecutionRunner({
      rootDir,
      rawPrompt: input.rawPrompt,
      requirementsToPlanContract: input.requirementsToPlanContract,
      observedBuildEvidence: input.observedBuildEvidence,
      runtimeSessionEvidence: input.runtimeSessionEvidence,
      previewSessionEvidence: input.previewSessionEvidence,
      verificationEvidenceFixture: input.verificationEvidenceFixture,
      launchReadinessFixture: input.launchReadinessFixture,
      skipHistoryRecording: true,
    }).report,
  );

  const requirementsToPlanContract = resolveInput(input, 'requirementsToPlanContract', () =>
    liveExecutionRunner?.inputSnapshot.requirementsToPlanContract ?? null,
  );

  const inputSnapshot: ProductLifecycleInputSnapshot = {
    readOnly: true,
    liveExecutionRunner,
    founderLaunchDecision,
    postLaunchReality,
    adoptionReality,
    revenueReality,
    productEvolutionReality,
    requirementsToPlanContract,
  };

  const signalCollection = collectLifecycleSignals({
    readOnly: true,
    rawPrompt: input.rawPrompt,
    liveExecutionRunner,
    founderLaunchDecision,
    postLaunchReality,
    adoptionReality,
    revenueReality,
    productEvolutionReality,
    requirementsToPlanContract,
    ...fixtureFlags,
  });

  const stageClassification = classifyLifecycleStage(signalCollection);
  const scores = computeLifecycleScores({
    liveExecutionRunner,
    founderLaunchDecision,
    postLaunchReality,
    adoptionReality,
    revenueReality,
    productEvolutionReality,
    stageClassification,
  });

  const gapAnalysis = analyzeLifecycleGaps({
    signals: signalCollection,
    stageClassification,
    inputSnapshot,
  });

  const riskAnalysis = analyzeLifecycleRisk({
    signals: signalCollection,
    inputSnapshot,
    overallLifecycleScore: scores.overallLifecycleScore,
  });

  const nextAction = determineLifecycleNextAction({
    signals: signalCollection,
    stageClassification,
    gapAnalysis,
    riskAnalysis,
    inputSnapshot,
  });

  const canScaleNow = signalCollection.scalingSignalsPresent && !riskAnalysis.lifecycleStagnationRisk;

  const verdict = computeProductLifecycleVerdict({
    stageClassification,
    scores,
    gapAnalysis,
    riskAnalysis,
    nextAction,
    canScaleNow,
  });

  const report: ProductLifecycleRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    productLifecycleRealityState: verdict.productLifecycleRealityState,
    overallLifecycleScore: verdict.overallLifecycleScore,
    lifecycleConfidenceScore: verdict.lifecycleConfidenceScore,
    highestProvenStage: verdict.highestProvenStage,
    nextRequiredAction: verdict.nextRequiredAction,
    canScaleNow: verdict.canScaleNow,
    executionScore: scores.executionScore,
    launchScore: scores.launchScore,
    postLaunchScore: scores.postLaunchScore,
    adoptionScore: scores.adoptionScore,
    revenueScore: scores.revenueScore,
    evolutionScore: scores.evolutionScore,
    signalCollection,
    stageClassification,
    gapAnalysis,
    riskAnalysis,
    nextAction,
    keyFindings: verdict.keyFindings,
    missingEvidence: verdict.missingEvidence,
    lifecycleBlockers: verdict.lifecycleBlockers,
    riskSignals: verdict.riskSignals,
    recommendedActions: verdict.recommendedActions,
    finalVerdict: verdict.finalVerdict,
    verdict,
    inputSnapshot,
    cacheKey: stableCacheKey(assessmentId, verdict.productLifecycleRealityState, verdict.overallLifecycleScore),
  };

  const assessment: ProductLifecycleRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'PRODUCT_LIFECYCLE_REALITY_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordProductLifecycleRealityAssessment(assessment);
  }

  return assessment;
}

export function buildProductLifecycleRealityArtifacts(
  input: AssessProductLifecycleRealityInput = {},
): ProductLifecycleRealityArtifacts {
  const assessment = assessProductLifecycleReality(input);
  return {
    productLifecycleRealityAssessment: assessment,
    productLifecycleRealityReportMarkdown: buildProductLifecycleRealityReportMarkdown(assessment.report),
  };
}
