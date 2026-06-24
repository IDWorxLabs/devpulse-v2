/**
 * Customer Operations Platform V1 — public API.
 */

export {
  CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN,
  CUSTOMER_OPERATIONS_PLATFORM_V1_FAIL_TOKEN,
  CUSTOMER_OPERATIONS_PLATFORM_V1_ARTIFACT_DIR,
  CUSTOMER_OPERATIONS_PLATFORM_V1_REPORT_TITLE,
  PLAN_TYPES,
  MIN_CUSTOMERS_PROVEN,
  MIN_TENANTS_PROVEN,
  MIN_PROJECTS_REGISTERED,
  PRIOR_PASS_TOKENS,
} from './customer-operations-platform-v1-bounds.js';

export type {
  CustomerAccount,
  CustomerOperationsPlatformAssessment,
  TenantRecord,
  CustomerProjectRecord,
  OnboardingMetrics,
  CustomerUsageMetrics,
  PlanDefinition,
  TenantIsolationAssessment,
  SupportIncident,
} from './customer-operations-platform-v1-types.js';

export { runCustomerOperationsPlatformV1 } from './customer-operations-platform-assessor.js';
export { writeCustomerOperationsPlatformArtifacts } from './customer-operations-artifact-writer.js';
export {
  isCustomerOperationsPlatformProven,
  loadCustomerOperationsPlatformAssessmentFromDisk,
  loadCommercializationImpactFromDisk,
} from './customer-operations-evidence-loader.js';
export { buildCustomerOperationsPlatformV1ReportMarkdown } from './customer-operations-report-builder.js';
