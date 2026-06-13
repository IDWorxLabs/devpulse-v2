/**
 * Adoption Reality Authority — read-only adoption evidence orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessPostLaunchReality } from '../post-launch-reality-authority/index.js';
import { analyzeAdoptionRisk } from './adoption-risk-analyzer.js';
import { analyzeBehavioralIntegration } from './behavioral-integration-analyzer.js';
import { analyzeFeatureAdoption } from './feature-adoption-analyzer.js';
import { analyzeRepeatUsage } from './repeat-usage-analyzer.js';
import { analyzeUserDependency } from './user-dependency-analyzer.js';
import { recordAdoptionRealityAssessment } from './adoption-reality-history.js';
import { buildAdoptionRealityReportMarkdown } from './adoption-reality-report-builder.js';
import {
  ADOPTION_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  ADOPTION_REALITY_AUTHORITY_PASS_TOKEN,
} from './adoption-reality-registry.js';
import { computeAdoptionVerdict } from './adoption-verdict-engine.js';
import type {
  AdoptionEvidenceBundle,
  AdoptionRealityArtifacts,
  AdoptionRealityAssessment,
  AdoptionRealityReport,
  AssessAdoptionRealityInput,
} from './adoption-reality-types.js';

let assessmentCounter = 0;

export function resetAdoptionRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetAdoptionRealityAuthorityModuleForTests(): void {
  resetAdoptionRealityCounterForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `adoption-reality-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: string, score: number): string {
  const digest = createHash('sha256')
    .update([ADOPTION_REALITY_AUTHORITY_PASS_TOKEN, assessmentId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${ADOPTION_REALITY_AUTHORITY_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveInput<T>(input: AssessAdoptionRealityInput, key: keyof AssessAdoptionRealityInput, factory: () => T): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

function buildEvidenceBundle(input: AssessAdoptionRealityInput): AdoptionEvidenceBundle {
  const fixture = input.adoptionEvidenceFixture;
  const base = input.adoptionEvidence ?? {
    readOnly: true as const,
    repeatUsage: null,
    behavioralIntegration: null,
    featureAdoption: null,
    userDependency: null,
  };

  if (!fixture) return base;

  return {
    readOnly: true,
    repeatUsage: fixture.repeatUsage !== undefined ? fixture.repeatUsage ?? null : base.repeatUsage,
    behavioralIntegration:
      fixture.behavioralIntegration !== undefined ? fixture.behavioralIntegration ?? null : base.behavioralIntegration,
    featureAdoption: fixture.featureAdoption !== undefined ? fixture.featureAdoption ?? null : base.featureAdoption,
    userDependency: fixture.userDependency !== undefined ? fixture.userDependency ?? null : base.userDependency,
  };
}

export function assessAdoptionReality(input: AssessAdoptionRealityInput = {}): AdoptionRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const rejectFabricated = Boolean(input.fabricatedMetricsFixture);
  const fixtureFlags = {
    trafficOnly: input.trafficOnlyFixture,
    signupsOnly: input.signupsOnlyFixture,
    oneTimeUsage: input.oneTimeUsageFixture,
    rejectFabricated,
  };

  const postLaunchReality = resolveInput(input, 'postLaunchReality', () =>
    assessPostLaunchReality({
      rootDir,
      rawPrompt: input.rawPrompt,
      requirementsToPlanContract: input.requirementsToPlanContract,
      observedBuildEvidence: input.observedBuildEvidence,
      runtimeSessionEvidence: input.runtimeSessionEvidence,
      previewSessionEvidence: input.previewSessionEvidence,
      verificationEvidenceFixture: input.verificationEvidenceFixture,
      launchReadinessFixture: input.launchReadinessFixture,
      postLaunchEvidenceFixture: input.postLaunchEvidenceFixture ?? undefined,
      skipHistoryRecording: true,
    }).report,
  );

  const founderLaunchDecision = resolveInput(input, 'founderLaunchDecision', () =>
    postLaunchReality?.inputSnapshot.founderLaunchDecision ?? null,
  );

  const adoptionEvidence = buildEvidenceBundle(input);
  const postLaunchActivityObserved = Boolean(postLaunchReality?.activityObserved);

  const repeatUsage = analyzeRepeatUsage({
    evidence: adoptionEvidence.repeatUsage,
    postLaunchActivityObserved,
    ...fixtureFlags,
  });

  const repeatUsageObserved = repeatUsage.repeatUsers && repeatUsage.repeatSessions;

  const behavioralIntegration = analyzeBehavioralIntegration({
    evidence: adoptionEvidence.behavioralIntegration,
    repeatUsageObserved,
    ...fixtureFlags,
  });

  const behavioralIntegrationObserved =
    behavioralIntegration.workflowIntegration && behavioralIntegration.routineUsageIndicators;

  const featureAdoption = analyzeFeatureAdoption({
    evidence: adoptionEvidence.featureAdoption,
    repeatUsageObserved,
    ...fixtureFlags,
  });

  const featureAdoptionObserved =
    featureAdoption.coreFeatureUsage && featureAdoption.featureStickiness && repeatUsageObserved;

  const userDependency = analyzeUserDependency({
    evidence: adoptionEvidence.userDependency,
    behavioralIntegrationObserved,
    featureAdoptionObserved,
    ...fixtureFlags,
  });

  const adoptionRisk = analyzeAdoptionRisk({
    repeatUsage,
    behavioralIntegration,
    featureAdoption,
    postLaunchActivityObserved,
    trafficOnly: input.trafficOnlyFixture,
    signupsOnly: input.signupsOnlyFixture,
    oneTimeUsage: input.oneTimeUsageFixture,
  });

  const overallAdoptionScore = Math.round(
    repeatUsage.repeatUsageScore * 0.3 +
      behavioralIntegration.behavioralIntegrationScore * 0.25 +
      featureAdoption.featureAdoptionScore * 0.2 +
      userDependency.dependencyScore * 0.15 +
      (100 - adoptionRisk.adoptionRiskScore) * 0.1,
  );

  const verdict = computeAdoptionVerdict({
    repeatUsage,
    behavioralIntegration,
    featureAdoption,
    userDependency,
    adoptionRisk,
    overallAdoptionScore,
    postLaunchActivityObserved,
    rejectFabricated,
    trafficOnly: input.trafficOnlyFixture,
    signupsOnly: input.signupsOnlyFixture,
    oneTimeUsage: input.oneTimeUsageFixture,
  });

  const inputSnapshot = {
    readOnly: true as const,
    postLaunchReality,
    founderLaunchDecision,
    adoptionEvidence,
    postLaunchActivityObserved,
  };

  const report: AdoptionRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    adoptionRealityState: verdict.adoptionRealityState,
    overallAdoptionScore: verdict.overallAdoptionScore,
    confidence: verdict.confidence,
    repeatUsageObserved: verdict.repeatUsageObserved,
    behavioralIntegrationObserved: verdict.behavioralIntegrationObserved,
    featureAdoptionObserved: verdict.featureAdoptionObserved,
    dependencyObserved: verdict.dependencyObserved,
    repeatUsageScore: repeatUsage.repeatUsageScore,
    behavioralIntegrationScore: behavioralIntegration.behavioralIntegrationScore,
    featureAdoptionScore: featureAdoption.featureAdoptionScore,
    dependencyScore: userDependency.dependencyScore,
    adoptionRiskScore: adoptionRisk.adoptionRiskScore,
    repeatUsage,
    behavioralIntegration,
    featureAdoption,
    userDependency,
    adoptionRisk,
    riskSignals: verdict.riskSignals,
    missingEvidence: verdict.missingEvidence,
    keyFindings: verdict.keyFindings,
    recommendedActions: verdict.recommendedActions,
    finalVerdict: verdict.finalVerdict,
    verdict,
    inputSnapshot,
    cacheKey: stableCacheKey(assessmentId, verdict.adoptionRealityState, verdict.overallAdoptionScore),
  };

  const assessment: AdoptionRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'ADOPTION_REALITY_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordAdoptionRealityAssessment(assessment);
  }

  return assessment;
}

export function buildAdoptionRealityArtifacts(input: AssessAdoptionRealityInput = {}): AdoptionRealityArtifacts {
  const assessment = assessAdoptionReality(input);
  return {
    adoptionRealityAssessment: assessment,
    adoptionRealityReportMarkdown: buildAdoptionRealityReportMarkdown(assessment.report),
  };
}
