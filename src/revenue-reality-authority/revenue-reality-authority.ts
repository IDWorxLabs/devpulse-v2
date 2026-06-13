/**
 * Revenue Reality Authority — read-only revenue evidence orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessAdoptionReality } from '../adoption-reality-authority/index.js';
import { analyzeBusinessRisk } from './business-risk-analyzer.js';
import { analyzeConversion } from './conversion-analyzer.js';
import { analyzeCustomerValue } from './customer-value-analyzer.js';
import { analyzeRevenueEvidence } from './revenue-evidence-analyzer.js';
import { analyzeRevenueStability } from './revenue-stability-analyzer.js';
import { recordRevenueRealityAssessment } from './revenue-reality-history.js';
import { buildRevenueRealityReportMarkdown } from './revenue-reality-report-builder.js';
import {
  REVENUE_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  REVENUE_REALITY_AUTHORITY_PASS_TOKEN,
} from './revenue-reality-registry.js';
import { computeRevenueVerdict } from './revenue-verdict-engine.js';
import type {
  AssessRevenueRealityInput,
  RevenueEvidenceBundle,
  RevenueRealityArtifacts,
  RevenueRealityAssessment,
  RevenueRealityReport,
} from './revenue-reality-types.js';

let assessmentCounter = 0;

export function resetRevenueRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetRevenueRealityAuthorityModuleForTests(): void {
  resetRevenueRealityCounterForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `revenue-reality-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: string, score: number): string {
  const digest = createHash('sha256')
    .update([REVENUE_REALITY_AUTHORITY_PASS_TOKEN, assessmentId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${REVENUE_REALITY_AUTHORITY_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveInput<T>(input: AssessRevenueRealityInput, key: keyof AssessRevenueRealityInput, factory: () => T): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

function buildEvidenceBundle(input: AssessRevenueRealityInput): RevenueEvidenceBundle {
  const fixture = input.revenueEvidenceFixture;
  const base = input.revenueEvidence ?? {
    readOnly: true as const,
    revenue: null,
    customerValue: null,
    conversion: null,
    revenueStability: null,
  };

  if (!fixture) return base;

  return {
    readOnly: true,
    revenue: fixture.revenue !== undefined ? fixture.revenue ?? null : base.revenue,
    customerValue: fixture.customerValue !== undefined ? fixture.customerValue ?? null : base.customerValue,
    conversion: fixture.conversion !== undefined ? fixture.conversion ?? null : base.conversion,
    revenueStability: fixture.revenueStability !== undefined ? fixture.revenueStability ?? null : base.revenueStability,
  };
}

export function assessRevenueReality(input: AssessRevenueRealityInput = {}): RevenueRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const rejectFabricated = Boolean(input.fabricatedMetricsFixture);
  const fixtureFlags = {
    usersOnly: input.usersOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
    rejectFabricated,
  };

  const adoptionReality = resolveInput(input, 'adoptionReality', () =>
    assessAdoptionReality({
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
      skipHistoryRecording: true,
    }).report,
  );

  const postLaunchReality = resolveInput(input, 'postLaunchReality', () =>
    adoptionReality?.inputSnapshot.postLaunchReality ?? null,
  );

  const founderLaunchDecision = resolveInput(input, 'founderLaunchDecision', () =>
    adoptionReality?.inputSnapshot.founderLaunchDecision ?? null,
  );

  const revenueEvidence = buildEvidenceBundle(input);
  const adoptionObserved = Boolean(
    adoptionReality?.repeatUsageObserved && adoptionReality.adoptionRealityState !== 'NO_ADOPTION',
  );

  const revenue = analyzeRevenueEvidence({
    evidence: revenueEvidence.revenue,
    adoptionObserved,
    ...fixtureFlags,
  });

  const customerValue = analyzeCustomerValue({
    evidence: revenueEvidence.customerValue,
    revenueObserved: revenue.revenueObserved,
    ...fixtureFlags,
  });

  const conversion = analyzeConversion({
    evidence: revenueEvidence.conversion,
    revenueObserved: revenue.revenueObserved,
    payingCustomersObserved: customerValue.payingCustomers,
    ...fixtureFlags,
  });

  const revenueStability = analyzeRevenueStability({
    evidence: revenueEvidence.revenueStability,
    revenueObserved: revenue.revenueObserved,
    recurringRevenueObserved: revenue.recurringRevenue,
    ...fixtureFlags,
  });

  const businessRisk = analyzeBusinessRisk({
    revenue,
    customerValue,
    conversion,
    revenueStability,
    adoptionObserved,
    usersOnly: input.usersOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
  });

  const overallRevenueScore = Math.round(
    revenue.revenueScore * 0.3 +
      customerValue.customerValueScore * 0.25 +
      conversion.conversionScore * 0.15 +
      revenueStability.revenueStabilityScore * 0.15 +
      (100 - businessRisk.businessRiskScore) * 0.15,
  );

  const verdict = computeRevenueVerdict({
    revenue,
    customerValue,
    conversion,
    revenueStability,
    businessRisk,
    overallRevenueScore,
    adoptionObserved,
    rejectFabricated,
    usersOnly: input.usersOnlyFixture,
    adoptionOnly: input.adoptionOnlyFixture,
  });

  const inputSnapshot = {
    readOnly: true as const,
    adoptionReality,
    postLaunchReality,
    founderLaunchDecision,
    revenueEvidence,
    adoptionObserved,
  };

  const report: RevenueRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    revenueRealityState: verdict.revenueRealityState,
    overallRevenueScore: verdict.overallRevenueScore,
    confidence: verdict.confidence,
    revenueObserved: verdict.revenueObserved,
    payingCustomersObserved: verdict.payingCustomersObserved,
    repeatRevenueObserved: verdict.repeatRevenueObserved,
    revenueScore: revenue.revenueScore,
    customerValueScore: customerValue.customerValueScore,
    conversionScore: conversion.conversionScore,
    revenueStabilityScore: revenueStability.revenueStabilityScore,
    businessRiskScore: businessRisk.businessRiskScore,
    revenue,
    customerValue,
    conversion,
    revenueStability,
    businessRisk,
    riskSignals: verdict.riskSignals,
    missingEvidence: verdict.missingEvidence,
    keyFindings: verdict.keyFindings,
    recommendedActions: verdict.recommendedActions,
    finalVerdict: verdict.finalVerdict,
    verdict,
    inputSnapshot,
    cacheKey: stableCacheKey(assessmentId, verdict.revenueRealityState, verdict.overallRevenueScore),
  };

  const assessment: RevenueRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'REVENUE_REALITY_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordRevenueRealityAssessment(assessment);
  }

  return assessment;
}

export function buildRevenueRealityArtifacts(input: AssessRevenueRealityInput = {}): RevenueRealityArtifacts {
  const assessment = assessRevenueReality(input);
  return {
    revenueRealityAssessment: assessment,
    revenueRealityReportMarkdown: buildRevenueRealityReportMarkdown(assessment.report),
  };
}
