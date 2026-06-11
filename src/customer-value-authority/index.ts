/**
 * Customer Value Authority — public API.
 */

export {
  CUSTOMER_VALUE_AUTHORITY_PASS_TOKEN,
  CUSTOMER_VALUE_OWNER_MODULE,
  MAX_CUSTOMER_VALUE_CATEGORIES,
  MAX_CUSTOMER_VALUE_SCENARIOS,
  MAX_CUSTOMER_VALUE_FINDINGS,
  MAX_CUSTOMER_VALUE_SIGNALS,
  MAX_CUSTOMER_VALUE_RISKS,
  MAX_CUSTOMER_VALUE_RECOMMENDATIONS,
  MAX_CUSTOMER_VALUE_HISTORY,
  CUSTOMER_VALUE_CACHE_KEY_PREFIX,
  CUSTOMER_VALUE_REPORT_TITLE,
  CUSTOMER_VALUE_BLOCK_SCORE,
  CUSTOMER_VALUE_PASS_THRESHOLD,
  CUSTOMER_VALUE_CRITICAL_SCORE,
} from './customer-value-bounds.js';

export type {
  CustomerValueScenarioCategory,
  CustomerValueReadinessState,
  CustomerValueScenarioDefinition,
  CustomerValueScenarioResult,
  CustomerValueAssessment,
} from './customer-value-types.js';

export { CUSTOMER_VALUE_SCENARIOS } from './customer-value-scenarios.js';

export {
  resetCustomerValueHistoryForTests,
  recordCustomerValueAssessment,
  getCustomerValueHistorySize,
  getLatestCustomerValueAssessment,
} from './customer-value-history.js';

export { buildCustomerValueReportMarkdown } from './customer-value-report-builder.js';

export {
  validateCustomerValueCategoryCount,
  validateCustomerValueEvaluation,
  validateRetentionScoring,
  validateValueRiskDetection,
  validateCriticalValueFailureDetection,
  validateCustomerValueLaunchBlocking,
  validateCustomerValueDeterministicScoring,
  validateCustomerValueRecommendationGeneration,
  validateCustomerValueScenarioClassification,
  validateCustomerValueAdvisoryOnly,
} from './customer-value-validator.js';

export { assessCustomerValueAuthority, buildCustomerValueAuthorityArtifacts } from './customer-value-authority.js';
