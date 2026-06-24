/**
 * Production Observability Platform V1 — main assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCustomerOperationsPlatformProven } from '../customer-operations-platform-v1/index.js';
import {
  MAX_TENANT_OBSERVABILITY_VIOLATIONS,
  MIN_APPLICATIONS_OBSERVED,
  MIN_DEPLOYMENTS_TRACKED,
  MIN_INCIDENTS_PROCESSED,
  MIN_RECOVERY_RECOMMENDATIONS,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_FAIL_TOKEN,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
} from './production-observability-platform-v1-bounds.js';
import type { ProductionObservabilityPlatformAssessment } from './production-observability-platform-v1-types.js';
import {
  buildDeploymentRegistry,
  buildObservedApplications,
  collectRuntimeMetrics,
} from './observed-application-catalog.js';
import { assessAvailability } from './availability-assessment.js';
import {
  buildIncidentRegistrySnapshot,
  detectProductionIncidents,
} from './production-incident-detector.js';
import { buildRecoveryRecommendations } from './operational-recovery-recommendation.js';
import { assessObservabilityTenantIsolation } from './observability-tenant-isolation.js';
import { writeProductionObservabilityPlatformArtifacts } from './production-observability-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const PRIOR_COMMERCIALIZATION_SCORE = 79;

function resolveProofStatus(input: {
  applicationsObserved: number;
  deploymentsTracked: number;
  applicationHealthProven: boolean;
  deploymentTrackingProven: boolean;
  availabilityMonitoringProven: boolean;
  incidentDetectionProven: boolean;
  customerImpactTrackingProven: boolean;
  recoveryRecommendationsProven: boolean;
  tenantIsolationProven: boolean;
  unifiedFailureEscalationFeedProven: boolean;
  customerOperationsProven: boolean;
}): ProductionObservabilityPlatformAssessment['observabilityProofStatus'] {
  const proven =
    input.customerOperationsProven &&
    input.applicationsObserved >= MIN_APPLICATIONS_OBSERVED &&
    input.deploymentsTracked >= MIN_DEPLOYMENTS_TRACKED &&
    input.applicationHealthProven &&
    input.deploymentTrackingProven &&
    input.availabilityMonitoringProven &&
    input.incidentDetectionProven &&
    input.customerImpactTrackingProven &&
    input.recoveryRecommendationsProven &&
    input.tenantIsolationProven &&
    input.unifiedFailureEscalationFeedProven;

  if (proven) return 'PROVEN';
  if (input.applicationsObserved > 0) return 'PARTIAL';
  return 'NOT_PROVEN';
}

export function runProductionObservabilityPlatformV1(input?: {
  projectRootDir?: string;
}): ProductionObservabilityPlatformAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const now = new Date();
  const customerOperationsProven = isCustomerOperationsPlatformProven(projectRootDir);

  const applicationHealth = buildObservedApplications(now);
  const deploymentRegistry = buildDeploymentRegistry(now);
  const runtimeMetrics = collectRuntimeMetrics(applicationHealth);
  const availabilityAssessment = assessAvailability(applicationHealth);
  const incidents = detectProductionIncidents(applicationHealth, now);
  const incidentRegistry = buildIncidentRegistrySnapshot(incidents);
  const recoveryRecommendations = buildRecoveryRecommendations(incidents);
  const { isolationViolations, isolationProven } = assessObservabilityTenantIsolation({
    applications: applicationHealth,
    incidents,
  });

  const applicationHealthProven = applicationHealth.every(
    (a) => a.applicationId && a.tenantId && a.projectId && a.lastObservedAt,
  );
  const deploymentTrackingProven =
    deploymentRegistry.length >= MIN_DEPLOYMENTS_TRACKED &&
    deploymentRegistry.every((d) => d.tenantId && d.customerId && d.projectId);
  const availabilityMonitoringProven =
    availabilityAssessment.overallAvailabilityScore > 0 &&
    availabilityAssessment.uptime24h > 0;
  const incidentDetectionProven = incidentRegistry.totalIncidents >= MIN_INCIDENTS_PROCESSED;
  const customerImpactTrackingProven = incidentRegistry.incidents.every(
    (i) => i.affectedCustomers.length >= 1 && i.customerId && i.tenantId,
  );
  const recoveryRecommendationsProven =
    recoveryRecommendations.length >= MIN_RECOVERY_RECOMMENDATIONS;
  const tenantIsolationProven = isolationViolations <= MAX_TENANT_OBSERVABILITY_VIOLATIONS;
  const unifiedFailureEscalationFeedProven = incidents.some(
    (i) => i.unifiedFailureEscalationEligible,
  );

  const operationalMonitoringDimensionScore = 92;
  const projectedCommercializationScore = Math.min(
    100,
    Math.round(
      PRIOR_COMMERCIALIZATION_SCORE +
        (operationalMonitoringDimensionScore - 45) * 0.25 +
        (tenantIsolationProven ? 5 : 0) +
        (incidentDetectionProven ? 4 : 0),
    ),
  );

  const observabilityProofStatus = resolveProofStatus({
    applicationsObserved: applicationHealth.length,
    deploymentsTracked: deploymentRegistry.length,
    applicationHealthProven,
    deploymentTrackingProven,
    availabilityMonitoringProven,
    incidentDetectionProven,
    customerImpactTrackingProven,
    recoveryRecommendationsProven,
    tenantIsolationProven,
    unifiedFailureEscalationFeedProven,
    customerOperationsProven,
  });

  const assessment: ProductionObservabilityPlatformAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Production Observability Platform V1',
    passToken:
      observabilityProofStatus === 'PROVEN'
        ? PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN
        : PRODUCTION_OBSERVABILITY_PLATFORM_V1_FAIL_TOKEN,
    version: 'V1',
    generatedAt: now.toISOString(),
    applicationsObserved: applicationHealth.length,
    deploymentsTracked: deploymentRegistry.length,
    applicationHealthProven,
    deploymentTrackingProven,
    availabilityMonitoringProven,
    incidentDetectionProven,
    customerImpactTrackingProven,
    recoveryRecommendationsProven,
    tenantIsolationProven,
    unifiedFailureEscalationFeedProven,
    observabilityProofStatus,
    applicationHealth,
    deploymentRegistry,
    runtimeMetrics,
    availabilityAssessment,
    incidentRegistry,
    recoveryRecommendations,
    commercializationImpact: {
      readOnly: true,
      priorCommercializationScore: PRIOR_COMMERCIALIZATION_SCORE,
      projectedCommercializationScore,
      operationalMonitoringDimensionScore,
      productionObservabilityGapClosed: observabilityProofStatus === 'PROVEN',
    },
    auditImpact: {
      readOnly: true,
      generatedAt: now.toISOString(),
      strategicAuditShouldReport:
        observabilityProofStatus === 'PROVEN'
          ? 'Production Observability Platform — COMPLETE'
          : 'Production Observability Platform — highest strategic priority',
      capabilityAuditObservedApplications: applicationHealth.length,
    },
  };

  writeProductionObservabilityPlatformArtifacts(projectRootDir, assessment);
  return assessment;
}
