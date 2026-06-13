/**
 * Market Expansion Reality Authority — read-only expansion readiness orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessScaleReadinessReality } from '../scale-readiness-reality-authority/index.js';
import { analyzeChannelExpansion } from './channel-expansion-analyzer.js';
import { analyzeCustomerSegmentExpansion } from './customer-segment-expansion-analyzer.js';
import { analyzeExpansionRisk } from './expansion-risk-analyzer.js';
import { analyzeIndustryExpansion } from './industry-expansion-analyzer.js';
import { analyzeProductMarketFitResilience } from './product-market-fit-resilience-analyzer.js';
import { analyzeRegionalExpansion } from './regional-expansion-analyzer.js';
import { recordMarketExpansionRealityAssessment } from './market-expansion-reality-history.js';
import { buildMarketExpansionRealityReportMarkdown } from './market-expansion-report-builder.js';
import {
  MARKET_EXPANSION_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  MARKET_EXPANSION_REALITY_AUTHORITY_PASS_TOKEN,
} from './market-expansion-reality-registry.js';
import { computeMarketExpansionVerdict } from './market-expansion-verdict-engine.js';
import type {
  AssessMarketExpansionRealityInput,
  ExpansionEvidenceBundle,
  MarketExpansionInputSnapshot,
  MarketExpansionRealityArtifacts,
  MarketExpansionRealityAssessment,
  MarketExpansionRealityReport,
} from './market-expansion-reality-types.js';

let assessmentCounter = 0;

export function resetMarketExpansionRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetMarketExpansionRealityAuthorityModuleForTests(): void {
  resetMarketExpansionRealityCounterForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `market-expansion-reality-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: string, score: number): string {
  const digest = createHash('sha256')
    .update([MARKET_EXPANSION_REALITY_AUTHORITY_PASS_TOKEN, assessmentId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${MARKET_EXPANSION_REALITY_AUTHORITY_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveInput<T>(
  input: AssessMarketExpansionRealityInput,
  key: keyof AssessMarketExpansionRealityInput,
  factory: () => T,
): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

function buildEvidenceBundle(input: AssessMarketExpansionRealityInput): ExpansionEvidenceBundle {
  const fixture = input.expansionEvidenceFixture;
  const base = input.expansionEvidence ?? {
    readOnly: true as const,
    customerSegment: null,
    industry: null,
    regional: null,
    channel: null,
    productMarketFit: null,
  };

  if (!fixture) return base;

  return {
    readOnly: true,
    customerSegment:
      fixture.customerSegment !== undefined ? fixture.customerSegment ?? null : base.customerSegment,
    industry: fixture.industry !== undefined ? fixture.industry ?? null : base.industry,
    regional: fixture.regional !== undefined ? fixture.regional ?? null : base.regional,
    channel: fixture.channel !== undefined ? fixture.channel ?? null : base.channel,
    productMarketFit:
      fixture.productMarketFit !== undefined ? fixture.productMarketFit ?? null : base.productMarketFit,
  };
}

export function assessMarketExpansionReality(
  input: AssessMarketExpansionRealityInput = {},
): MarketExpansionRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const rejectFabricated = Boolean(input.fabricatedMetricsFixture);
  const fixtureFlags = {
    revenueOnly: input.revenueOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
    scaleReadinessOnly: input.scaleReadinessOnlyFixture,
    rejectFabricated,
  };

  const scaleReadinessReality = resolveInput(input, 'scaleReadinessReality', () =>
    assessScaleReadinessReality({
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
      scaleEvidenceFixture: input.scaleEvidenceFixture ?? undefined,
      skipHistoryRecording: true,
    }).report,
  );

  const productLifecycleReality = resolveInput(input, 'productLifecycleReality', () =>
    scaleReadinessReality?.inputSnapshot.productLifecycleReality ?? null,
  );
  const productEvolutionReality = resolveInput(input, 'productEvolutionReality', () =>
    scaleReadinessReality?.inputSnapshot.productEvolutionReality ??
    productLifecycleReality?.inputSnapshot.productEvolutionReality ??
    null,
  );
  const revenueReality = resolveInput(input, 'revenueReality', () =>
    scaleReadinessReality?.inputSnapshot.revenueReality ??
    productLifecycleReality?.inputSnapshot.revenueReality ??
    null,
  );
  const adoptionReality = resolveInput(input, 'adoptionReality', () =>
    scaleReadinessReality?.inputSnapshot.adoptionReality ??
    productLifecycleReality?.inputSnapshot.adoptionReality ??
    null,
  );
  const postLaunchReality = resolveInput(input, 'postLaunchReality', () =>
    scaleReadinessReality?.inputSnapshot.postLaunchReality ??
    productLifecycleReality?.inputSnapshot.postLaunchReality ??
    null,
  );

  const expansionEvidence = buildEvidenceBundle(input);
  const productLaunched = Boolean(
    postLaunchReality?.activityObserved ||
      productLifecycleReality?.productLifecycleRealityState === 'LAUNCHED' ||
      productLifecycleReality?.productLifecycleRealityState === 'ADOPTED' ||
      productLifecycleReality?.productLifecycleRealityState === 'REVENUE_GENERATING' ||
      productLifecycleReality?.productLifecycleRealityState === 'EVOLVING_PRODUCT' ||
      productLifecycleReality?.productLifecycleRealityState === 'SCALING_PRODUCT',
  );
  const revenueObserved = Boolean(revenueReality?.revenueObserved);
  const adoptionObserved = Boolean(adoptionReality?.repeatUsageObserved);
  const scaleReady =
    scaleReadinessReality?.scaleReadinessState === 'SCALE_READY' ||
    scaleReadinessReality?.scaleReadinessState === 'SCALE_RESILIENT';
  const localMarketSuccess =
    productLaunched &&
    (revenueObserved || adoptionObserved) &&
    !input.revenueOnlyFixture &&
    !input.adoptionOnlyFixture;

  const analyzerInput = {
    productLaunched,
    adoptionObserved,
    revenueObserved,
    ...fixtureFlags,
    rejectFabricated,
  };

  const customerSegment = analyzeCustomerSegmentExpansion({
    evidence: expansionEvidence.customerSegment,
    ...analyzerInput,
  });
  const industry = analyzeIndustryExpansion({
    evidence: expansionEvidence.industry,
    ...analyzerInput,
  });
  const regional = analyzeRegionalExpansion({
    evidence: expansionEvidence.regional,
    ...analyzerInput,
  });
  const channel = analyzeChannelExpansion({
    evidence: expansionEvidence.channel,
    ...analyzerInput,
  });
  const productMarketFit = analyzeProductMarketFitResilience({
    evidence: expansionEvidence.productMarketFit,
    ...analyzerInput,
  });

  const expansionRisk = analyzeExpansionRisk({
    customerSegment,
    industry,
    regional,
    channel,
    productMarketFit,
    productLaunched,
    revenueOnly: input.revenueOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
    scaleReadinessOnly: input.scaleReadinessOnlyFixture,
  });

  const overallExpansionScore = Math.round(
    customerSegment.customerSegmentScore * 0.22 +
      industry.industryScore * 0.18 +
      regional.regionalScore * 0.18 +
      channel.channelScore * 0.15 +
      productMarketFit.productMarketFitScore * 0.17 +
      (100 - expansionRisk.expansionRiskScore) * 0.1,
  );

  const verdict = computeMarketExpansionVerdict({
    customerSegment,
    industry,
    regional,
    channel,
    productMarketFit,
    expansionRisk,
    overallExpansionScore,
    productLaunched,
    localMarketSuccess,
    ...fixtureFlags,
  });

  const inputSnapshot: MarketExpansionInputSnapshot = {
    readOnly: true,
    scaleReadinessReality,
    productLifecycleReality,
    productEvolutionReality,
    revenueReality,
    adoptionReality,
    postLaunchReality,
    expansionEvidence,
    productLaunched,
    revenueObserved,
    adoptionObserved,
    scaleReady,
  };

  const report: MarketExpansionRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    marketExpansionState: verdict.marketExpansionState,
    overallExpansionScore: verdict.overallExpansionScore,
    confidence: verdict.confidence,
    segmentExpansionReady: verdict.segmentExpansionReady,
    industryExpansionReady: verdict.industryExpansionReady,
    regionalExpansionReady: verdict.regionalExpansionReady,
    channelExpansionReady: verdict.channelExpansionReady,
    customerSegmentScore: customerSegment.customerSegmentScore,
    industryScore: industry.industryScore,
    regionalScore: regional.regionalScore,
    channelScore: channel.channelScore,
    productMarketFitScore: productMarketFit.productMarketFitScore,
    expansionRiskScore: expansionRisk.expansionRiskScore,
    customerSegment,
    industry,
    regional,
    channel,
    productMarketFit,
    expansionRisk,
    riskSignals: verdict.riskSignals,
    missingEvidence: verdict.missingEvidence,
    keyFindings: verdict.keyFindings,
    recommendedActions: verdict.recommendedActions,
    finalVerdict: verdict.finalVerdict,
    verdict,
    inputSnapshot,
    cacheKey: stableCacheKey(assessmentId, verdict.marketExpansionState, verdict.overallExpansionScore),
  };

  const assessment: MarketExpansionRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'MARKET_EXPANSION_REALITY_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordMarketExpansionRealityAssessment(assessment);
  }

  return assessment;
}

export function buildMarketExpansionRealityArtifacts(
  input: AssessMarketExpansionRealityInput = {},
): MarketExpansionRealityArtifacts {
  const assessment = assessMarketExpansionReality(input);
  return {
    marketExpansionRealityAssessment: assessment,
    marketExpansionRealityReportMarkdown: buildMarketExpansionRealityReportMarkdown(assessment.report),
  };
}
