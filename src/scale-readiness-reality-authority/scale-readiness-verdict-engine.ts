/**
 * Scale readiness verdict engine — evidence-only scale readiness state derivation.
 */

import { dimensionReady } from './evidence-validation.js';
import {
  FRAGILE_THRESHOLD,
  MIN_READY_DIMENSIONS_FOR_SCALE_READY,
  PARTIALLY_READY_THRESHOLD,
  SCALE_READINESS_REALITY_CORE_QUESTION,
  SCALE_READY_THRESHOLD,
  SCALE_RESILIENT_THRESHOLD,
} from './scale-readiness-registry.js';
import type {
  ArchitectureScalabilityAnalysis,
  CustomerSupportScalabilityAnalysis,
  FinancialScalabilityAnalysis,
  OperationalScalabilityAnalysis,
  ReliabilityScalabilityAnalysis,
  ScaleReadinessState,
  ScaleReadinessVerdict,
  ScaleRiskAnalysis,
  TeamScalabilityAnalysis,
} from './scale-readiness-types.js';

export function computeScaleReadinessVerdict(input: {
  architecture: ArchitectureScalabilityAnalysis;
  operational: OperationalScalabilityAnalysis;
  team: TeamScalabilityAnalysis;
  financial: FinancialScalabilityAnalysis;
  customerSupport: CustomerSupportScalabilityAnalysis;
  reliability: ReliabilityScalabilityAnalysis;
  scaleRisk: ScaleRiskAnalysis;
  overallScaleReadinessScore: number;
  productLaunched: boolean;
  rejectFabricated?: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
}): ScaleReadinessVerdict {
  const missingEvidence = [
    ...input.architecture.missingEvidence,
    ...input.operational.missingEvidence,
    ...input.team.missingEvidence,
    ...input.financial.missingEvidence,
    ...input.customerSupport.missingEvidence,
    ...input.reliability.missingEvidence,
  ].slice(0, 12);

  const riskSignals = [
    ...input.architecture.riskSignals,
    ...input.operational.riskSignals,
    ...input.team.riskSignals,
    ...input.financial.riskSignals,
    ...input.customerSupport.riskSignals,
    ...input.reliability.riskSignals,
    ...input.scaleRisk.riskSignals,
  ];

  const architectureReady = dimensionReady(input.architecture.architectureScalabilityScore);
  const operationsReady = dimensionReady(input.operational.operationalScalabilityScore);
  const teamReady = dimensionReady(input.team.teamScalabilityScore);
  const financiallyReady = dimensionReady(input.financial.financialScalabilityScore);
  const supportReady = dimensionReady(input.customerSupport.supportScalabilityScore);
  const reliabilityReady = dimensionReady(input.reliability.reliabilityScalabilityScore);

  const readyCount = [
    architectureReady,
    operationsReady,
    teamReady,
    financiallyReady,
    supportReady,
    reliabilityReady,
  ].filter(Boolean).length;

  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];
  let scaleReadinessState: ScaleReadinessState = 'NOT_READY';

  const blockedByUpstreamOnly =
    input.revenueOnly || input.adoptionOnly || input.infrastructureOnly || input.rejectFabricated;

  if (input.rejectFabricated) {
    scaleReadinessState = 'NOT_READY';
    keyFindings.unshift('Fabricated scalability evidence rejected — evidence-only verdict enforced');
    recommendedActions.push('Provide verifiable architecture, operational, and reliability scale evidence');
  } else if (input.revenueOnly || input.adoptionOnly) {
    scaleReadinessState = 'NOT_READY';
    keyFindings.push(
      input.revenueOnly
        ? 'Revenue alone cannot create scale readiness'
        : 'Adoption alone cannot create scale readiness',
    );
    recommendedActions.push('Collect multi-dimensional scale readiness evidence beyond revenue or adoption');
  } else if (input.infrastructureOnly) {
    scaleReadinessState =
      input.overallScaleReadinessScore >= PARTIALLY_READY_THRESHOLD ? 'PARTIALLY_READY' : 'FRAGILE';
    keyFindings.push('Infrastructure alone cannot create SCALE_READY — other dimensions required');
    recommendedActions.push('Prove operational, team, financial, support, and reliability scalability');
    if (scaleReadinessState === 'PARTIALLY_READY' && readyCount >= SCALE_READY_THRESHOLD / 20) {
      scaleReadinessState = 'PARTIALLY_READY';
    }
  } else if (!input.productLaunched) {
    scaleReadinessState = 'NOT_READY';
    keyFindings.push('Product not launched — scale readiness cannot be assessed from pre-launch state');
    recommendedActions.push('Launch product and collect post-launch scale survivability evidence');
  } else if (readyCount === 0) {
    scaleReadinessState = 'NOT_READY';
    keyFindings.push('No scale readiness dimensions proven from observed evidence');
    recommendedActions.push('Collect architecture, operational, reliability, and support scale reports');
    missingEvidence.push('Multi-dimensional scale readiness evidence');
  } else if (
    input.overallScaleReadinessScore >= SCALE_RESILIENT_THRESHOLD &&
    readyCount >= 5 &&
    input.scaleRisk.scaleRiskScore <= 25
  ) {
    scaleReadinessState = 'SCALE_RESILIENT';
    keyFindings.push('Scale resilient — multi-dimensional readiness with low scale risk');
    recommendedActions.push('Maintain scale evidence collection and monitor growth risk signals');
  } else if (
    input.overallScaleReadinessScore >= SCALE_READY_THRESHOLD &&
    readyCount >= MIN_READY_DIMENSIONS_FOR_SCALE_READY &&
    !blockedByUpstreamOnly
  ) {
    scaleReadinessState = 'SCALE_READY';
    keyFindings.push(`Scale ready — ${readyCount}/6 dimensions proven with observed evidence`);
    recommendedActions.push('Strengthen team and support scalability before aggressive growth');
  } else if (input.overallScaleReadinessScore >= PARTIALLY_READY_THRESHOLD && readyCount >= 2) {
    scaleReadinessState = 'PARTIALLY_READY';
    keyFindings.push(`Partially ready — ${readyCount}/6 scale dimensions proven`);
    recommendedActions.push('Close gaps in unproven scale dimensions before scaling');
  } else if (input.overallScaleReadinessScore >= FRAGILE_THRESHOLD || readyCount >= 1) {
    scaleReadinessState = 'FRAGILE';
    keyFindings.push('Fragile scale posture — limited evidence of growth survivability');
    recommendedActions.push('Address scale risk signals and collect missing dimension evidence');
  } else {
    scaleReadinessState = 'NOT_READY';
    keyFindings.push('Not ready to scale — insufficient evidence across all dimensions');
    recommendedActions.push('Build scale readiness evidence before pursuing growth');
  }

  if (input.infrastructureOnly && (scaleReadinessState === 'SCALE_READY' || scaleReadinessState === 'SCALE_RESILIENT')) {
    scaleReadinessState = 'PARTIALLY_READY';
    keyFindings.unshift('Infrastructure alone cannot produce SCALE_READY — capped at PARTIALLY_READY');
  }

  if ((input.revenueOnly || input.adoptionOnly) && scaleReadinessState !== 'NOT_READY') {
    scaleReadinessState = 'NOT_READY';
  }

  const confidenceBase = Math.round(
    input.overallScaleReadinessScore * 0.35 +
      readyCount * 10 +
      (100 - input.scaleRisk.scaleRiskScore) * 0.15,
  );
  const confidence = Math.min(100, Math.max(0, confidenceBase));

  const finalVerdict =
    `${SCALE_READINESS_REALITY_CORE_QUESTION} → ${scaleReadinessState}. ` +
    (readyCount >= MIN_READY_DIMENSIONS_FOR_SCALE_READY
      ? `${readyCount}/6 scale dimensions proven from observed evidence.`
      : 'Revenue, adoption, and infrastructure alone are insufficient for scale readiness.');

  return {
    readOnly: true,
    scaleReadinessState,
    overallScaleReadinessScore: input.overallScaleReadinessScore,
    confidence,
    architectureReady,
    operationsReady,
    teamReady,
    financiallyReady,
    supportReady,
    reliabilityReady,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    keyFindings: [...new Set(keyFindings)].slice(0, 8),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    finalVerdict,
  };
}
