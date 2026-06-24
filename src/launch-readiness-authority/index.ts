/**
 * Launch Readiness Authority — public API.
 */

export {
  LAUNCH_READINESS_AUTHORITY_PASS_TOKEN,
  LAUNCH_READINESS_OWNER_MODULE,
  MAX_LAUNCH_READINESS_HISTORY,
  LAUNCH_READINESS_CACHE_KEY_PREFIX,
  LAUNCH_READINESS_REPORT_TITLE,
  CONFIDENCE_PUBLIC_LAUNCH,
  CONFIDENCE_PUBLIC_BETA,
  CONFIDENCE_PRIVATE_BETA,
  CONFIDENCE_INTERNAL_USE,
  AUTHORITY_WEIGHTS,
  WEIGHTED_AUTHORITY_IDS,
  assertAuthorityWeightIntegrity,
} from './launch-readiness-thresholds.js';

export type {
  LaunchReadinessRecommendation,
  LaunchReadinessState,
  LaunchReadinessDecision,
  LaunchReadinessEvidenceBreakdown,
  LaunchReadinessAuthorityAssessment,
} from './launch-readiness-types.js';

export {
  resetLaunchReadinessHistoryForTests,
  recordLaunchReadinessAssessment,
  getLaunchReadinessHistorySize,
  getLatestLaunchReadinessAssessment,
} from './launch-readiness-history.js';

export { buildLaunchReadinessReportMarkdown } from './launch-readiness-report-builder.js';

export {
  validateAuthorityWeighting,
  validateRecommendationGeneration,
  validateConfidenceScoring,
  validateBlockerDetection,
  validateLaunchReadinessLaunchBlocking,
  validateLaunchReadinessDeterministicScoring,
  validateLaunchReadinessRecommendationGeneration,
  validateLaunchReadinessAdvisoryOnly,
  validateConfidenceThresholds,
  validateEvidenceBreakdown,
} from './launch-readiness-validator.js';

export {
  assessLaunchReadinessAuthority,
  buildLaunchReadinessAuthorityArtifacts,
} from './launch-readiness-authority.js';

export {
  LAUNCH_READINESS_AUTHORITATIVE_OWNER,
  LAUNCH_READINESS_CONSOLIDATION_STATUS,
  resolveAuthoritativeLaunchReadiness,
  deriveLaunchDecisionFromAfla,
  applyAflaLaunchDelegation,
} from './launch-readiness-consolidation-bridge.js';
export type { LaunchReadinessConsolidationSnapshot } from './launch-readiness-consolidation-bridge.js';
