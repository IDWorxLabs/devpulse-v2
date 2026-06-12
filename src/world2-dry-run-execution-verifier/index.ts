/**
 * World 2 Dry-Run Execution Verifier — public API.
 */

export {
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_OWNER_MODULE,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_PHASE,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_REPORT_TITLE,
  WORLD2_DRY_RUN_VERIFIER_CACHE_KEY_PREFIX,
  MAX_DRY_RUN_VERIFIER_HISTORY,
  MAX_DRY_RUN_VERIFIER_REASONS,
  MAX_MISSING_COVERAGE,
  WORLD2_DRY_RUN_VERIFIER_CORE_QUESTION,
  WORLD2_DRY_RUN_VERIFICATION_STATES,
  REQUIRED_ORDERED_STEP_DEFINITIONS,
  READINESS_SCORE_WEIGHTS,
  VERIFIED_MIN_SCORE,
  VERIFIED_WITH_WARNINGS_MIN_SCORE,
  WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  REQUIRED_VERIFIER_AUTHORITIES,
  WORLD2_DRY_RUN_VERIFIER_SAFETY_GUARANTEES,
  SNAPSHOT_MATERIALIZER_SAFETY_CHECK_IDS,
  CHANGE_MATERIALIZER_SAFETY_CHECK_IDS,
  ENGINE_STEP_ACTION_TYPES,
  isWorld2DryRunVerificationState,
  pathMatchesPatterns,
  isDisposableOnlyTargetRoot,
} from './world2-dry-run-execution-verifier-registry.js';

export type {
  World2DryRunVerificationState,
  World2DryRunOrderedStepCheck,
  World2DryRunVerificationSafetyCheck,
  World2DryRunCoverageCheck,
  World2DryRunExecutionVerificationAssessment,
  World2DryRunExecutionVerifierInputSnapshot,
  World2DryRunExecutionVerifierReport,
  AssessWorld2DryRunExecutionVerifierInput,
  World2DryRunExecutionVerifierHistorySummary,
  DryRunVerificationStateContext,
  World2DryRunReadinessScoreBreakdown,
} from './world2-dry-run-execution-verifier-types.js';

export {
  resetWorld2DryRunExecutionVerifierHistoryForTests,
  recordWorld2DryRunExecutionVerifierAssessment,
  getWorld2DryRunExecutionVerifierHistorySize,
  getLatestWorld2DryRunExecutionVerifierAssessment,
  getWorld2DryRunExecutionVerifierHistory,
  buildWorld2DryRunExecutionVerifierHistorySummary,
  countWorld2DryRunVerificationState,
} from './world2-dry-run-execution-verifier-history.js';

export {
  assessWorld2DryRunExecutionVerifier,
  performWorld2DryRunOrderedStepChecks,
  performWorld2DryRunVerificationSafetyChecks,
  performWorld2DryRunValidationCoverageChecks,
  performWorld2DryRunRollbackCoverageChecks,
  performWorld2DryRunAuditCoverageChecks,
  computeWorld2DryRunReadinessScore,
  deriveWorld2DryRunVerificationState,
  buildWorld2DryRunExecutionVerifierReport,
  buildWorld2DryRunExecutionVerifierArtifacts,
  resetWorld2DryRunExecutionVerifierCounterForTests,
  resetWorld2DryRunExecutionVerifierModuleForTests,
} from './world2-dry-run-execution-verifier-authority.js';

export { buildWorld2DryRunExecutionVerifierReportMarkdown } from './world2-dry-run-execution-verifier-report-builder.js';
