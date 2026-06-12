/**
 * World 2 Change Set Materializer — public API.
 */

export {
  WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN,
  WORLD2_CHANGE_SET_MATERIALIZER_OWNER_MODULE,
  WORLD2_CHANGE_SET_MATERIALIZER_PHASE,
  WORLD2_CHANGE_SET_MATERIALIZER_REPORT_TITLE,
  WORLD2_CHANGE_MATERIALIZER_CACHE_KEY_PREFIX,
  MAX_CHANGE_MATERIALIZER_HISTORY,
  MAX_CHANGE_MATERIALIZER_REASONS,
  DEFAULT_CHANGE_MATERIALIZATION_MODE,
  MAX_PLANNED_OPERATIONS,
  MAX_UNBOUNDED_DELETE_THRESHOLD,
  WORLD2_CHANGE_MATERIALIZER_CORE_QUESTION,
  WORLD2_CHANGE_MATERIALIZATION_MODES,
  WORLD2_CHANGE_MATERIALIZATION_STATES,
  WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  WORLD2_CHANGE_MATERIALIZATION_POSTCONDITIONS,
  REQUIRED_CHANGE_SET_MATERIALIZER_AUTHORITIES,
  WORLD2_CHANGE_MATERIALIZER_SAFETY_GUARANTEES,
  isWorld2ChangeMaterializationMode,
  isWorld2ChangeMaterializationState,
  resolveTargetWorkspaceRoot,
  isDisposableOnlyTargetRoot,
  pathMatchesPatterns,
  isMutatingOperationType,
  isDeleteOperationType,
} from './world2-change-set-materializer-registry.js';

export type {
  World2ChangeMaterializationMode,
  World2ChangeMaterializationState,
  World2ChangeMaterializationOverride,
  World2ChangeMaterializationSafetyCheck,
  World2ChangeRollbackMapEntry,
  World2ChangeMaterializationOperation,
  World2ChangeDryRunMaterializationResult,
  World2ChangeSetMaterializerInputSnapshot,
  World2ChangeSetMaterializerAssessment,
  World2ChangeSetMaterializerReport,
  AssessWorld2ChangeSetMaterializerInput,
  World2ChangeSetMaterializerHistorySummary,
  ChangeMaterializationModeContext,
  World2PlannedChangeOperations,
} from './world2-change-set-materializer-types.js';

export {
  resetWorld2ChangeSetMaterializerHistoryForTests,
  recordWorld2ChangeSetMaterializerAssessment,
  getWorld2ChangeSetMaterializerHistorySize,
  getLatestWorld2ChangeSetMaterializerAssessment,
  getWorld2ChangeSetMaterializerHistory,
  buildWorld2ChangeSetMaterializerHistorySummary,
  countWorld2ChangeMaterializationState,
} from './world2-change-set-materializer-history.js';

export {
  assessWorld2ChangeSetMaterializer,
  mapChangeOperationsToPlannedFields,
  deriveChangeMaterializationEligibilityMode,
  deriveChangeMaterializationState,
  performWorld2ChangeMaterializationSafetyChecks,
  buildWorld2ChangeSetMaterializerReport,
  buildWorld2ChangeSetMaterializerArtifacts,
  resetWorld2ChangeSetMaterializerCounterForTests,
  resetWorld2ChangeSetMaterializerModuleForTests,
} from './world2-change-set-materializer-authority.js';

export { buildWorld2ChangeSetMaterializerReportMarkdown } from './world2-change-set-materializer-report-builder.js';
