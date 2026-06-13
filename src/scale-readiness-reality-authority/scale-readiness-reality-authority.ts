/**
 * Scale Readiness Reality Authority — read-only scale readiness orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessProductLifecycleReality } from '../product-lifecycle-reality-orchestrator/index.js';
import { analyzeArchitectureScalability } from './architecture-scalability-analyzer.js';
import { analyzeCustomerSupportScalability } from './customer-support-scalability-analyzer.js';
import { analyzeFinancialScalability } from './financial-scalability-analyzer.js';
import { analyzeOperationalScalability } from './operational-scalability-analyzer.js';
import { analyzeReliabilityScalability } from './reliability-scalability-analyzer.js';
import { analyzeScaleRisk } from './scale-risk-analyzer.js';
import { analyzeTeamScalability } from './team-scalability-analyzer.js';
import { recordScaleReadinessRealityAssessment } from './scale-readiness-history.js';
import { buildScaleReadinessRealityReportMarkdown } from './scale-readiness-report-builder.js';
import {
  SCALE_READINESS_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  SCALE_READINESS_REALITY_AUTHORITY_PASS_TOKEN,
} from './scale-readiness-registry.js';
import { computeScaleReadinessVerdict } from './scale-readiness-verdict-engine.js';
import type {
  AssessScaleReadinessRealityInput,
  ScaleEvidenceBundle,
  ScaleReadinessRealityArtifacts,
  ScaleReadinessRealityAssessment,
  ScaleReadinessRealityReport,
} from './scale-readiness-types.js';

let assessmentCounter = 0;

export function resetScaleReadinessRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetScaleReadinessRealityAuthorityModuleForTests(): void {
  resetScaleReadinessRealityCounterForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `scale-readiness-reality-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: string, score: number): string {
  const digest = createHash('sha256')
    .update([SCALE_READINESS_REALITY_AUTHORITY_PASS_TOKEN, assessmentId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${SCALE_READINESS_REALITY_AUTHORITY_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveInput<T>(
  input: AssessScaleReadinessRealityInput,
  key: keyof AssessScaleReadinessRealityInput,
  factory: () => T,
): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

function buildEvidenceBundle(input: AssessScaleReadinessRealityInput): ScaleEvidenceBundle {
  const fixture = input.scaleEvidenceFixture;
  const base = input.scaleEvidence ?? {
    readOnly: true as const,
    architecture: null,
    operational: null,
    team: null,
    financial: null,
    customerSupport: null,
    reliability: null,
  };

  if (!fixture) return base;

  return {
    readOnly: true,
    architecture: fixture.architecture !== undefined ? fixture.architecture ?? null : base.architecture,
    operational: fixture.operational !== undefined ? fixture.operational ?? null : base.operational,
    team: fixture.team !== undefined ? fixture.team ?? null : base.team,
    financial: fixture.financial !== undefined ? fixture.financial ?? null : base.financial,
    customerSupport:
      fixture.customerSupport !== undefined ? fixture.customerSupport ?? null : base.customerSupport,
    reliability: fixture.reliability !== undefined ? fixture.reliability ?? null : base.reliability,
  };
}

export function assessScaleReadinessReality(
  input: AssessScaleReadinessRealityInput = {},
): ScaleReadinessRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const rejectFabricated = Boolean(input.fabricatedMetricsFixture);
  const fixtureFlags = {
    revenueOnly: input.revenueOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
    infrastructureOnly: input.infrastructureOnlyFixture,
    rejectFabricated,
  };

  const productLifecycleReality = resolveInput(input, 'productLifecycleReality', () =>
    assessProductLifecycleReality({
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

  const productEvolutionReality = resolveInput(input, 'productEvolutionReality', () =>
    productLifecycleReality?.inputSnapshot.productEvolutionReality ?? null,
  );
  const revenueReality = resolveInput(input, 'revenueReality', () =>
    productLifecycleReality?.inputSnapshot.revenueReality ??
    productEvolutionReality?.inputSnapshot.revenueReality ??
    null,
  );
  const adoptionReality = resolveInput(input, 'adoptionReality', () =>
    productLifecycleReality?.inputSnapshot.adoptionReality ??
    productEvolutionReality?.inputSnapshot.adoptionReality ??
    null,
  );
  const postLaunchReality = resolveInput(input, 'postLaunchReality', () =>
    productLifecycleReality?.inputSnapshot.postLaunchReality ??
    productEvolutionReality?.inputSnapshot.postLaunchReality ??
    null,
  );
  const founderLaunchDecision = resolveInput(input, 'founderLaunchDecision', () =>
    productLifecycleReality?.inputSnapshot.founderLaunchDecision ??
    productEvolutionReality?.inputSnapshot.founderLaunchDecision ??
    null,
  );

  const scaleEvidence = buildEvidenceBundle(input);
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
    revenueObserved,
    ...fixtureFlags,
    rejectFabricated,
  };

  const architecture = analyzeArchitectureScalability({
    evidence: scaleEvidence.architecture,
    ...analyzerInput,
  });
  const operational = analyzeOperationalScalability({
    evidence: scaleEvidence.operational,
    ...analyzerInput,
  });
  const team = analyzeTeamScalability({
    evidence: scaleEvidence.team,
    ...analyzerInput,
  });
  const financial = analyzeFinancialScalability({
    evidence: scaleEvidence.financial,
    ...analyzerInput,
  });
  const customerSupport = analyzeCustomerSupportScalability({
    evidence: scaleEvidence.customerSupport,
    ...analyzerInput,
  });
  const reliability = analyzeReliabilityScalability({
    evidence: scaleEvidence.reliability,
    postLaunchReliabilityScore: postLaunchReality?.reliabilityScore,
    ...analyzerInput,
  });

  const scaleRisk = analyzeScaleRisk({
    architecture,
    operational,
    team,
    financial,
    customerSupport,
    reliability,
    productLaunched,
    revenueOnly: input.revenueOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
    infrastructureOnly: input.infrastructureOnlyFixture,
  });

  const overallScaleReadinessScore = Math.round(
    architecture.architectureScalabilityScore * 0.18 +
      operational.operationalScalabilityScore * 0.18 +
      team.teamScalabilityScore * 0.12 +
      financial.financialScalabilityScore * 0.15 +
      customerSupport.supportScalabilityScore * 0.12 +
      reliability.reliabilityScalabilityScore * 0.15 +
      (100 - scaleRisk.scaleRiskScore) * 0.1,
  );

  const verdict = computeScaleReadinessVerdict({
    architecture,
    operational,
    team,
    financial,
    customerSupport,
    reliability,
    scaleRisk,
    overallScaleReadinessScore,
    productLaunched,
    ...fixtureFlags,
  });

  const inputSnapshot = {
    readOnly: true as const,
    productLifecycleReality,
    productEvolutionReality,
    revenueReality,
    adoptionReality,
    postLaunchReality,
    founderLaunchDecision,
    scaleEvidence,
    productLaunched,
    revenueObserved,
    adoptionObserved,
  };

  const report: ScaleReadinessRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    scaleReadinessState: verdict.scaleReadinessState,
    overallScaleReadinessScore: verdict.overallScaleReadinessScore,
    confidence: verdict.confidence,
    architectureReady: verdict.architectureReady,
    operationsReady: verdict.operationsReady,
    teamReady: verdict.teamReady,
    financiallyReady: verdict.financiallyReady,
    supportReady: verdict.supportReady,
    reliabilityReady: verdict.reliabilityReady,
    architectureScalabilityScore: architecture.architectureScalabilityScore,
    operationalScalabilityScore: operational.operationalScalabilityScore,
    teamScalabilityScore: team.teamScalabilityScore,
    financialScalabilityScore: financial.financialScalabilityScore,
    supportScalabilityScore: customerSupport.supportScalabilityScore,
    reliabilityScalabilityScore: reliability.reliabilityScalabilityScore,
    scaleRiskScore: scaleRisk.scaleRiskScore,
    architecture,
    operational,
    team,
    financial,
    customerSupport,
    reliability,
    scaleRisk,
    riskSignals: verdict.riskSignals,
    missingEvidence: verdict.missingEvidence,
    keyFindings: verdict.keyFindings,
    recommendedActions: verdict.recommendedActions,
    finalVerdict: verdict.finalVerdict,
    verdict,
    inputSnapshot,
    cacheKey: stableCacheKey(assessmentId, verdict.scaleReadinessState, verdict.overallScaleReadinessScore),
  };

  const assessment: ScaleReadinessRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'SCALE_READINESS_REALITY_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordScaleReadinessRealityAssessment(assessment);
  }

  return assessment;
}

export function buildScaleReadinessRealityArtifacts(
  input: AssessScaleReadinessRealityInput = {},
): ScaleReadinessRealityArtifacts {
  const assessment = assessScaleReadinessReality(input);
  return {
    scaleReadinessRealityAssessment: assessment,
    scaleReadinessRealityReportMarkdown: buildScaleReadinessRealityReportMarkdown(assessment.report),
  };
}
