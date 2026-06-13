/**
 * Strategic Defensibility Reality Authority — read-only defensibility orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessMarketExpansionReality } from '../market-expansion-reality-authority/index.js';
import { analyzeBrandTrust } from './brand-trust-analyzer.js';
import { analyzeDataAdvantage } from './data-advantage-analyzer.js';
import { analyzeDefensibilityRisk } from './defensibility-risk-analyzer.js';
import { analyzeDistributionAdvantage } from './distribution-advantage-analyzer.js';
import { analyzeExecutionAdvantage } from './execution-advantage-analyzer.js';
import { analyzeNetworkEffects } from './network-effects-analyzer.js';
import { analyzeSwitchingCost } from './switching-cost-analyzer.js';
import { recordStrategicDefensibilityRealityAssessment } from './strategic-defensibility-history.js';
import { buildStrategicDefensibilityRealityReportMarkdown } from './strategic-defensibility-report-builder.js';
import {
  STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PASS_TOKEN,
} from './strategic-defensibility-registry.js';
import { computeStrategicDefensibilityVerdict } from './strategic-defensibility-verdict-engine.js';
import type {
  AssessStrategicDefensibilityRealityInput,
  DefensibilityEvidenceBundle,
  StrategicDefensibilityInputSnapshot,
  StrategicDefensibilityRealityArtifacts,
  StrategicDefensibilityRealityAssessment,
  StrategicDefensibilityRealityReport,
} from './strategic-defensibility-types.js';

let assessmentCounter = 0;

export function resetStrategicDefensibilityRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetStrategicDefensibilityRealityAuthorityModuleForTests(): void {
  resetStrategicDefensibilityRealityCounterForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `strategic-defensibility-reality-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: string, score: number): string {
  const digest = createHash('sha256')
    .update([STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PASS_TOKEN, assessmentId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveInput<T>(
  input: AssessStrategicDefensibilityRealityInput,
  key: keyof AssessStrategicDefensibilityRealityInput,
  factory: () => T,
): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

function buildEvidenceBundle(input: AssessStrategicDefensibilityRealityInput): DefensibilityEvidenceBundle {
  const fixture = input.defensibilityEvidenceFixture;
  const base = input.defensibilityEvidence ?? {
    readOnly: true as const,
    networkEffects: null,
    dataAdvantage: null,
    switchingCost: null,
    brandTrust: null,
    distributionAdvantage: null,
    executionAdvantage: null,
  };

  if (!fixture) return base;

  return {
    readOnly: true,
    networkEffects:
      fixture.networkEffects !== undefined ? fixture.networkEffects ?? null : base.networkEffects,
    dataAdvantage:
      fixture.dataAdvantage !== undefined ? fixture.dataAdvantage ?? null : base.dataAdvantage,
    switchingCost:
      fixture.switchingCost !== undefined ? fixture.switchingCost ?? null : base.switchingCost,
    brandTrust: fixture.brandTrust !== undefined ? fixture.brandTrust ?? null : base.brandTrust,
    distributionAdvantage:
      fixture.distributionAdvantage !== undefined
        ? fixture.distributionAdvantage ?? null
        : base.distributionAdvantage,
    executionAdvantage:
      fixture.executionAdvantage !== undefined
        ? fixture.executionAdvantage ?? null
        : base.executionAdvantage,
  };
}

export function assessStrategicDefensibilityReality(
  input: AssessStrategicDefensibilityRealityInput = {},
): StrategicDefensibilityRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const rejectFabricated = Boolean(input.fabricatedMetricsFixture);
  const fixtureFlags = {
    revenueOnly: input.revenueOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
    marketExpansionOnly: input.marketExpansionOnlyFixture,
    rejectFabricated,
  };

  const marketExpansionReality = resolveInput(input, 'marketExpansionReality', () =>
    assessMarketExpansionReality({
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
      expansionEvidenceFixture: input.expansionEvidenceFixture ?? undefined,
      skipHistoryRecording: true,
    }).report,
  );

  const scaleReadinessReality = resolveInput(input, 'scaleReadinessReality', () =>
    marketExpansionReality?.inputSnapshot.scaleReadinessReality ?? null,
  );
  const productLifecycleReality = resolveInput(input, 'productLifecycleReality', () =>
    marketExpansionReality?.inputSnapshot.productLifecycleReality ??
    scaleReadinessReality?.inputSnapshot.productLifecycleReality ??
    null,
  );
  const productEvolutionReality = resolveInput(input, 'productEvolutionReality', () =>
    marketExpansionReality?.inputSnapshot.productEvolutionReality ??
    productLifecycleReality?.inputSnapshot.productEvolutionReality ??
    null,
  );
  const revenueReality = resolveInput(input, 'revenueReality', () =>
    marketExpansionReality?.inputSnapshot.revenueReality ??
    productLifecycleReality?.inputSnapshot.revenueReality ??
    null,
  );
  const adoptionReality = resolveInput(input, 'adoptionReality', () =>
    marketExpansionReality?.inputSnapshot.adoptionReality ??
    productLifecycleReality?.inputSnapshot.adoptionReality ??
    null,
  );
  const postLaunchReality = resolveInput(input, 'postLaunchReality', () =>
    marketExpansionReality?.inputSnapshot.postLaunchReality ??
    productLifecycleReality?.inputSnapshot.postLaunchReality ??
    null,
  );

  const defensibilityEvidence = buildEvidenceBundle(input);
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

  const analyzerInput = {
    productLaunched,
    adoptionObserved,
    ...fixtureFlags,
    rejectFabricated,
  };

  const networkEffects = analyzeNetworkEffects({
    evidence: defensibilityEvidence.networkEffects,
    ...analyzerInput,
  });
  const dataAdvantage = analyzeDataAdvantage({
    evidence: defensibilityEvidence.dataAdvantage,
    ...analyzerInput,
  });
  const switchingCost = analyzeSwitchingCost({
    evidence: defensibilityEvidence.switchingCost,
    ...analyzerInput,
  });
  const brandTrust = analyzeBrandTrust({
    evidence: defensibilityEvidence.brandTrust,
    ...analyzerInput,
  });
  const distributionAdvantage = analyzeDistributionAdvantage({
    evidence: defensibilityEvidence.distributionAdvantage,
    ...analyzerInput,
  });
  const executionAdvantage = analyzeExecutionAdvantage({
    evidence: defensibilityEvidence.executionAdvantage,
    ...analyzerInput,
  });

  const defensibilityRisk = analyzeDefensibilityRisk({
    networkEffects,
    dataAdvantage,
    switchingCost,
    brandTrust,
    distributionAdvantage,
    executionAdvantage,
    productLaunched,
    revenueOnly: input.revenueOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
    marketExpansionOnly: input.marketExpansionOnlyFixture,
  });

  const overallDefensibilityScore = Math.round(
    networkEffects.networkEffectsScore * 0.18 +
      dataAdvantage.dataAdvantageScore * 0.18 +
      switchingCost.switchingCostScore * 0.2 +
      brandTrust.brandTrustScore * 0.12 +
      distributionAdvantage.distributionScore * 0.12 +
      executionAdvantage.executionAdvantageScore * 0.12 +
      (100 - defensibilityRisk.defensibilityRiskScore) * 0.08,
  );

  const verdict = computeStrategicDefensibilityVerdict({
    networkEffects,
    dataAdvantage,
    switchingCost,
    brandTrust,
    distributionAdvantage,
    executionAdvantage,
    defensibilityRisk,
    overallDefensibilityScore,
    productLaunched,
    ...fixtureFlags,
  });

  const inputSnapshot: StrategicDefensibilityInputSnapshot = {
    readOnly: true,
    marketExpansionReality,
    scaleReadinessReality,
    productLifecycleReality,
    productEvolutionReality,
    revenueReality,
    adoptionReality,
    postLaunchReality,
    defensibilityEvidence,
    productLaunched,
    revenueObserved,
    adoptionObserved,
  };

  const report: StrategicDefensibilityRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    strategicDefensibilityState: verdict.strategicDefensibilityState,
    overallDefensibilityScore: verdict.overallDefensibilityScore,
    confidence: verdict.confidence,
    networkEffectsObserved: verdict.networkEffectsObserved,
    dataAdvantageObserved: verdict.dataAdvantageObserved,
    switchingCostObserved: verdict.switchingCostObserved,
    brandTrustObserved: verdict.brandTrustObserved,
    networkEffectsScore: networkEffects.networkEffectsScore,
    dataAdvantageScore: dataAdvantage.dataAdvantageScore,
    switchingCostScore: switchingCost.switchingCostScore,
    brandTrustScore: brandTrust.brandTrustScore,
    distributionScore: distributionAdvantage.distributionScore,
    executionAdvantageScore: executionAdvantage.executionAdvantageScore,
    defensibilityRiskScore: defensibilityRisk.defensibilityRiskScore,
    networkEffects,
    dataAdvantage,
    switchingCost,
    brandTrust,
    distributionAdvantage,
    executionAdvantage,
    defensibilityRisk,
    riskSignals: verdict.riskSignals,
    missingEvidence: verdict.missingEvidence,
    keyFindings: verdict.keyFindings,
    recommendedActions: verdict.recommendedActions,
    finalVerdict: verdict.finalVerdict,
    verdict,
    inputSnapshot,
    cacheKey: stableCacheKey(assessmentId, verdict.strategicDefensibilityState, verdict.overallDefensibilityScore),
  };

  const assessment: StrategicDefensibilityRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'STRATEGIC_DEFENSIBILITY_REALITY_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordStrategicDefensibilityRealityAssessment(assessment);
  }

  return assessment;
}

export function buildStrategicDefensibilityRealityArtifacts(
  input: AssessStrategicDefensibilityRealityInput = {},
): StrategicDefensibilityRealityArtifacts {
  const assessment = assessStrategicDefensibilityReality(input);
  return {
    strategicDefensibilityRealityAssessment: assessment,
    strategicDefensibilityRealityReportMarkdown: buildStrategicDefensibilityRealityReportMarkdown(
      assessment.report,
    ),
  };
}
