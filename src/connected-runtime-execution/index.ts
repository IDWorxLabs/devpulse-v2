/**
 * Connected Runtime Execution — public API.
 */

export {
  CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN,
  CONNECTED_RUNTIME_EXECUTION_OWNER_MODULE,
  CONNECTED_RUNTIME_EXECUTION_PHASE,
  CONNECTED_RUNTIME_EXECUTION_REPORT_TITLE,
  CONNECTED_RUNTIME_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION,
  MAX_CONNECTED_RUNTIME_EXECUTION_HISTORY,
  MAX_RUNTIME_WARNINGS,
  MAX_RUNTIME_BLOCKERS,
  MAX_RECOMMENDED_ACTIONS,
  MAX_RUNTIME_ARTIFACTS,
  MAX_RUNTIME_EVIDENCE,
  MAX_RUNTIME_DIAGNOSTICS,
  DEFAULT_RUNTIME_PORT,
  RUNTIME_STARTUP_TIMEOUT_MS,
  RUNTIME_EXECUTION_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  RUNTIME_EXECUTION_SAFETY_GUARANTEES,
  isRuntimeExecutionState,
} from './connected-runtime-execution-registry.js';

export type {
  ConnectedBuildExecutionContract,
  RuntimeExecutionState,
  RuntimeActivationMode,
  RuntimeArtifactEntry,
  RuntimeEvidenceEntry,
  RuntimeDiagnosticEntry,
  RuntimeActivationEvidence,
  RuntimeActivationContract,
  RuntimeExecutionQuestionAnswers,
  ConnectedRuntimeExecutionInputSnapshot,
  ConnectedRuntimeExecutionReport,
  ConnectedRuntimeExecutionAssessment,
  AssessConnectedRuntimeExecutionInput,
  ConnectedRuntimeExecutionHistoryEntry,
  ConnectedRuntimeExecutionHistorySummary,
  ConnectedRuntimeExecutionArtifacts,
  ExecuteRuntimeActivationInput,
  ExecuteRuntimeActivationResult,
} from './connected-runtime-execution-types.js';

export {
  resetConnectedRuntimeExecutionHistoryForTests,
  recordConnectedRuntimeExecutionAssessment,
  getConnectedRuntimeExecutionHistorySize,
  getLatestConnectedRuntimeExecutionHistoryEntry,
  getLatestConnectedRuntimeExecutionAssessment,
  getConnectedRuntimeExecutionHistory,
  countRuntimeExecutionState,
  buildConnectedRuntimeExecutionHistorySummary,
} from './connected-runtime-execution-history.js';

export {
  assessConnectedRuntimeExecution,
  buildConnectedRuntimeExecutionArtifacts,
  deriveRuntimeExecutionQuestionAnswers,
  deriveRuntimeScore,
  deriveRuntimeExecutionState,
  resetConnectedRuntimeExecutionCounterForTests,
  resetConnectedRuntimeExecutionModuleForTests,
} from './connected-runtime-execution-authority.js';

export {
  executeRuntimeActivation,
  prepareBuildExecutionInWorkspace,
  cleanupActiveRuntime,
  resetRuntimeActivationEngineForTests,
} from './runtime-activation-engine.js';

export { buildConnectedRuntimeExecutionReportMarkdown } from './connected-runtime-execution-report-builder.js';
