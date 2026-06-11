/**
 * Trust Authority — public API.
 */

export {
  TRUST_AUTHORITY_PASS_TOKEN,
  TRUST_AUTHORITY_OWNER_MODULE,
  MAX_TRUST_SCENARIOS,
  MAX_TRUST_RISKS,
  MAX_TRUST_RECOMMENDATIONS,
  MAX_TRUST_FINDINGS,
  MAX_TRUST_HISTORY,
  TRUST_AUTHORITY_CACHE_KEY_PREFIX,
  TRUST_AUTHORITY_REPORT_TITLE,
  TRUST_LAUNCH_BLOCK_SCORE,
  TRUST_RISK_BLOCK_THRESHOLD,
} from './trust-authority-bounds.js';

export type {
  TrustScenarioCategory,
  TrustReadinessState,
  TrustScenarioDefinition,
  TrustScenarioResult,
  TrustAssessment,
} from './trust-authority-types.js';

export { TRUST_SCENARIOS } from './trust-scenarios.js';

export {
  resetTrustAuthorityHistoryForTests,
  recordTrustAuthorityAssessment,
  getTrustAuthorityHistorySize,
  getLatestTrustAuthorityAssessment,
} from './trust-history.js';

export { buildTrustAuthorityReportMarkdown } from './trust-report-builder.js';

export {
  validateTrustScenarioCount,
  validateTrustDeterministicScoring,
  validateTrustLaunchBlocking,
  validateTrustRiskCalculation,
  validateCriticalTrustFailureDetection,
} from './trust-validator.js';

export { assessTrustAuthority, buildTrustAuthorityArtifacts } from './trust-authority.js';
