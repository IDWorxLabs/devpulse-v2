/**
 * Founder Test Runtime Monitor — public API (V1).
 */

export {
  FOUNDER_TEST_RUNTIME_MONITOR_V1_PASS,
  FOUNDER_TEST_STAGE2_STALL_REPAIR_V1_PASS,
  FOUNDER_TEST_STAGE2_STALL_REPAIR_REPORT_TITLE,
  FOUNDER_TEST_RUNTIME_MONITOR_OWNER_MODULE,
  FOUNDER_TEST_RUNTIME_MONITOR_PHASE,
  FOUNDER_TEST_RUNTIME_MONITOR_REPORT_TITLE,
  MAX_FOUNDER_TEST_RUNTIME_HISTORY,
  MAX_FOUNDER_TEST_RUNTIME_MS,
  FOUNDER_TEST_RUNTIME_STATES,
  FOUNDER_TEST_STAGE_STATUSES,
  STALL_HEALTH_VALUES,
  FOUNDER_TEST_ALREADY_RUNNING,
  FOUNDER_TEST_RUNTIME_STAGES,
  STAGE_HISTORICAL_AVERAGE_MS,
  STAGE_TIMEOUT_MS,
  STAGE_STALL_MESSAGES,
  STALL_SLOW_THRESHOLD_MS,
  STALL_STALLED_THRESHOLD_MS,
  SAFETY_GUARANTEES,
} from './founder-test-runtime-registry.js';

export {
  FOUNDER_TEST_OPERATOR_FEED_TRACE_V1_PASS,
  FOUNDER_TEST_OPERATOR_FEED_TRACE_REPORT_TITLE,
  MAX_FOUNDER_TEST_TRACE_EVENTS,
  TRACE_EVENT_STATUSES,
  OPERATION_NEXT_EXPECTED,
  STAGE_NEXT_EXPECTED,
} from './runtime-trace-registry.js';

export type {
  FounderTestRuntimeState,
  FounderTestStageStatus,
  StallHealth,
  FounderTestRuntimeStageRecord,
  FounderTestProgress,
  FounderTestRuntimeFeedEvent,
  FounderTestRuntimeFeed,
  StallAnalysis,
  FounderTestRuntimeSnapshot,
  BeginFounderTestRuntimeResult,
  FounderTestRuntimeHistoryEntry,
  FounderTestRuntimeMonitorReport,
  FounderTestTraceEventStatus,
  FounderTestRuntimeTraceEvent,
  FounderTestRuntimeOperationRef,
} from './founder-test-runtime-types.js';

export {
  resetFounderTestRuntimeHistoryForTests,
  getFounderTestRuntimeHistorySize,
  getFounderTestRuntimeHistory,
} from './runtime-history.js';

export {
  beginFounderTestRuntime,
  advanceFounderTestRuntimeStage,
  completeFounderTestRuntimeStage,
  emitFounderTestRuntimeWarning,
  finishFounderTestRuntime,
  getFounderTestRuntimeStatus,
  getFounderTestRuntimeStatusForRun,
  clearFounderTestRuntimeSessionOnlyForTests,
  FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_V1_PASS,
  resetFounderTestRuntimeMonitorForTests,
  buildFounderTestRuntimeMonitorArtifacts,
  touchFounderTestRuntimeHeartbeat,
  recordFounderTestRuntimeSubstep,
  runFounderTestRuntimeStageWork,
  emitFounderTestRuntimeTrace,
  buildLaunchReadinessArtifactBuildTraceBridge,
} from './founder-test-runtime-monitor.js';

export {
  buildFounderTestRuntimeMonitorReport,
  buildFounderTestRuntimeMonitorReportMarkdown,
} from './runtime-report-builder.js';

export {
  buildFounderTestRuntimeFailureReport,
  buildFounderTestMinimalDiagnosticReport,
} from './runtime-failure-report-builder.js';

export {
  FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_V1_PASS,
  FOUNDER_TEST_COMPLETE_NOTIFICATION_TITLE,
  FOUNDER_TEST_COMPLETE_PREPARING_MESSAGE,
  isFounderTestCompleteSuccessState,
  isFounderTestRuntimeFailureReportMarkdown,
  shouldUseFounderTestRuntimeFailureReport,
  resolveFounderTestReportMarkdownPreference,
  buildFounderTestCompletePreparingDiagnosticMarkdown,
  buildCompleteFounderTestResultPendingResponse,
} from './founder-test-complete-report-delivery.js';

export {
  createInitialStageRecords,
  markStageRunning,
  markStageComplete,
  countCompletedStages,
  touchStageHeartbeat,
} from './runtime-stage-tracker.js';
export { estimateFounderTestProgress, formatDurationClock } from './runtime-progress-estimator.js';
export { appendRuntimeFeedEvent, buildRuntimeFeed, formatRuntimeFeedLines } from './runtime-feed-builder.js';
export { analyzeRuntimeStall } from './runtime-stall-detector.js';
export {
  OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_V1_PASS,
  OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_REPORT_TITLE,
  COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_V1_PASS,
  COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_REPORT_TITLE,
  FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_V1_PASS,
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES,
  resolveMissingIntakeCompletionBoundary,
  resolveIntakeValidationNextExpected,
  analyzeStage2CompletionGap,
  resolveChatStressRuntimeFields,
  CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS,
  hasPassedTraceEvent,
} from './stage2-completion-tracker.js';
export {
  COMPLETE_REPORT_PREPARING_STALL_REPAIR_V1_PASS,
  COMPLETE_REPORT_HANDOFF_STALL_MS,
  REPORT_HANDOFF_TRACE_BOUNDARIES,
  FOUNDER_TEST_COMPLETE_HEADER_HANDOFF_STALLED,
  resolveMissingReportHandoffBoundary,
  buildFounderTestResultDebugResponse,
  buildReportHandoffStallDiagnosticMarkdown,
} from './complete-report-preparing-stall.js';
export {
  COMPLETE_REPORT_DELIVERY_EVENT_BRIDGE_V1_PASS,
  FOUNDER_TEST_COMPLETE_HEADER_REPORT_READY,
  FOUNDER_TEST_COMPLETE_HEADER_PREPARING,
  FOUNDER_TEST_COMPLETE_HEADER_FETCH_FAILED,
  normalizeFounderTestDeliveryRunId,
  resolveFounderTestCompleteHeaderHint,
  shouldShowOperatorFeedFetchingLabel,
  shouldDeliverFounderTestReportReadyNotification,
} from './complete-report-delivery-event-bridge.js';
export {
  OPERATOR_FEED_FINAL_REPORT_BUTTON_STATE_SYNC_V1_PASS,
  FOUNDER_TEST_FINAL_REPORT_FETCH_STATES,
  FOUNDER_TEST_OPERATOR_FEED_COPY_FINAL_REPORT,
  FOUNDER_TEST_OPERATOR_FEED_OPEN_FINAL_REPORT,
  FOUNDER_TEST_OPERATOR_FEED_FETCHING_REPORT,
  resolveFounderTestFinalReportFetchState,
  shouldApplyFailedFetchState,
  resolveFounderTestOperatorFeedReportButtonLabels,
  shouldShowOperatorFeedFetchingReportLabel,
  resolveFounderTestReportHandoffStatusLabel,
  FOUNDER_TEST_OPERATOR_FEED_COPY_HANDOFF_DIAGNOSTIC,
  FOUNDER_TEST_OPERATOR_FEED_OPEN_HANDOFF_DIAGNOSTIC,
  FOUNDER_TEST_OPERATOR_FEED_RETRY_FETCH_RESULT,
  type FounderTestFinalReportFetchState,
} from './operator-feed-final-report-button-state-sync.js';
export {
  FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_V1_PASS,
  FOUNDER_TEST_RESULTS_PANEL_COPY_HANDOFF_DIAGNOSTIC,
  FOUNDER_TEST_RESULTS_PANEL_OPEN_HANDOFF_DIAGNOSTIC,
  FOUNDER_TEST_RESULTS_PANEL_COPY_RUNTIME_DIAGNOSTIC,
  FOUNDER_TEST_RESULTS_PANEL_OPEN_RUNTIME_DIAGNOSTIC,
  shouldUseFounderTestHandoffDiagnosticForCompleteReport,
  isFounderTestRuntimeDiagnosticPayloadSource,
  shouldAvoidRuntimeFailureReportForCompleteHandoff,
  resolveFounderTestResultsPanelReportActionLabels,
  type FounderTestReportHandoffPayloadSource,
} from './founder-test-results-modal-copy-path-alignment.js';
export {
  REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_V1_PASS,
  FOUNDER_TEST_RUNTIME_FAILURE_REPORT_HEADING,
  FOUNDER_TEST_HANDOFF_DIAGNOSTIC_HEADING,
  isGenericFailedToFetchMessage,
  shouldBlockRuntimeFailureReportForCompleteRun,
  shouldUseCompleteHandoffDiagnosticCopy,
  completeCopyMustIncludeHandoffDiagnosticFields,
  completeCopyMustNotIncludeGenericFailedToFetch,
} from './remove-legacy-failed-to-fetch-copy-fallback.js';
export {
  FOUNDER_TEST_API_BASE_URL_ROUTING_REPAIR_V1_PASS,
  FOUNDER_TEST_DEFAULT_API_ORIGIN,
  FOUNDER_TEST_VITE_DEV_PORTS,
  FOUNDER_TEST_RESULT_ROUTE,
  FOUNDER_TEST_RUNTIME_STATUS_ROUTE,
  FOUNDER_TEST_RUN_ROUTE,
  resolveFounderTestApiBaseUrl,
  buildFounderTestApiUrl,
  buildFounderTestRuntimeStatusUrl,
  buildFounderTestRunUrl,
  buildFounderTestApiRoutingDiagnosticLines,
  founderTestResultAndRuntimeStatusShareBase,
} from './founder-test-api-base-url-routing.js';
export {
  FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_V1_PASS,
  FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN,
  FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,
  FOUNDER_TEST_COMPLETE_HANDOFF_PENDING_STAGE_LINE,
  hasStoredFounderTestReportMarkdownForRun,
  verifyFounderTestCompleteHandoffBoundary,
  canEmitFounderTestRuntimeComplete,
  maskRuntimeSnapshotUntilHandoffReady,
  resolvePublicFounderTestRuntimeSnapshot,
} from './founder-test-complete-handoff-boundary.js';
export {
  FOUNDER_TEST_COMPLETE_STATE_TRUTH_REPORT_FETCH_LOOP_V1_PASS,
  FOUNDER_TEST_PUBLIC_STATE_REPORT_HANDOFF_PENDING,
  FOUNDER_TEST_REPORT_GENERATION_RUNNING_OPERATION,
  FOUNDER_TEST_REPORT_HANDOFF_PENDING_OPERATION,
  FOUNDER_TEST_PUBLIC_COMPLETE_OPERATION,
  FOUNDER_TEST_REPORT_HANDOFF_FAILED_OPERATION,
  FOUNDER_TEST_HANDOFF_STATE_LABELS,
  FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS_BOUNDED,
  FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS_BOUNDED,
  isReportGenerationOperationLabel,
  isExecutionTerminalComplete,
  resolveFounderTestHandoffState,
  resolveFounderTestPublicState,
  hasContradictoryCompleteState,
  reconcilePublicFounderTestRuntimeSnapshot,
  publicCompleteRequiresStoredReportMarkdown,
  completeCannotCoexistWithReportGenerationRunning,
  completeCannotCoexistWithStagePending,
  type FounderTestHandoffState,
} from './founder-test-complete-state-truth.js';
export {
  FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_V1_PASS,
  FOUNDER_TEST_RESULT_INLINE_MARKDOWN_MAX_CHARS,
  FOUNDER_TEST_RESULT_PREVIEW_MAX_CHARS,
  FOUNDER_TEST_RESULT_REPORT_ROUTE,
  FOUNDER_TEST_RESULT_DOWNLOAD_ROUTE,
  FOUNDER_TEST_RESULT_STORE_PERSISTENCE,
  FOUNDER_TEST_RESULT_SERIALIZATION_FAILED,
  FOUNDER_TEST_AVAILABLE_DELIVERY_MODES,
  estimateFounderTestResultPayloadTooLarge,
  resolveFounderTestResultDeliveryMode,
  buildFounderTestReportPreview,
  safeStringifyFounderTestJson,
  buildFounderTestResultSerializationFailureResponse,
  buildFounderTestResultMetadataResponse,
  buildBoundedFounderTestResultDebugResponse,
  resolveStoredFounderTestReportMarkdownForDelivery,
  buildFounderTestResultDownloadFilename,
  buildFounderTestStoreVolatilityFields,
  type FounderTestResultDeliveryMode,
} from './founder-test-result-payload-crash-repair.js';
export {
  FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_V1_PASS,
  FOUNDER_TEST_PING_ROUTE,
  FOUNDER_TEST_REGISTERED_RESULT_ROUTES,
  classifyFounderTestResultFailureBoundary,
  founderTestResultStoreIsInMemoryOnly,
  type FounderTestResultFailureBoundary,
} from './founder-test-result-route-existence-proof.js';
export {
  REPORT_HANDOFF_RUNID_PROPAGATION_REPAIR_V1_PASS,
  FORBIDDEN_HANDOFF_RUN_IDS,
  isValidHandoffRunId,
  resolveReportHandoffRunId,
  coerceReportHandoffRunId,
  buildReportHandoffRunIdDiagnosticFields,
  buildReportHandoffRunIdPropagationDiagnosticLines,
  assertHandoffEndpointRunId,
} from './report-handoff-runid-propagation.js';
export {
  RESULT_FETCH_FAILURE_DIAGNOSTIC_SURFACE_V1_PASS,
  FOUNDER_TEST_RESULT_DEBUG_ROUTE,
  FOUNDER_TEST_RESULT_DEBUG_CONTENT_TYPE_EXPECTED,
  NON_JSON_RESPONSE_PREVIEW_MAX_CHARS,
  previewNonJsonResponseBody,
  buildFounderTestResultFetchUrl,
  buildFounderTestResultDebugUrl,
  buildFounderTestResultReportUrl,
  buildFounderTestResultDownloadUrl,
  buildResultFetchFailureDiagnosticLines,
  buildResultDebugResponseDiagnosticLines,
  buildResultFetchFailureDiagnosticMarkdown,
  type ResultFetchAttemptDiagnostic,
} from './result-fetch-failure-diagnostic-surface.js';
export {
  FINAL_REPORT_ACCESS_CACHE_UNIFICATION_V1_PASS,
  isFounderTestFinalReportMarkdownCandidate,
  resolveFinalReportMarkdownPriority,
  shouldUseCachedFinalReportDespiteFetchFailure,
  storeFinalReportMarkdownInCache,
  type FinalReportMarkdownSource,
} from './final-report-access-cache.js';
export {
  COMPLETE_REPORT_HANDOFF_REPAIR_V1_PASS,
  COMPLETE_REPORT_HANDOFF_RESULT_RETRY_ATTEMPTS,
  COMPLETE_REPORT_HANDOFF_RETRY_DELAY_MS,
  COMPLETE_REPORT_HANDOFF_PREPARING_REASON,
  resolveStoredFounderTestReportMarkdown,
  buildFounderTestRunHandoffPayload,
  buildFounderTestCompleteHandoffFallbackMarkdown,
  shouldReturnCompleteResultHttp200,
  buildCompleteFounderTestResultPendingHandoffResponse,
} from './founder-test-complete-report-handoff.js';
export {
  resetFounderTestRunResultStoreForTests,
  markFounderTestHandlerAlive,
  markFounderTestHandlerIdle,
  isFounderTestHandlerAlive,
  getFounderTestHandlerLastAliveAt,
  storeFounderTestRunResult,
  consumeFounderTestRunResult,
  peekFounderTestRunResult,
  hasFounderTestRunResult,
  getFounderTestRunResultCount,
  listFounderTestRunResultIds,
  type StoredFounderTestRunResult,
} from './founder-test-run-result-store.js';
export {
  LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_V1_PASS,
  LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_REPORT_TITLE,
  SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION,
  beginArtifactBuildSubstep,
  completeArtifactBuildSubstep,
  analyzeArtifactBuildSubstepStall,
  createLaunchReadinessArtifactBuildTraceBridge,
  resetLaunchReadinessArtifactBuildTracerForTests,
  getLastSuccessfulArtifactSubstep,
  getLastFailedArtifactSubstep,
} from './launch-readiness-artifact-build-tracer.js';
export {
  appendRuntimeTraceEvent,
  buildTraceEventId,
  formatRuntimeTraceEvents,
  resetRuntimeTraceCounterForTests,
  resolveNextExpectedOperation,
  resolveTraceStageStatus,
} from './runtime-trace-builder.js';
