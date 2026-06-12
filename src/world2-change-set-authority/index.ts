/**
 * World 2 Change Set Authority — public API.
 */

export {
  WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN,
  WORLD2_CHANGE_SET_AUTHORITY_OWNER_MODULE,
  WORLD2_CHANGE_SET_AUTHORITY_PHASE,
  WORLD2_CHANGE_SET_AUTHORITY_REPORT_TITLE,
  WORLD2_CHANGE_SET_CACHE_KEY_PREFIX,
  MAX_CHANGE_SET_HISTORY,
  MAX_CHANGE_SET_REASONS,
  MAX_OPERATIONS_PER_CHANGE_SET,
  MAX_DELETE_OPERATIONS,
  WORLD2_CHANGE_SET_CORE_QUESTION,
  WORLD2_CHANGE_OPERATION_TYPES,
  WORLD2_CHANGE_ELIGIBILITY_STATES,
  WORLD2_CHANGE_IMPACT_LEVELS,
  WORLD2_BLOCKED_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  REQUIRED_CHANGE_SET_AUTHORITIES,
  isWorld2ChangeOperationType,
  isWorld2ChangeSetEligibilityState,
  resolveWorld2TargetPath,
} from './world2-change-set-registry.js';

export type {
  World2ChangeOperationType,
  World2ChangeImpactLevel,
  World2ChangeSetEligibilityState,
  World2ChangeOperation,
  World2ChangeSet,
  World2ChangeSetInputSnapshot,
  World2ChangeSetAssessment,
  World2ChangeSetReport,
  AssessWorld2ChangeSetAuthorityInput,
  World2ChangeSetHistorySummary,
  ChangeOperationSafetyInput,
  ChangeOperationSafetyResult,
  ChangeSetImpactInput,
} from './world2-change-set-types.js';

export {
  resetWorld2ChangeSetHistoryForTests,
  recordWorld2ChangeSetAssessment,
  getWorld2ChangeSetHistorySize,
  getLatestWorld2ChangeSetAssessment,
  getWorld2ChangeSetHistory,
  buildWorld2ChangeSetHistorySummary,
  countWorld2ChangeSetEligibilityState,
} from './world2-change-set-history.js';

export {
  assessWorld2ChangeSetAuthority,
  evaluateChangeOperationSafety,
  computeChangeSetImpactAnalysis,
  deriveChangeSetEligibilityState,
  buildWorld2ChangeSetReport,
  buildWorld2ChangeSetArtifacts,
  resetWorld2ChangeSetAuthorityCounterForTests,
  resetWorld2ChangeSetAuthorityModuleForTests,
} from './world2-change-set-authority.js';

export type { ChangeSetEligibilityContext } from './world2-change-set-authority.js';

export { buildWorld2ChangeSetReportMarkdown } from './world2-change-set-report-builder.js';
