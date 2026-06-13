/**
 * Connected Live Preview Execution — public API.
 */

export {
  CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN,
  CONNECTED_LIVE_PREVIEW_EXECUTION_OWNER_MODULE,
  CONNECTED_LIVE_PREVIEW_EXECUTION_PHASE,
  CONNECTED_LIVE_PREVIEW_EXECUTION_REPORT_TITLE,
  CONNECTED_LIVE_PREVIEW_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION,
  MAX_CONNECTED_LIVE_PREVIEW_EXECUTION_HISTORY,
  MAX_PREVIEW_WARNINGS,
  MAX_PREVIEW_BLOCKERS,
  MAX_RECOMMENDED_ACTIONS,
  MAX_PREVIEW_ARTIFACTS,
  MAX_PREVIEW_EVIDENCE,
  MAX_PREVIEW_DIAGNOSTICS,
  DEFAULT_PREVIEW_PORT,
  PREVIEW_PROBE_TIMEOUT_MS,
  PREVIEW_EXECUTION_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  PREVIEW_EXECUTION_SAFETY_GUARANTEES,
  isPreviewExecutionState,
} from './connected-live-preview-execution-registry.js';

export type {
  PreviewExecutionState,
  PreviewActivationMode,
  PreviewArtifactEntry,
  PreviewEvidenceEntry,
  PreviewDiagnosticEntry,
  PreviewActivationEvidence,
  PreviewActivationContract,
  PreviewExecutionQuestionAnswers,
  ConnectedLivePreviewExecutionInputSnapshot,
  ConnectedLivePreviewExecutionReport,
  ConnectedLivePreviewExecutionAssessment,
  AssessConnectedLivePreviewExecutionInput,
  ConnectedLivePreviewExecutionHistoryEntry,
  ConnectedLivePreviewExecutionHistorySummary,
  ConnectedLivePreviewExecutionArtifacts,
  ExecutePreviewActivationInput,
  ExecutePreviewActivationResult,
} from './connected-live-preview-execution-types.js';

export {
  resetConnectedLivePreviewExecutionHistoryForTests,
  recordConnectedLivePreviewExecutionAssessment,
  getConnectedLivePreviewExecutionHistorySize,
  getLatestConnectedLivePreviewExecutionHistoryEntry,
  getLatestConnectedLivePreviewExecutionAssessment,
  getConnectedLivePreviewExecutionHistory,
  countPreviewExecutionState,
  buildConnectedLivePreviewExecutionHistorySummary,
} from './connected-live-preview-execution-history.js';

export {
  assessConnectedLivePreviewExecution,
  buildConnectedLivePreviewExecutionArtifacts,
  derivePreviewExecutionQuestionAnswers,
  derivePreviewScore,
  derivePreviewExecutionState,
  resetConnectedLivePreviewExecutionCounterForTests,
  resetConnectedLivePreviewExecutionModuleForTests,
} from './connected-live-preview-execution-authority.js';

export {
  executePreviewActivation,
  resetPreviewActivationEngineForTests,
} from './preview-activation-engine.js';

export { buildConnectedLivePreviewExecutionReportMarkdown } from './connected-live-preview-execution-report-builder.js';
