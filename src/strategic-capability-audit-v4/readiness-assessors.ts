/**
 * Strategic Capability Audit V4 — factory, autonomy, commercialization readiness.
 */

import {
  AUTONOMY_READINESS_THRESHOLD,
  COMMERCIALIZATION_READINESS_THRESHOLD,
  FACTORY_READINESS_THRESHOLD,
} from './strategic-capability-audit-v4-bounds.js';
import type {
  AutonomyReadinessAssessment,
  CommercializationReadinessAssessment,
  FactoryReadinessAssessment,
  FactoryReadinessDimension,
} from './strategic-capability-audit-v4-types.js';
import type { StrategicEvidenceSnapshot } from './strategic-evidence-collector.js';
import type { StrategicCapabilityQuestion } from './strategic-capability-audit-v4-types.js';

function avg(scores: number[]): number {
  return scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function dim(
  dimension: string,
  score: number,
  evidence: string,
): FactoryReadinessDimension {
  return {
    dimension,
    score,
    status: score >= 90 ? 'PROVEN' : score >= 60 ? 'PARTIAL' : 'MISSING',
    evidence,
  };
}

export function assessFactoryReadiness(
  evidence: StrategicEvidenceSnapshot,
  questions: readonly StrategicCapabilityQuestion[],
): FactoryReadinessAssessment {
  const suite = evidence.uvl.suiteCoverage;
  const required = suite.categoriesRequired;

  const dimensions: FactoryReadinessDimension[] = [
    dim(
      'Requirements → Planning',
      85,
      'CQI Maturity V1 and planning gate authority validated.',
    ),
    dim(
      'Planning → Generation → Build',
      suite.buildCoverage >= required ? 100 : 75,
      `Build coverage ${suite.buildCoverage}/${required}.`,
    ),
    dim(
      'Build → Preview → Verification',
      evidence.uvl.uvlVerificationExecutionComplete ? 100 : 70,
      `Verification ${suite.verificationCoverage}/${required}.`,
    ),
    dim(
      'Verification → Launch',
      suite.aflaReviewCoverage >= required ? 95 : 70,
      `AFLA ${suite.aflaReviewCoverage}/${required}.`,
    ),
    dim(
      'Multi-Project Orchestration',
      evidence.multiProjectProven ? 100 : 55,
      evidence.multiProjectProven ? 'MPCE V1 PASS' : 'Planning-only without concurrent proof.',
    ),
    dim(
      'Isolated Execution (World2)',
      evidence.world2Proven ? 95 : 40,
      evidence.world2Proven ? 'World2 Real Instantiation V1 PASS' : 'Dry-run only.',
    ),
    dim(
      'Failure Recovery',
      evidence.failureEscalationProven ? 90 : 45,
      evidence.failureEscalationProven ? 'UFEA V1 PASS' : 'Fragmented escalation.',
    ),
    dim(
      'Evidence Governance',
      evidence.evidenceFreshnessProven ? 92 : 40,
      evidence.evidenceFreshnessProven ? 'OEFA V1 PASS' : 'No freshness authority.',
    ),
  ];

  const overallScore = avg(dimensions.map((d) => d.score));

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    overallScore,
    softwareFactoryReady: overallScore >= FACTORY_READINESS_THRESHOLD,
    dimensions,
  };
}

export function assessAutonomyReadiness(
  evidence: StrategicEvidenceSnapshot,
): AutonomyReadinessAssessment {
  const dimensions: FactoryReadinessDimension[] = [
    dim(
      'Self-Modification Execution',
      evidence.selfEvolutionProven ? 85 : 35,
      evidence.selfEvolutionProven ? 'Self-Evolution Execution V1 PASS' : 'Advisory only.',
    ),
    dim(
      'Failure Escalation Authority',
      evidence.failureEscalationProven ? 90 : 40,
      evidence.failureEscalationProven ? 'UFEA V1 PASS — single escalation owner' : 'No unified authority.',
    ),
    dim(
      'Evidence Freshness Loop',
      evidence.evidenceFreshnessProven ? 88 : 35,
      evidence.evidenceFreshnessProven ? 'OEFA V1 PASS — proof lifespan governed' : 'Stale proof risk.',
    ),
    dim(
      'Canonical Ownership',
      evidence.canonicalOwnershipProven ? 95 : 45,
      evidence.canonicalOwnershipProven
        ? `${evidence.ownership?.registeredCount ?? 0} capabilities registered, 0 critical orphans`
        : 'Ownership gaps.',
    ),
    dim(
      'Validation Runtime Governance',
      85,
      'Validation Runtime Governance V1 — tiered validation and reuse.',
    ),
    dim(
      'Continuous Revalidation',
      evidence.freshness && evidence.freshness.expiredCount === 0 ? 80 : 55,
      `${evidence.freshness?.expiredCount ?? '?'} expired evidence records.`,
    ),
  ];

  const overallScore = avg(dimensions.map((d) => d.score));

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    overallScore,
    continuousOperationReady: overallScore >= AUTONOMY_READINESS_THRESHOLD,
    canEvolveAutonomously: evidence.selfEvolutionProven && evidence.failureEscalationProven,
    dimensions,
  };
}

export function assessCommercializationReadiness(
  evidence: StrategicEvidenceSnapshot,
): CommercializationReadinessAssessment {
  const dimensions: FactoryReadinessDimension[] = [
    dim(
      'Production Readiness Gate',
      evidence.productionReadiness.proven ? 90 : 35,
      evidence.productionReadiness.proven ? 'Production Readiness Gate V1 PASS' : 'Launch-only validation.',
    ),
    dim(
      'Cloud Execution Path',
      evidence.cloudExecution.proven ? 85 : 40,
      evidence.cloudExecution.proven ? 'Cloud Execution Path V1 PASS' : 'No validated cloud deployment.',
    ),
    dim(
      'Mobile Product Surface',
      evidence.mobileProven ? 88 : 45,
      evidence.mobileProven ? 'Mobile Runtime Validation at Scale V1 PASS' : 'Mobile preview only.',
    ),
    dim(
      'Operational Monitoring',
      evidence.productionObservabilityProven
        ? 92
        : evidence.customerOperationsProven
          ? 45
          : 30,
      evidence.productionObservabilityProven
        ? 'Production Observability Platform V1 PASS — application health, availability, incidents, and recovery recommendations for deployed customer applications.'
        : evidence.customerOperationsProven
          ? 'Customer Operations Platform V1 PASS — support registry and usage visibility; dedicated observability stack still needed.'
          : 'No proven observability stack for deployed customer applications.',
    ),
    dim(
      'Customer Onboarding & Billing',
      evidence.customerOperationsProven ? 88 : 20,
      evidence.customerOperationsProven
        ? 'Customer Operations Platform V1 PASS — onboarding, tenant isolation, project ownership, usage tracking, and plan quotas proven.'
        : 'No validated customer-facing onboarding, billing, or tenant management.',
    ),
    dim(
      'Continuous Deployment Pipeline',
      evidence.continuousDeploymentProven
        ? 92
        : evidence.productionObservabilityProven && evidence.cloudExecution.proven
          ? 72
          : evidence.cloudExecution.proven
            ? 65
            : 35,
      evidence.continuousDeploymentProven
        ? 'Continuous Deployment Pipeline V1 PASS — governed promotion from candidate through staging to production with observability validation and rollback recommendations.'
        : evidence.productionObservabilityProven
          ? 'Production Observability V1 PASS — deployment health tracked; live CD pipeline for customer apps still unvalidated.'
          : 'Cloud path proven locally; live CD pipeline for customer apps unvalidated.',
    ),
    dim(
      'Code Generation Diversity',
      evidence.generalPurposeCodegen.proven ? 92 : 45,
      evidence.generalPurposeCodegen.proven
        ? 'General-Purpose Code Generation V1 PASS — 10/10 non-trivial domains proven; aligned with Capability Audit V3.1 MATURE status.'
        : 'Limited CRUD profile diversity vs 58-category vision.',
    ),
    dim(
      'Large-Scale Pipeline Integration',
      evidence.pipelineIntegration.integrationComplete ? 92 : 50,
      evidence.pipelineIntegration.integrationComplete
        ? 'Large-Scale Pipeline Integration V1 PASS'
        : 'Harness disconnected from authoritative proof.',
    ),
  ];

  const overallScore = avg(dimensions.map((d) => d.score));

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    overallScore,
    deploymentReady: evidence.productionReadiness.proven && evidence.cloudExecution.proven,
    commercializationReady: overallScore >= COMMERCIALIZATION_READINESS_THRESHOLD,
    dimensions,
  };
}
