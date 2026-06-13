/**
 * Connected Preview Experience Proof — public API (Phase 26.10).
 */

export {
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_OWNER_MODULE,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_PHASE,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPORT_TITLE,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_CACHE_KEY_PREFIX,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_CORE_QUESTION,
  MAX_PREVIEW_EXPERIENCE_PROOF_HISTORY,
  PREVIEW_PROBE_TIMEOUT_MS,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './connected-preview-experience-proof-registry.js';

export type {
  PreviewProofLevel,
  PreviewExperienceState,
  PreviewSessionState,
  PreviewUrlState,
  PreviewRenderState,
  PreviewInteractionState,
  PreviewCaptureState,
  PreviewSessionAssessment,
  PreviewUrlAssessment,
  PreviewRenderAssessment,
  PreviewInteractionAssessment,
  PreviewCaptureAssessment,
  PreviewManifestAssessment,
  PreviewLinkageAnalysis,
  PreviewExperienceFounderQuestions,
  PreviewExperienceProofReport,
  PreviewExperienceProofAssessment,
  PreviewSessionEvidence,
  AssessConnectedPreviewExperienceProofInput,
  PreviewExperienceProofHistoryEntry,
  PreviewExperienceProofHistorySummary,
  PreviewExperienceProofArtifacts,
  PreviewActivationEvidence,
} from './connected-preview-experience-proof-types.js';

export {
  resetPreviewExperienceProofHistoryForTests,
  recordPreviewExperienceProofAssessment,
  getPreviewExperienceProofHistorySize,
  buildPreviewExperienceProofHistorySummary,
} from './connected-preview-experience-proof-history.js';

export {
  assessConnectedPreviewExperienceProof,
  buildPreviewExperienceProofArtifacts,
  resetPreviewExperienceProofCounterForTests,
  resetConnectedPreviewExperienceProofModuleForTests,
} from './connected-preview-experience-proof-authority.js';

export {
  buildPreviewExperienceProofReportMarkdown,
  formatPreviewExperienceProofSummary,
} from './connected-preview-experience-proof-report-builder.js';

export { analyzePreviewSession, isSessionObserved } from './preview-session-analyzer.js';
export { analyzePreviewUrl, isPreviewUrlReachable } from './preview-url-analyzer.js';
export { analyzePreviewRender, isApplicationRendered } from './preview-render-analyzer.js';
export { analyzePreviewInteraction, isPreviewInteractive } from './preview-interaction-analyzer.js';
export { analyzePreviewCapture } from './preview-capture-analyzer.js';
export { analyzePreviewManifest } from './preview-manifest-analyzer.js';
export { analyzePreviewLinkage } from './preview-linkage-analyzer.js';
export {
  activatePreviewProofGap,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS as PREVIEW_PROOF_GAP_ACTIVATOR_REPAIR_PASS,
} from './preview-proof-gap-activator.js';
