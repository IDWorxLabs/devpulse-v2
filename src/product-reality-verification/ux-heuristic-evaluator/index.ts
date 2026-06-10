/**
 * UX Heuristic Evaluator — public exports.
 */

import { resetUXHeuristicRegistryForTests } from './ux-heuristic-registry.js';
import { resetUXHeuristicCacheForTests } from './ux-heuristic-cache.js';
import { resetNavigationClarityAnalyzerForTests } from './navigation-clarity-analyzer.js';
import { resetFeatureDiscoverabilityAnalyzerForTests } from './feature-discoverability-analyzer.js';
import { resetActionClarityAnalyzerForTests } from './action-clarity-analyzer.js';
import { resetFeedbackQualityAnalyzerForTests } from './feedback-quality-analyzer.js';
import { resetSystemStatusVisibilityAnalyzerForTests } from './system-status-visibility-analyzer.js';
import { resetErrorPreventionAnalyzerForTests } from './error-prevention-analyzer.js';
import { resetUserControlAnalyzerForTests } from './user-control-analyzer.js';
import { resetCognitiveLoadAnalyzerForTests } from './cognitive-load-analyzer.js';
import { resetTrustClarityAnalyzerForTests } from './trust-clarity-analyzer.js';
import { resetWorkflowContinuityAnalyzerForTests } from './workflow-continuity-analyzer.js';
import { resetIntelligenceVisibilityAnalyzerForTests } from './intelligence-visibility-analyzer.js';
import { resetFounderUsabilityAnalyzerForTests } from './founder-usability-analyzer.js';
import { resetUXHeuristicAuthorityBuilderForTests } from './ux-heuristic-authority-builder.js';
import { resetUXHeuristicEvaluatorForTests as resetUXHeuristicEvaluationForTests } from './ux-heuristic-evaluator.js';
import { resetUXHeuristicHistoryForTests } from './bounded-history.js';
import { resetUXHeuristicReportBuilderForTests } from './ux-heuristic-report-builder.js';
import { resetUXHeuristicEngineOrchestrationForTests } from './ux-heuristic-engine.js';

export {
  UX_HEURISTIC_EVALUATOR_PASS_TOKEN,
  UX_HEURISTIC_EVALUATOR_PASS,
  UX_HEURISTIC_EVALUATOR_OWNER_MODULE,
  DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE,
  NAVIGATION_CLARITY_PASS,
  FEATURE_DISCOVERABILITY_PASS,
  ACTION_CLARITY_PASS,
  FEEDBACK_QUALITY_PASS,
  SYSTEM_STATUS_VISIBILITY_PASS,
  ERROR_PREVENTION_PASS,
  USER_CONTROL_PASS,
  COGNITIVE_LOAD_PASS,
  TRUST_CLARITY_PASS,
  WORKFLOW_CONTINUITY_PASS,
  INTELLIGENCE_VISIBILITY_PASS,
  FOUNDER_USABILITY_PASS,
  UX_HEURISTIC_REPORTING_PASS,
  UX_HEURISTIC_QUESTION_SIGNALS,
  isUXHeuristicQuestion,
  resolveUXHeuristicResult,
  clampScore,
} from './ux-heuristic-types.js';

export type {
  UXHeuristicResult,
  UXHeuristicRecord,
  NavigationClarityAnalysis,
  FeatureDiscoverabilityAnalysis,
  ActionClarityAnalysis,
  FeedbackQualityAnalysis,
  SystemStatusVisibilityAnalysis,
  ErrorPreventionAnalysis,
  UserControlAnalysis,
  CognitiveLoadAnalysis,
  TrustClarityAnalysis,
  WorkflowContinuityAnalysis,
  IntelligenceVisibilityAnalysis,
  FounderUsabilityAnalysis,
  UXHeuristicAuthority,
  UXHeuristicEvaluation,
  UXHeuristicHistoryEntry,
  UXHeuristicReport,
  UXHeuristicInput,
  UXHeuristicResultBundle,
  UXHeuristicRuntimeReport,
} from './ux-heuristic-types.js';

export { getUXHeuristicCacheStats, resetUXHeuristicCacheForTests } from './ux-heuristic-cache.js';

export {
  registerUXHeuristicRecord,
  getUXHeuristicRecord,
  lookupUXHeuristicByProjectId,
  lookupUXHeuristicByWorkspaceId,
  lookupUXHeuristicByResult,
  listUXHeuristicRecords,
  getUXHeuristicRecordCount,
  resetUXHeuristicRegistryForTests,
} from './ux-heuristic-registry.js';

export {
  analyzeNavigationClarity,
  getNavigationAnalysisCount,
  resetNavigationClarityAnalyzerForTests,
} from './navigation-clarity-analyzer.js';
export type { NavigationClaritySnapshot } from './navigation-clarity-analyzer.js';

export {
  analyzeFeatureDiscoverability,
  getDiscoverabilityAnalysisCount,
  listBaseDiscoverableFeatures,
  resetFeatureDiscoverabilityAnalyzerForTests,
} from './feature-discoverability-analyzer.js';
export type { FeatureDiscoverabilitySnapshot } from './feature-discoverability-analyzer.js';

export {
  analyzeActionClarity,
  getActionClarityAnalysisCount,
  resetActionClarityAnalyzerForTests,
} from './action-clarity-analyzer.js';
export type { ActionClaritySnapshot } from './action-clarity-analyzer.js';

export {
  analyzeFeedbackQuality,
  getFeedbackAnalysisCount,
  resetFeedbackQualityAnalyzerForTests,
} from './feedback-quality-analyzer.js';
export type { FeedbackQualitySnapshot } from './feedback-quality-analyzer.js';

export {
  analyzeSystemStatusVisibility,
  getStatusVisibilityAnalysisCount,
  resetSystemStatusVisibilityAnalyzerForTests,
} from './system-status-visibility-analyzer.js';
export type { SystemStatusVisibilitySnapshot } from './system-status-visibility-analyzer.js';

export {
  analyzeErrorPrevention,
  getErrorPreventionAnalysisCount,
  resetErrorPreventionAnalyzerForTests,
} from './error-prevention-analyzer.js';
export type { ErrorPreventionSnapshot } from './error-prevention-analyzer.js';

export {
  analyzeUserControl,
  getUserControlAnalysisCount,
  resetUserControlAnalyzerForTests,
} from './user-control-analyzer.js';
export type { UserControlSnapshot } from './user-control-analyzer.js';

export {
  analyzeCognitiveLoad,
  getCognitiveLoadAnalysisCount,
  resetCognitiveLoadAnalyzerForTests,
} from './cognitive-load-analyzer.js';
export type { CognitiveLoadSnapshot } from './cognitive-load-analyzer.js';

export {
  analyzeTrustClarity,
  getTrustClarityAnalysisCount,
  resetTrustClarityAnalyzerForTests,
} from './trust-clarity-analyzer.js';
export type { TrustClaritySnapshot } from './trust-clarity-analyzer.js';

export {
  analyzeWorkflowContinuity,
  getWorkflowContinuityAnalysisCount,
  resetWorkflowContinuityAnalyzerForTests,
} from './workflow-continuity-analyzer.js';
export type { WorkflowContinuitySnapshot } from './workflow-continuity-analyzer.js';

export {
  analyzeIntelligenceVisibility,
  getIntelligenceVisibilityAnalysisCount,
  resetIntelligenceVisibilityAnalyzerForTests,
} from './intelligence-visibility-analyzer.js';
export type { IntelligenceVisibilitySnapshot } from './intelligence-visibility-analyzer.js';

export {
  analyzeFounderUsability,
  getFounderUsabilityAnalysisCount,
  resetFounderUsabilityAnalyzerForTests,
} from './founder-usability-analyzer.js';
export type { FounderUsabilitySnapshot } from './founder-usability-analyzer.js';

export {
  buildUXHeuristicAuthority,
  getAuthorityBuildCount,
  resetUXHeuristicAuthorityBuilderForTests,
} from './ux-heuristic-authority-builder.js';

export {
  evaluateUXHeuristic,
  getEvaluationCount,
  resetUXHeuristicEvaluatorForTests as resetUXHeuristicEvaluationForTests,
} from './ux-heuristic-evaluator.js';

export {
  recordUXHeuristicHistory,
  getUXHeuristicHistory,
  getUXHeuristicHistorySize,
  clearUXHeuristicHistory,
  resetUXHeuristicHistoryForTests,
} from './bounded-history.js';

export {
  generateUXHeuristicReport,
  getReportCount,
  resetUXHeuristicReportBuilderForTests,
} from './ux-heuristic-report-builder.js';

export {
  getDevPulseV2UXHeuristicEvaluator,
  registerUXHeuristicEvaluatorWithSurface,
  registerUXHeuristicEvaluatorWithVisualQAEngine,
  registerUXHeuristicEvaluatorWithFoundation,
  registerUXHeuristicEvaluatorWithCapabilityRegistry,
  registerUXHeuristicEvaluatorWithFindPanel,
  registerUXHeuristicEvaluatorWithUvl,
  evaluateUXHeuristicEngine,
  getUXHeuristicRuntimeReport,
} from './ux-heuristic-engine.js';

export type { UXHeuristicSurfaceSnapshot } from './ux-heuristic-engine.js';

export function resetUXHeuristicEvaluatorForTests(): void {
  resetUXHeuristicRegistryForTests();
  resetUXHeuristicCacheForTests();
  resetNavigationClarityAnalyzerForTests();
  resetFeatureDiscoverabilityAnalyzerForTests();
  resetActionClarityAnalyzerForTests();
  resetFeedbackQualityAnalyzerForTests();
  resetSystemStatusVisibilityAnalyzerForTests();
  resetErrorPreventionAnalyzerForTests();
  resetUserControlAnalyzerForTests();
  resetCognitiveLoadAnalyzerForTests();
  resetTrustClarityAnalyzerForTests();
  resetWorkflowContinuityAnalyzerForTests();
  resetIntelligenceVisibilityAnalyzerForTests();
  resetFounderUsabilityAnalyzerForTests();
  resetUXHeuristicAuthorityBuilderForTests();
  resetUXHeuristicEvaluationForTests();
  resetUXHeuristicHistoryForTests();
  resetUXHeuristicReportBuilderForTests();
  resetUXHeuristicEngineOrchestrationForTests();
}
