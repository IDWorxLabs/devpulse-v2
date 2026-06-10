/**
 * First-Impression Judge — public exports.
 */

import { resetFirstImpressionRegistryForTests } from './first-impression-registry.js';
import { resetFirstImpressionCacheForTests } from './first-impression-cache.js';
import { resetFirstVisitContextBuilderForTests } from './first-visit-context-builder.js';
import { resetProductClarityAnalyzerForTests } from './product-clarity-analyzer.js';
import { resetIntelligencePerceptionAnalyzerForTests } from './intelligence-perception-analyzer.js';
import { resetTrustworthinessPerceptionAnalyzerForTests } from './trustworthiness-perception-analyzer.js';
import { resetVisualConfidenceAnalyzerForTests } from './visual-confidence-analyzer.js';
import { resetFounderUsefulnessAnalyzerForTests } from './founder-usefulness-analyzer.js';
import { resetPremiumFeelAnalyzerForTests } from './premium-feel-analyzer.js';
import { resetActionReadinessAnalyzerForTests } from './action-readiness-analyzer.js';
import { resetProductIdentityAnalyzerForTests } from './product-identity-analyzer.js';
import { resetEmotionalConfidenceAnalyzerForTests } from './emotional-confidence-analyzer.js';
import { resetLaunchReadinessPerceptionAnalyzerForTests } from './launch-readiness-perception-analyzer.js';
import { resetFirstImpressionAuthorityBuilderForTests } from './first-impression-authority-builder.js';
import { resetFirstImpressionEvaluationForTests } from './first-impression-evaluator.js';
import { resetFirstImpressionHistoryForTests } from './bounded-history.js';
import { resetFirstImpressionReportBuilderForTests } from './first-impression-report-builder.js';
import { resetFirstImpressionJudgeOrchestrationForTests } from './first-impression-judge.js';

export {
  FIRST_IMPRESSION_JUDGE_PASS_TOKEN,
  FIRST_IMPRESSION_JUDGE_PASS,
  FIRST_IMPRESSION_JUDGE_OWNER_MODULE,
  DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE,
  FIRST_VISIT_CONTEXT_PASS,
  PRODUCT_CLARITY_PASS,
  INTELLIGENCE_PERCEPTION_PASS,
  TRUSTWORTHINESS_PERCEPTION_PASS,
  VISUAL_CONFIDENCE_PASS,
  FOUNDER_USEFULNESS_PASS,
  PREMIUM_FEEL_PASS,
  ACTION_READINESS_PASS,
  PRODUCT_IDENTITY_PASS,
  EMOTIONAL_CONFIDENCE_PASS,
  LAUNCH_READINESS_PERCEPTION_PASS,
  FIRST_IMPRESSION_REPORTING_PASS,
  FIRST_IMPRESSION_QUESTION_SIGNALS,
  isFirstImpressionQuestion,
  resolveFirstImpressionResult,
  clampScore,
} from './first-impression-types.js';

export type {
  FirstImpressionResult,
  FirstVisitPersona,
  FirstVisitContext,
  FirstImpressionRecord,
  ProductClarityAnalysis,
  IntelligencePerceptionAnalysis,
  TrustworthinessPerceptionAnalysis,
  VisualConfidenceAnalysis,
  FounderUsefulnessAnalysis,
  PremiumFeelAnalysis,
  ActionReadinessAnalysis,
  ProductIdentityAnalysis,
  EmotionalConfidenceAnalysis,
  LaunchReadinessPerceptionAnalysis,
  FirstImpressionAuthority,
  FirstImpressionEvaluation,
  FirstImpressionHistoryEntry,
  FirstImpressionReport,
  FirstImpressionInput,
  FirstImpressionResultBundle,
  FirstImpressionRuntimeReport,
} from './first-impression-types.js';

export { getFirstImpressionCacheStats, resetFirstImpressionCacheForTests } from './first-impression-cache.js';

export {
  registerFirstImpressionRecord,
  getFirstImpressionRecord,
  lookupFirstImpressionByProjectId,
  lookupFirstImpressionByResult,
  listFirstImpressionRecords,
  getFirstImpressionRecordCount,
  resetFirstImpressionRegistryForTests,
} from './first-impression-registry.js';

export {
  buildFirstVisitContext,
  listFirstVisitPersonas,
  getContextBuildCount,
  resetFirstVisitContextBuilderForTests,
} from './first-visit-context-builder.js';

export {
  analyzeProductClarity,
  getProductClarityAnalysisCount,
  resetProductClarityAnalyzerForTests,
} from './product-clarity-analyzer.js';
export type { ProductClaritySnapshot } from './product-clarity-analyzer.js';

export {
  analyzeIntelligencePerception,
  getIntelligencePerceptionAnalysisCount,
  resetIntelligencePerceptionAnalyzerForTests,
} from './intelligence-perception-analyzer.js';
export type { IntelligencePerceptionSnapshot } from './intelligence-perception-analyzer.js';

export {
  analyzeTrustworthinessPerception,
  getTrustworthinessAnalysisCount,
  resetTrustworthinessPerceptionAnalyzerForTests,
} from './trustworthiness-perception-analyzer.js';
export type { TrustworthinessPerceptionSnapshot } from './trustworthiness-perception-analyzer.js';

export {
  analyzeVisualConfidence,
  getVisualConfidenceAnalysisCount,
  resetVisualConfidenceAnalyzerForTests,
} from './visual-confidence-analyzer.js';
export type { VisualConfidenceSnapshot } from './visual-confidence-analyzer.js';

export {
  analyzeFounderUsefulness,
  getFounderUsefulnessAnalysisCount,
  resetFounderUsefulnessAnalyzerForTests,
} from './founder-usefulness-analyzer.js';
export type { FounderUsefulnessSnapshot } from './founder-usefulness-analyzer.js';

export {
  analyzePremiumFeel,
  getPremiumFeelAnalysisCount,
  resetPremiumFeelAnalyzerForTests,
} from './premium-feel-analyzer.js';
export type { PremiumFeelSnapshot } from './premium-feel-analyzer.js';

export {
  analyzeActionReadiness,
  getActionReadinessAnalysisCount,
  resetActionReadinessAnalyzerForTests,
} from './action-readiness-analyzer.js';
export type { ActionReadinessSnapshot } from './action-readiness-analyzer.js';

export {
  analyzeProductIdentity,
  getProductIdentityAnalysisCount,
  resetProductIdentityAnalyzerForTests,
} from './product-identity-analyzer.js';
export type { ProductIdentitySnapshot } from './product-identity-analyzer.js';

export {
  analyzeEmotionalConfidence,
  getEmotionalConfidenceAnalysisCount,
  resetEmotionalConfidenceAnalyzerForTests,
} from './emotional-confidence-analyzer.js';
export type { EmotionalConfidenceSnapshot } from './emotional-confidence-analyzer.js';

export {
  analyzeLaunchReadinessPerception,
  getLaunchReadinessAnalysisCount,
  resetLaunchReadinessPerceptionAnalyzerForTests,
} from './launch-readiness-perception-analyzer.js';
export type { LaunchReadinessPerceptionSnapshot } from './launch-readiness-perception-analyzer.js';

export {
  buildFirstImpressionAuthority,
  getAuthorityBuildCount,
  resetFirstImpressionAuthorityBuilderForTests,
} from './first-impression-authority-builder.js';

export {
  evaluateFirstImpression,
  getEvaluationCount,
  resetFirstImpressionEvaluationForTests,
} from './first-impression-evaluator.js';

export {
  recordFirstImpressionHistory,
  getFirstImpressionHistory,
  getFirstImpressionHistorySize,
  clearFirstImpressionHistory,
  resetFirstImpressionHistoryForTests,
} from './bounded-history.js';

export {
  generateFirstImpressionReport,
  getReportCount,
  resetFirstImpressionReportBuilderForTests,
} from './first-impression-report-builder.js';

export {
  getDevPulseV2FirstImpressionJudge,
  registerFirstImpressionJudgeWithSurface,
  registerFirstImpressionJudgeWithUXHeuristicEvaluator,
  registerFirstImpressionJudgeWithFoundation,
  registerFirstImpressionJudgeWithCapabilityRegistry,
  registerFirstImpressionJudgeWithFindPanel,
  registerFirstImpressionJudgeWithUvl,
  evaluateFirstImpressionJudge,
  getFirstImpressionRuntimeReport,
} from './first-impression-judge.js';

export type { FirstImpressionSurfaceSnapshot } from './first-impression-judge.js';

export function resetFirstImpressionJudgeForTests(): void {
  resetFirstImpressionRegistryForTests();
  resetFirstImpressionCacheForTests();
  resetFirstVisitContextBuilderForTests();
  resetProductClarityAnalyzerForTests();
  resetIntelligencePerceptionAnalyzerForTests();
  resetTrustworthinessPerceptionAnalyzerForTests();
  resetVisualConfidenceAnalyzerForTests();
  resetFounderUsefulnessAnalyzerForTests();
  resetPremiumFeelAnalyzerForTests();
  resetActionReadinessAnalyzerForTests();
  resetProductIdentityAnalyzerForTests();
  resetEmotionalConfidenceAnalyzerForTests();
  resetLaunchReadinessPerceptionAnalyzerForTests();
  resetFirstImpressionAuthorityBuilderForTests();
  resetFirstImpressionEvaluationForTests();
  resetFirstImpressionHistoryForTests();
  resetFirstImpressionReportBuilderForTests();
  resetFirstImpressionJudgeOrchestrationForTests();
}
