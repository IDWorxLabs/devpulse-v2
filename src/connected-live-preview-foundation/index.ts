/**
 * Connected Live Preview Foundation — public API.
 */

export {
  CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN,
  CONNECTED_LIVE_PREVIEW_OWNER_MODULE,
  CONNECTED_LIVE_PREVIEW_PHASE,
  CONNECTED_LIVE_PREVIEW_REPORT_TITLE,
  CONNECTED_LIVE_PREVIEW_CACHE_KEY_PREFIX,
  CONNECTED_LIVE_PREVIEW_CORE_QUESTION,
  MAX_CONNECTED_LIVE_PREVIEW_HISTORY,
  MAX_PREVIEW_ENTRIES,
  MAX_RECOMMENDED_ACTIONS,
  MAX_MISSING_COMPONENTS,
  PREVIEW_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  PREVIEW_READINESS_SAFETY_GUARANTEES,
  isPreviewState,
} from './connected-live-preview-registry.js';

export type {
  PreviewState,
  PreviewReadinessEntry,
  PreviewReadinessArtifactEntry,
  PreviewCandidate,
  PreviewReadinessContract,
  PreviewReadinessQuestionAnswers,
  ConnectedLivePreviewInputSnapshot,
  ConnectedLivePreviewReport,
  ConnectedLivePreviewAssessment,
  AssessConnectedLivePreviewInput,
  ConnectedLivePreviewHistoryEntry,
  ConnectedLivePreviewHistorySummary,
  ConnectedLivePreviewArtifacts,
} from './connected-live-preview-types.js';

export {
  resetConnectedLivePreviewHistoryForTests,
  recordConnectedLivePreviewAssessment,
  getConnectedLivePreviewHistorySize,
  getLatestConnectedLivePreviewHistoryEntry,
  getConnectedLivePreviewHistory,
  countPreviewState,
  buildConnectedLivePreviewHistorySummary,
} from './connected-live-preview-history.js';

export {
  assessConnectedLivePreview,
  buildConnectedLivePreviewArtifacts,
  buildPreviewCandidate,
  buildPreviewReadinessContract,
  derivePreviewReadinessQuestionAnswers,
  derivePreviewReadinessScore,
  derivePreviewState,
  derivePreviewCompleteness,
  derivePreviewDependencyCompleteness,
  derivePreviewProofCompleteness,
  resetConnectedLivePreviewCounterForTests,
  resetConnectedLivePreviewModuleForTests,
} from './connected-live-preview-authority.js';

export { buildConnectedLivePreviewReportMarkdown } from './connected-live-preview-report-builder.js';
