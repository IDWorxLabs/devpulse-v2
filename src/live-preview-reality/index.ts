/**
 * Live Preview Reality — public exports.
 */

export {
  LIVE_PREVIEW_REALITY_PASS_TOKEN,
  LIVE_PREVIEW_REALITY_OWNER_MODULE,
} from './live-preview-reality-bounds.js';

export type {
  AssessLivePreviewRealityAuthorityInput,
  LivePreviewAnalyzerResults,
  LivePreviewBlocker,
  LivePreviewDimensionResult,
  LivePreviewEvidence,
  LivePreviewFeedEvent,
  LivePreviewRealityAssessment,
  LivePreviewRealityAuthorityAssessment,
  LivePreviewRealityInput,
  LivePreviewRealityState,
  LivePreviewRealitySubscores,
  LivePreviewReport,
  LivePreviewSessionSignal,
  LivePreviewStage,
  PreviewModulePresenceEvidence,
  PreviewRealityMatrixRow,
  PreviewWorkspaceSignals,
} from './live-preview-reality-types.js';

export type {
  BuildToPreviewLevel,
  FounderRealityBottleneck,
  PreviewConnectivityLevel,
  PreviewEvidenceLevel,
  PreviewInfrastructureLevel,
  PreviewUsabilityLevel,
  RuntimeEvidenceLevel,
} from './live-preview-reality-analyzer-types.js';

export {
  MAX_HISTORY_ENTRIES,
  MAX_PREVIEW_BLOCKERS,
  MAX_PREVIEW_EVIDENCE,
  MAX_REGISTRY_ENTRIES,
} from './live-preview-reality-bounds.js';

export {
  analyzeBuildToPreview,
  analyzePreviewConnectivity,
  analyzePreviewInfrastructure,
  analyzePreviewUsability,
  analyzeRuntimeEvidence,
  buildPreviewWorkspaceSignalsFromLegacy,
  collectLivePreviewEvidence,
  detectPreviewModulePresenceEvidence,
  runAllLivePreviewRealityAnalyzers,
} from './live-preview-reality-analyzers.js';

export {
  getLivePreviewHistoryCount,
  listLivePreviewHistory,
  recordLivePreviewHistory,
  resetLivePreviewRealityHistoryForTests,
} from './live-preview-reality-history.js';

export {
  getLivePreviewRegistryCount,
  listLivePreviewRegistryEntries,
  resetLivePreviewRealityRegistryForTests,
  storeLivePreviewRegistryEntry,
} from './live-preview-reality-registry.js';

export {
  assessLivePreviewReality,
  assessLivePreviewRealityAuthority,
  buildLivePreviewRealityInputFromWorkspace,
  buildLivePreviewRealityReport,
  livePreviewStatusLabelFromReality,
  resetLivePreviewRealityAuthorityCounterForTests,
  writeLivePreviewRealityReportFile,
} from './live-preview-reality-authority.js';
