/**
 * Self-Awareness Authority — public API.
 */

export {
  SELF_AWARENESS_AUTHORITY_PASS_TOKEN,
  SELF_AWARENESS_OWNER_MODULE,
  MAX_SELF_AWARENESS_SCENARIOS,
  MAX_SELF_AWARENESS_LIMITATIONS,
  MAX_SELF_AWARENESS_RECOMMENDATIONS,
  MAX_SELF_AWARENESS_FINDINGS,
  MAX_SELF_AWARENESS_HISTORY,
  SELF_AWARENESS_CACHE_KEY_PREFIX,
  SELF_AWARENESS_REPORT_TITLE,
  SELF_AWARENESS_BLOCK_SCORE,
  SELF_AWARENESS_RISK_BLOCK_THRESHOLD,
} from './self-awareness-bounds.js';

export type {
  SelfAwarenessScenarioCategory,
  SelfAwarenessReadinessState,
  SelfAwarenessScenarioDefinition,
  SelfAwarenessScenarioResult,
  SelfAwarenessAssessment,
} from './self-awareness-types.js';

export { SELF_AWARENESS_SCENARIOS } from './self-awareness-scenarios.js';

export {
  resetSelfAwarenessHistoryForTests,
  recordSelfAwarenessAssessment,
  getSelfAwarenessHistorySize,
  getLatestSelfAwarenessAssessment,
} from './self-awareness-history.js';

export { buildSelfAwarenessReportMarkdown } from './self-awareness-report-builder.js';

export {
  validateSelfAwarenessScenarioCount,
  validateSelfAwarenessDeterministicScoring,
  validateSelfAwarenessLaunchBlocking,
  validateSelfAwarenessRiskCalculation,
  validateCriticalAwarenessFailureDetection,
  validateLimitationDetection,
} from './self-awareness-validator.js';

export { assessSelfAwarenessAuthority, buildSelfAwarenessAuthorityArtifacts } from './self-awareness-authority.js';
