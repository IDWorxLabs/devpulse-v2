/**
 * Production Observability Platform V1 — public API.
 */

export {
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_FAIL_TOKEN,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_ARTIFACT_DIR,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_REPORT_TITLE,
  MIN_APPLICATIONS_OBSERVED,
  MIN_DEPLOYMENTS_TRACKED,
  PRIOR_PASS_TOKENS,
} from './production-observability-platform-v1-bounds.js';

export type {
  ProductionApplicationHealth,
  ProductionObservabilityPlatformAssessment,
  ProductionIncident,
  DeploymentRecord,
  AvailabilityAssessment,
  OperationalRecoveryRecommendation,
} from './production-observability-platform-v1-types.js';

export { runProductionObservabilityPlatformV1 } from './production-observability-platform-assessor.js';
export { writeProductionObservabilityPlatformArtifacts } from './production-observability-artifact-writer.js';
export {
  isProductionObservabilityPlatformProven,
  loadProductionObservabilityPlatformAssessmentFromDisk,
  loadProductionObservabilitySummaryForAudit,
  loadCommercializationImpactFromObservability,
} from './production-observability-evidence-loader.js';
export { buildProductionObservabilityPlatformV1ReportMarkdown } from './production-observability-report-builder.js';
