/**
 * Product Evolution Reality Authority — read-only evolution evidence orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessRevenueReality } from '../revenue-reality-authority/index.js';
import { analyzeEvolutionRisk } from './evolution-risk-analyzer.js';
import { analyzeFailureLearning } from './failure-learning-analyzer.js';
import { analyzeFeedbackLearning } from './feedback-learning-analyzer.js';
import { analyzeImprovementVelocity } from './improvement-velocity-analyzer.js';
import { analyzeRevenueLearning } from './revenue-learning-analyzer.js';
import { analyzeUsageLearning } from './usage-learning-analyzer.js';
import { recordProductEvolutionRealityAssessment } from './product-evolution-reality-history.js';
import { buildProductEvolutionRealityReportMarkdown } from './product-evolution-report-builder.js';
import {
  PRODUCT_EVOLUTION_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  PRODUCT_EVOLUTION_REALITY_AUTHORITY_PASS_TOKEN,
} from './product-evolution-reality-registry.js';
import { computeProductEvolutionVerdict } from './product-evolution-verdict-engine.js';
import type {
  AssessProductEvolutionRealityInput,
  EvolutionEvidenceBundle,
  ProductEvolutionRealityArtifacts,
  ProductEvolutionRealityAssessment,
  ProductEvolutionRealityReport,
} from './product-evolution-reality-types.js';

let assessmentCounter = 0;

export function resetProductEvolutionRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetProductEvolutionRealityAuthorityModuleForTests(): void {
  resetProductEvolutionRealityCounterForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `product-evolution-reality-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: string, score: number): string {
  const digest = createHash('sha256')
    .update([PRODUCT_EVOLUTION_REALITY_AUTHORITY_PASS_TOKEN, assessmentId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${PRODUCT_EVOLUTION_REALITY_AUTHORITY_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveInput<T>(
  input: AssessProductEvolutionRealityInput,
  key: keyof AssessProductEvolutionRealityInput,
  factory: () => T,
): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

function buildEvidenceBundle(input: AssessProductEvolutionRealityInput): EvolutionEvidenceBundle {
  const fixture = input.evolutionEvidenceFixture;
  const base = input.evolutionEvidence ?? {
    readOnly: true as const,
    feedbackLearning: null,
    failureLearning: null,
    usageLearning: null,
    revenueLearning: null,
    improvementVelocity: null,
  };

  if (!fixture) return base;

  return {
    readOnly: true,
    feedbackLearning:
      fixture.feedbackLearning !== undefined ? fixture.feedbackLearning ?? null : base.feedbackLearning,
    failureLearning:
      fixture.failureLearning !== undefined ? fixture.failureLearning ?? null : base.failureLearning,
    usageLearning: fixture.usageLearning !== undefined ? fixture.usageLearning ?? null : base.usageLearning,
    revenueLearning: fixture.revenueLearning !== undefined ? fixture.revenueLearning ?? null : base.revenueLearning,
    improvementVelocity:
      fixture.improvementVelocity !== undefined ? fixture.improvementVelocity ?? null : base.improvementVelocity,
  };
}

export function assessProductEvolutionReality(
  input: AssessProductEvolutionRealityInput = {},
): ProductEvolutionRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const rejectFabricated = Boolean(input.fabricatedMetricsFixture);
  const fixtureFlags = {
    featureAdditionsOnly: input.featureAdditionsOnlyFixture,
    roadmapOnly: input.roadmapOnlyFixture,
    rejectFabricated,
  };

  const revenueReality = resolveInput(input, 'revenueReality', () =>
    assessRevenueReality({
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
      skipHistoryRecording: true,
    }).report,
  );

  const adoptionReality = resolveInput(input, 'adoptionReality', () =>
    revenueReality?.inputSnapshot.adoptionReality ?? null,
  );

  const postLaunchReality = resolveInput(input, 'postLaunchReality', () =>
    revenueReality?.inputSnapshot.postLaunchReality ?? null,
  );

  const founderLaunchDecision = resolveInput(input, 'founderLaunchDecision', () =>
    revenueReality?.inputSnapshot.founderLaunchDecision ?? null,
  );

  const evolutionEvidence = buildEvidenceBundle(input);
  const productLaunched = Boolean(
    postLaunchReality?.activityObserved ||
      revenueReality?.revenueObserved ||
      adoptionReality?.repeatUsageObserved,
  );
  const adoptionObserved = Boolean(adoptionReality?.repeatUsageObserved);
  const revenueObserved = Boolean(revenueReality?.revenueObserved);

  const feedbackLearning = analyzeFeedbackLearning({
    evidence: evolutionEvidence.feedbackLearning,
    productLaunched,
    ...fixtureFlags,
  });

  const failureLearning = analyzeFailureLearning({
    evidence: evolutionEvidence.failureLearning,
    productLaunched,
    ...fixtureFlags,
  });

  const usageLearning = analyzeUsageLearning({
    evidence: evolutionEvidence.usageLearning,
    adoptionObserved,
    ...fixtureFlags,
  });

  const revenueLearning = analyzeRevenueLearning({
    evidence: evolutionEvidence.revenueLearning,
    revenueObserved,
    ...fixtureFlags,
  });

  const anyLearningObserved =
    feedbackLearning.feedbackLearningScore > 0 ||
    failureLearning.failureLearningScore > 0 ||
    usageLearning.usageLearningScore > 0 ||
    revenueLearning.revenueLearningScore > 0;

  const improvementVelocity = analyzeImprovementVelocity({
    evidence: evolutionEvidence.improvementVelocity,
    anyLearningObserved,
    ...fixtureFlags,
  });

  const evolutionRisk = analyzeEvolutionRisk({
    feedbackLearning,
    failureLearning,
    usageLearning,
    improvementVelocity,
    productLaunched,
    featureAdditionsOnly: input.featureAdditionsOnlyFixture,
    roadmapOnly: input.roadmapOnlyFixture,
  });

  const overallEvolutionScore = Math.round(
    feedbackLearning.feedbackLearningScore * 0.22 +
      failureLearning.failureLearningScore * 0.18 +
      usageLearning.usageLearningScore * 0.2 +
      revenueLearning.revenueLearningScore * 0.15 +
      improvementVelocity.improvementVelocityScore * 0.15 +
      (100 - evolutionRisk.evolutionRiskScore) * 0.1,
  );

  const verdict = computeProductEvolutionVerdict({
    feedbackLearning,
    failureLearning,
    usageLearning,
    revenueLearning,
    improvementVelocity,
    evolutionRisk,
    overallEvolutionScore,
    productLaunched,
    rejectFabricated,
    featureAdditionsOnly: input.featureAdditionsOnlyFixture,
    roadmapOnly: input.roadmapOnlyFixture,
  });

  const inputSnapshot = {
    readOnly: true as const,
    revenueReality,
    adoptionReality,
    postLaunchReality,
    founderLaunchDecision,
    evolutionEvidence,
    productLaunched,
  };

  const report: ProductEvolutionRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    productEvolutionState: verdict.productEvolutionState,
    overallEvolutionScore: verdict.overallEvolutionScore,
    confidence: verdict.confidence,
    feedbackLearningObserved: verdict.feedbackLearningObserved,
    failureLearningObserved: verdict.failureLearningObserved,
    usageLearningObserved: verdict.usageLearningObserved,
    revenueLearningObserved: verdict.revenueLearningObserved,
    feedbackLearningScore: feedbackLearning.feedbackLearningScore,
    failureLearningScore: failureLearning.failureLearningScore,
    usageLearningScore: usageLearning.usageLearningScore,
    revenueLearningScore: revenueLearning.revenueLearningScore,
    improvementVelocityScore: improvementVelocity.improvementVelocityScore,
    evolutionRiskScore: evolutionRisk.evolutionRiskScore,
    feedbackLearning,
    failureLearning,
    usageLearning,
    revenueLearning,
    improvementVelocity,
    evolutionRisk,
    riskSignals: verdict.riskSignals,
    missingEvidence: verdict.missingEvidence,
    keyFindings: verdict.keyFindings,
    recommendedActions: verdict.recommendedActions,
    finalVerdict: verdict.finalVerdict,
    verdict,
    inputSnapshot,
    cacheKey: stableCacheKey(assessmentId, verdict.productEvolutionState, verdict.overallEvolutionScore),
  };

  const assessment: ProductEvolutionRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'PRODUCT_EVOLUTION_REALITY_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordProductEvolutionRealityAssessment(assessment);
  }

  return assessment;
}

export function buildProductEvolutionRealityArtifacts(
  input: AssessProductEvolutionRealityInput = {},
): ProductEvolutionRealityArtifacts {
  const assessment = assessProductEvolutionReality(input);
  return {
    productEvolutionRealityAssessment: assessment,
    productEvolutionRealityReportMarkdown: buildProductEvolutionRealityReportMarkdown(assessment.report),
  };
}
