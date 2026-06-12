/**
 * World 2 Dry-Run Execution Composer — public API.
 */

export {
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_PASS_TOKEN,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_OWNER_MODULE,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_PHASE,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_REPORT_TITLE,
  WORLD2_DRY_RUN_COMPOSER_CACHE_KEY_PREFIX,
  MAX_DRY_RUN_COMPOSER_HISTORY,
  MAX_DRY_RUN_COMPOSER_REASONS,
  MAX_ORDERED_STEPS,
  MAX_VALIDATION_STEPS,
  MAX_ROLLBACK_STEPS,
  MAX_AUDIT_TRAIL_ENTRIES,
  WORLD2_DRY_RUN_COMPOSER_CORE_QUESTION,
  WORLD2_DRY_RUN_PACKAGE_STATES,
  WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  WORLD2_DRY_RUN_ORDERED_STEP_DEFINITIONS,
  WORLD2_DRY_RUN_PACKAGE_POSTCONDITIONS,
  REQUIRED_DRY_RUN_COMPOSER_AUTHORITIES,
  WORLD2_DRY_RUN_COMPOSER_SAFETY_GUARANTEES,
  isWorld2DryRunPackageState,
  pathMatchesPatterns,
  isDisposableOnlyTargetRoot,
} from './world2-dry-run-execution-composer-registry.js';

export type {
  World2DryRunPackageState,
  World2DryRunOrderedStep,
  World2DryRunValidationStep,
  World2DryRunRollbackStep,
  World2DryRunExecutionAuditEntry,
  World2DryRunExecutionSafetyCheck,
  World2DryRunExecutionPackage,
  World2DryRunExecutionComposerInputSnapshot,
  World2DryRunExecutionComposerAssessment,
  World2DryRunExecutionComposerReport,
  AssessWorld2DryRunExecutionComposerInput,
  World2DryRunExecutionComposerHistorySummary,
  DryRunPackageStateContext,
} from './world2-dry-run-execution-composer-types.js';

export {
  resetWorld2DryRunExecutionComposerHistoryForTests,
  recordWorld2DryRunExecutionComposerAssessment,
  getWorld2DryRunExecutionComposerHistorySize,
  getLatestWorld2DryRunExecutionComposerAssessment,
  getWorld2DryRunExecutionComposerHistory,
  buildWorld2DryRunExecutionComposerHistorySummary,
  countWorld2DryRunPackageState,
} from './world2-dry-run-execution-composer-history.js';

export {
  assessWorld2DryRunExecutionComposer,
  buildWorld2DryRunOrderedSteps,
  buildWorld2DryRunValidationSteps,
  buildWorld2DryRunRollbackSteps,
  performWorld2DryRunExecutionSafetyChecks,
  deriveWorld2DryRunPackageState,
  buildWorld2DryRunExecutionComposerReport,
  buildWorld2DryRunExecutionComposerArtifacts,
  resetWorld2DryRunExecutionComposerCounterForTests,
  resetWorld2DryRunExecutionComposerModuleForTests,
} from './world2-dry-run-execution-composer-authority.js';

export { buildWorld2DryRunExecutionComposerReportMarkdown } from './world2-dry-run-execution-composer-report-builder.js';

export {
  EXECUTION_PACKAGE_AUTHORITATIVE_OWNER,
  WORLD2_DRY_RUN_COMPOSER_ADAPTER_ROLE,
  mapWorld2DryRunPackageToExecutionPackage,
} from './world2-execution-package-bridge.js';
export type { World2DryRunExecutionPackageBridgeOptions } from './world2-execution-package-bridge.js';
