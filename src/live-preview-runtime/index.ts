/**
 * DevPulse V2 Phase 16.1 — Live Preview Runtime public API.
 */

export {
  LIVE_PREVIEW_RUNTIME_PASS_TOKEN,
  LIVE_PREVIEW_RUNTIME_OWNER_MODULE,
  LIVE_PREVIEW_QUESTION_SIGNALS,
  FORBIDDEN_LIVE_PREVIEW_DUPLICATES,
  TRACKED_PREVIEW_CAPABILITIES,
  isLivePreviewQuestion,
  isLivePreviewAdvisoryQuestion,
  isDuplicatePreviewExecutorQuestion,
  capabilitiesForTargetType,
  type PreviewTargetType,
  type PreviewState,
  type PreviewCapabilityType,
  type PreviewTargetMetadata,
  type PreviewSession,
  type PreviewRuntimeReport,
  type PreviewRuntimeDiagnostics,
  type PrepareLivePreviewRuntimeInput,
  type PrepareLivePreviewRuntimeResult,
} from './types.js';

export { parsePreviewQuery, resetPreviewRequestCounterForTests } from './preview-request-parser.js';
export {
  registerPreviewTarget,
  getPreviewTarget,
  listPreviewTargets,
  hasPreviewTarget,
  resetPreviewTargetRegistryForTests,
} from './preview-target-registry.js';
export {
  createPreviewSession,
  getPreviewSession,
  listPreviewSessions,
  closePreviewSession,
  closePreviewSessionsForProject,
  resetPreviewSessionManagerForTests,
} from './preview-session-manager.js';
export {
  evaluatePreviewGates,
  validatePreviewRuntime,
  type PreviewGateReport,
  type PreviewValidationResult,
} from './preview-runtime-validator.js';
export {
  composePreviewResponse,
  buildPreviewFailureContext,
  nextPreviewReportId,
  resetPreviewReportCounterForTests,
  type PreviewFailureContext,
} from './preview-runtime-report.js';
export {
  getPreviewRuntimeDiagnostics,
  updatePreviewRuntimeDiagnostics,
  resetPreviewRuntimeDiagnostics,
  previewRuntimeKey,
} from './preview-runtime-diagnostics.js';
export {
  prepareLivePreviewRuntime,
  processLivePreviewRequest,
  getLivePreviewContext,
} from './preview-runtime.js';

export function getDevPulseV2LivePreviewRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_live_preview_runtime',
    passToken: 'LIVE_PREVIEW_RUNTIME_V1_PASS',
    phase: 16.1,
    extensionOnly: true,
  };
}
