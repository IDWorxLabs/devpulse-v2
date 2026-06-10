/**
 * Live Preview Gatekeeper — public exports.
 */

import { resetLivePreviewRegistryForTests } from './live-preview-registry.js';
import { resetLivePreviewCacheForTests } from './live-preview-cache.js';
import { resetPreviewContextBuilderForTests } from './preview-context-builder.js';
import { resetPreviewVisibilityAnalyzerForTests } from './preview-visibility-analyzer.js';
import { resetPreviewUnderstandabilityAnalyzerForTests } from './preview-understandability-analyzer.js';
import { resetPreviewStateMeaningfulnessAnalyzerForTests } from './preview-state-meaningfulness-analyzer.js';
import { resetFounderVerificationSupportAnalyzerForTests } from './founder-verification-support-analyzer.js';
import { resetResponsivePreviewSupportAnalyzerForTests } from './responsive-preview-support-analyzer.js';
import { resetPreviewUnavailableHonestyAnalyzerForTests } from './preview-unavailable-honesty-analyzer.js';
import { resetPreviewMisleadingRiskAnalyzerForTests } from './preview-misleading-risk-analyzer.js';
import { resetPreviewNextActionAnalyzerForTests } from './preview-next-action-analyzer.js';
import { resetPreviewReportConnectionAnalyzerForTests } from './preview-report-connection-analyzer.js';
import { resetProductReadinessPreviewAnalyzerForTests } from './product-readiness-preview-analyzer.js';
import { resetLivePreviewAuthorityBuilderForTests } from './live-preview-authority-builder.js';
import { resetLivePreviewEvaluationForTests } from './live-preview-evaluator.js';
import { resetLivePreviewHistoryForTests } from './bounded-history.js';
import { resetLivePreviewReportBuilderForTests } from './live-preview-report-builder.js';
import { resetLivePreviewGatekeeperOrchestrationForTests } from './live-preview-gatekeeper.js';

export {
  LIVE_PREVIEW_GATEKEEPER_PASS_TOKEN,
  LIVE_PREVIEW_GATEKEEPER_PASS,
  LIVE_PREVIEW_GATEKEEPER_OWNER_MODULE,
  DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE,
  PREVIEW_CONTEXT_PASS,
  PREVIEW_VISIBILITY_PASS,
  PREVIEW_UNDERSTANDABILITY_PASS,
  PREVIEW_STATE_MEANINGFULNESS_PASS,
  FOUNDER_VERIFICATION_SUPPORT_PASS,
  RESPONSIVE_PREVIEW_SUPPORT_PASS,
  PREVIEW_UNAVAILABLE_HONESTY_PASS,
  PREVIEW_MISLEADING_RISK_PASS,
  PREVIEW_NEXT_ACTION_PASS,
  PREVIEW_REPORT_CONNECTION_PASS,
  PRODUCT_READINESS_PREVIEW_PASS,
  LIVE_PREVIEW_REPORTING_PASS,
  LIVE_PREVIEW_QUESTION_SIGNALS,
  isLivePreviewGatekeeperQuestion,
  resolveLivePreviewResult,
  clampScore,
} from './live-preview-types.js';

export type {
  LivePreviewResult,
  PreviewContextType,
  PreviewContext,
  LivePreviewRecord,
  PreviewVisibilityAnalysis,
  PreviewUnderstandabilityAnalysis,
  PreviewStateMeaningfulnessAnalysis,
  FounderVerificationSupportAnalysis,
  ResponsivePreviewSupportAnalysis,
  PreviewUnavailableHonestyAnalysis,
  PreviewMisleadingRiskAnalysis,
  PreviewNextActionAnalysis,
  PreviewReportConnectionAnalysis,
  ProductReadinessPreviewAnalysis,
  LivePreviewAuthority,
  LivePreviewEvaluation,
  LivePreviewHistoryEntry,
  LivePreviewReport,
  LivePreviewInput,
  LivePreviewResultBundle,
  LivePreviewRuntimeReport,
} from './live-preview-types.js';

export { getLivePreviewCacheStats, resetLivePreviewCacheForTests } from './live-preview-cache.js';

export {
  registerLivePreviewRecord,
  getLivePreviewRecord,
  lookupLivePreviewByProjectId,
  lookupLivePreviewByResult,
  listLivePreviewRecords,
  getLivePreviewRecordCount,
  resetLivePreviewRegistryForTests,
} from './live-preview-registry.js';

export {
  buildPreviewContext,
  listPreviewContextTypes,
  getContextBuildCount,
  resetPreviewContextBuilderForTests,
} from './preview-context-builder.js';

export {
  analyzePreviewVisibility,
  getPreviewVisibilityAnalysisCount,
  resetPreviewVisibilityAnalyzerForTests,
} from './preview-visibility-analyzer.js';
export type { PreviewVisibilitySnapshot } from './preview-visibility-analyzer.js';

export {
  analyzePreviewUnderstandability,
  getPreviewUnderstandabilityAnalysisCount,
  resetPreviewUnderstandabilityAnalyzerForTests,
} from './preview-understandability-analyzer.js';
export type { PreviewUnderstandabilitySnapshot } from './preview-understandability-analyzer.js';

export {
  analyzePreviewStateMeaningfulness,
  getPreviewMeaningfulnessAnalysisCount,
  resetPreviewStateMeaningfulnessAnalyzerForTests,
} from './preview-state-meaningfulness-analyzer.js';
export type { PreviewStateMeaningfulnessSnapshot } from './preview-state-meaningfulness-analyzer.js';

export {
  analyzeFounderVerificationSupport,
  getFounderVerificationAnalysisCount,
  resetFounderVerificationSupportAnalyzerForTests,
} from './founder-verification-support-analyzer.js';
export type { FounderVerificationSupportSnapshot } from './founder-verification-support-analyzer.js';

export {
  analyzeResponsivePreviewSupport,
  getResponsivePreviewAnalysisCount,
  resetResponsivePreviewSupportAnalyzerForTests,
} from './responsive-preview-support-analyzer.js';
export type { ResponsivePreviewSupportSnapshot } from './responsive-preview-support-analyzer.js';

export {
  analyzePreviewUnavailableHonesty,
  getUnavailableHonestyAnalysisCount,
  resetPreviewUnavailableHonestyAnalyzerForTests,
} from './preview-unavailable-honesty-analyzer.js';
export type { PreviewUnavailableHonestySnapshot } from './preview-unavailable-honesty-analyzer.js';

export {
  analyzePreviewMisleadingRisk,
  getMisleadingRiskAnalysisCount,
  resetPreviewMisleadingRiskAnalyzerForTests,
} from './preview-misleading-risk-analyzer.js';
export type { PreviewMisleadingRiskSnapshot } from './preview-misleading-risk-analyzer.js';

export {
  analyzePreviewNextAction,
  getPreviewNextActionAnalysisCount,
  resetPreviewNextActionAnalyzerForTests,
} from './preview-next-action-analyzer.js';
export type { PreviewNextActionSnapshot } from './preview-next-action-analyzer.js';

export {
  analyzePreviewReportConnection,
  getReportConnectionAnalysisCount,
  resetPreviewReportConnectionAnalyzerForTests,
} from './preview-report-connection-analyzer.js';
export type { PreviewReportConnectionSnapshot } from './preview-report-connection-analyzer.js';

export {
  analyzeProductReadinessPreview,
  getProductReadinessAnalysisCount,
  resetProductReadinessPreviewAnalyzerForTests,
} from './product-readiness-preview-analyzer.js';
export type { ProductReadinessPreviewSnapshot } from './product-readiness-preview-analyzer.js';

export {
  buildLivePreviewAuthority,
  getAuthorityBuildCount,
  resetLivePreviewAuthorityBuilderForTests,
} from './live-preview-authority-builder.js';

export {
  evaluateLivePreview,
  getEvaluationCount,
  resetLivePreviewEvaluationForTests,
} from './live-preview-evaluator.js';

export {
  recordLivePreviewHistory,
  getLivePreviewHistory,
  getLivePreviewHistorySize,
  clearLivePreviewHistory,
  resetLivePreviewHistoryForTests,
} from './bounded-history.js';

export {
  generateLivePreviewReport,
  getReportCount,
  resetLivePreviewReportBuilderForTests,
} from './live-preview-report-builder.js';

export {
  getDevPulseV2LivePreviewGatekeeper,
  registerLivePreviewGatekeeperWithSurface,
  registerLivePreviewGatekeeperWithFirstImpressionJudge,
  registerLivePreviewGatekeeperWithLivePreviewRuntime,
  registerLivePreviewGatekeeperWithFoundation,
  registerLivePreviewGatekeeperWithCapabilityRegistry,
  registerLivePreviewGatekeeperWithFindPanel,
  registerLivePreviewGatekeeperWithUvl,
  evaluateLivePreviewGatekeeper,
  getLivePreviewRuntimeReport,
} from './live-preview-gatekeeper.js';

export type { LivePreviewSurfaceSnapshot } from './live-preview-gatekeeper.js';

export function resetLivePreviewGatekeeperForTests(): void {
  resetLivePreviewRegistryForTests();
  resetLivePreviewCacheForTests();
  resetPreviewContextBuilderForTests();
  resetPreviewVisibilityAnalyzerForTests();
  resetPreviewUnderstandabilityAnalyzerForTests();
  resetPreviewStateMeaningfulnessAnalyzerForTests();
  resetFounderVerificationSupportAnalyzerForTests();
  resetResponsivePreviewSupportAnalyzerForTests();
  resetPreviewUnavailableHonestyAnalyzerForTests();
  resetPreviewMisleadingRiskAnalyzerForTests();
  resetPreviewNextActionAnalyzerForTests();
  resetPreviewReportConnectionAnalyzerForTests();
  resetProductReadinessPreviewAnalyzerForTests();
  resetLivePreviewAuthorityBuilderForTests();
  resetLivePreviewEvaluationForTests();
  resetLivePreviewHistoryForTests();
  resetLivePreviewReportBuilderForTests();
  resetLivePreviewGatekeeperOrchestrationForTests();
}
