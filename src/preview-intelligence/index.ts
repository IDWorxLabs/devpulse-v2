/**
 * DevPulse V2 Phase 16.2 — Preview Intelligence public API.
 */

export {
  PREVIEW_INTELLIGENCE_PASS_TOKEN,
  PREVIEW_INTELLIGENCE_OWNER_MODULE,
  PREVIEW_INTELLIGENCE_QUESTION_SIGNALS,
  FORBIDDEN_PREVIEW_INTELLIGENCE_DUPLICATES,
  ALL_OBSERVATION_ITEMS,
  TRACKED_PREVIEW_CAPABILITIES,
  isPreviewIntelligenceQuestion,
  isPreviewIntelligenceAdvisoryQuestion,
  isDuplicatePreviewIntelligenceQuestion,
  type PreviewReadinessLevel,
  type PreviewLimitationType,
  type ObservationItemType,
  type PreviewCapabilitySummary,
  type PreviewLimitationRecord,
  type PreviewObservationPlanItem,
  type PreviewIntelligenceReport,
  type PreviewIntelligenceDiagnostics,
  type AnalyzePreviewIntelligenceInput,
  type AnalyzePreviewIntelligenceResult,
} from './types.js';

export {
  parsePreviewIntelligenceQuery,
  resetPreviewIntelligenceRequestCounterForTests,
  type ParsedPreviewIntelligenceQuery,
} from './preview-intelligence-request-parser.js';

export { analyzePreviewContext, type PreviewContextAnalysis } from './preview-context-analyzer.js';
export { evaluatePreviewReadiness, type PreviewReadinessResult } from './preview-readiness-engine.js';
export { analyzePreviewCapabilities } from './preview-capability-analyzer.js';
export { analyzePreviewLimitations } from './preview-limitation-analyzer.js';
export { planPreviewObservations } from './preview-observation-planner.js';

export {
  buildPreviewIntelligenceReport,
  composePreviewIntelligenceResponse,
  buildPreviewIntelligenceFailureContext,
  nextPreviewIntelligenceId,
  resetPreviewIntelligenceReportCounterForTests,
  type PreviewIntelligenceFailureContext,
} from './preview-intelligence-report.js';

export {
  getPreviewIntelligenceDiagnostics,
  updatePreviewIntelligenceDiagnostics,
  resetPreviewIntelligenceDiagnostics,
  previewIntelligenceKey,
} from './preview-intelligence-diagnostics.js';

export {
  analyzePreviewIntelligence,
  processPreviewIntelligenceRequest,
  getPreviewIntelligenceContext,
} from './preview-intelligence.js';

export function getDevPulseV2PreviewIntelligence(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_preview_intelligence',
    passToken: 'PREVIEW_INTELLIGENCE_V1_PASS',
    phase: 16.2,
    extensionOnly: true,
  };
}
