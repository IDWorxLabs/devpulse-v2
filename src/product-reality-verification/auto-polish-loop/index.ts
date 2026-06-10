/**
 * Auto-Polish Loop — public exports.
 */

import { resetAutoPolishRegistryForTests } from './auto-polish-registry.js';
import { resetAutoPolishCacheForTests } from './auto-polish-cache.js';
import { resetPolishOpportunityCounterForTests } from './polish-opportunity-model.js';
import { resetVisualPolishAnalyzerForTests } from './visual-polish-analyzer.js';
import { resetUXPolishAnalyzerForTests } from './ux-polish-analyzer.js';
import { resetResponsivePolishAnalyzerForTests } from './responsive-polish-analyzer.js';
import { resetPreviewPolishAnalyzerForTests } from './preview-polish-analyzer.js';
import { resetDiscoverabilityPolishAnalyzerForTests } from './discoverability-polish-analyzer.js';
import { resetFounderUsabilityPolishAnalyzerForTests } from './founder-usability-polish-analyzer.js';
import { resetTrustPolishAnalyzerForTests } from './trust-polish-analyzer.js';
import { resetIntelligenceVisibilityPolishAnalyzerForTests } from './intelligence-visibility-polish-analyzer.js';
import { resetWorkflowPolishAnalyzerForTests } from './workflow-polish-analyzer.js';
import { resetProductCoherencePolishAnalyzerForTests } from './product-coherence-polish-analyzer.js';
import { resetPolishPriorityAnalyzerForTests } from './polish-priority-analyzer.js';
import { resetPolishRoadmapBuilderForTests } from './polish-roadmap-builder.js';
import { resetAutoPolishAuthorityBuilderForTests } from './auto-polish-authority-builder.js';
import { resetAutoPolishEvaluationForTests } from './auto-polish-evaluator.js';
import { resetAutoPolishHistoryForTests } from './bounded-history.js';
import { resetAutoPolishReportBuilderForTests } from './auto-polish-report-builder.js';
import { resetAutoPolishLoopOrchestrationForTests } from './auto-polish-loop.js';

export {
  AUTO_POLISH_LOOP_PASS_TOKEN,
  AUTO_POLISH_LOOP_PASS,
  AUTO_POLISH_LOOP_OWNER_MODULE,
  DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE,
  MAX_POLISH_OPPORTUNITIES,
  VISUAL_POLISH_PASS,
  UX_POLISH_PASS,
  RESPONSIVE_POLISH_PASS,
  PREVIEW_POLISH_PASS,
  DISCOVERABILITY_POLISH_PASS,
  FOUNDER_USABILITY_POLISH_PASS,
  TRUST_POLISH_PASS,
  INTELLIGENCE_VISIBILITY_POLISH_PASS,
  WORKFLOW_POLISH_PASS,
  PRODUCT_COHERENCE_POLISH_PASS,
  POLISH_PRIORITY_PASS,
  POLISH_ROADMAP_PASS,
  AUTO_POLISH_REPORTING_PASS,
  AUTO_POLISH_QUESTION_SIGNALS,
  isAutoPolishQuestion,
  resolveAutoPolishResult,
  clampScore,
} from './auto-polish-types.js';

export type {
  AutoPolishResult,
  ImpactLevel,
  PolishPriority,
  PolishCategory,
  PolishOpportunity,
  AutoPolishRecord,
  VisualPolishAnalysis,
  UXPolishAnalysis,
  ResponsivePolishAnalysis,
  PreviewPolishAnalysis,
  DiscoverabilityPolishAnalysis,
  FounderUsabilityPolishAnalysis,
  TrustPolishAnalysis,
  IntelligenceVisibilityPolishAnalysis,
  WorkflowPolishAnalysis,
  ProductCoherencePolishAnalysis,
  PolishPriorityAnalysis,
  PolishRoadmap,
  AutoPolishAuthority,
  AutoPolishEvaluation,
  AutoPolishHistoryEntry,
  AutoPolishReport,
  AutoPolishInput,
  AutoPolishResultBundle,
  AutoPolishRuntimeReport,
} from './auto-polish-types.js';

export {
  createPolishOpportunity,
  impactToPriority,
  boundOpportunities,
  mergeBoundedOpportunities,
  countCriticalOpportunities,
  MAX_OPPORTUNITIES_PER_ANALYZER,
  resetPolishOpportunityCounterForTests,
} from './polish-opportunity-model.js';

export { getAutoPolishCacheStats, resetAutoPolishCacheForTests } from './auto-polish-cache.js';

export {
  registerAutoPolishRecord,
  getAutoPolishRecord,
  lookupAutoPolishByProjectId,
  lookupAutoPolishByResult,
  listAutoPolishRecords,
  getAutoPolishRecordCount,
  resetAutoPolishRegistryForTests,
} from './auto-polish-registry.js';

export {
  analyzeVisualPolish,
  getVisualPolishAnalysisCount,
  resetVisualPolishAnalyzerForTests,
} from './visual-polish-analyzer.js';
export type { VisualPolishUpstream } from './visual-polish-analyzer.js';

export {
  analyzeUXPolish,
  getUXPolishAnalysisCount,
  resetUXPolishAnalyzerForTests,
} from './ux-polish-analyzer.js';
export type { UXPolishUpstream } from './ux-polish-analyzer.js';

export {
  analyzeResponsivePolish,
  getResponsivePolishAnalysisCount,
  resetResponsivePolishAnalyzerForTests,
} from './responsive-polish-analyzer.js';
export type { ResponsivePolishUpstream } from './responsive-polish-analyzer.js';

export {
  analyzePreviewPolish,
  getPreviewPolishAnalysisCount,
  resetPreviewPolishAnalyzerForTests,
} from './preview-polish-analyzer.js';
export type { PreviewPolishUpstream } from './preview-polish-analyzer.js';

export {
  analyzeDiscoverabilityPolish,
  getDiscoverabilityPolishAnalysisCount,
  resetDiscoverabilityPolishAnalyzerForTests,
} from './discoverability-polish-analyzer.js';
export type { DiscoverabilityPolishSnapshot } from './discoverability-polish-analyzer.js';

export {
  analyzeFounderUsabilityPolish,
  getFounderUsabilityPolishAnalysisCount,
  resetFounderUsabilityPolishAnalyzerForTests,
} from './founder-usability-polish-analyzer.js';
export type { FounderUsabilityPolishUpstream } from './founder-usability-polish-analyzer.js';

export {
  analyzeTrustPolish,
  getTrustPolishAnalysisCount,
  resetTrustPolishAnalyzerForTests,
} from './trust-polish-analyzer.js';
export type { TrustPolishUpstream } from './trust-polish-analyzer.js';

export {
  analyzeIntelligenceVisibilityPolish,
  getIntelligenceVisibilityPolishAnalysisCount,
  resetIntelligenceVisibilityPolishAnalyzerForTests,
} from './intelligence-visibility-polish-analyzer.js';
export type { IntelligenceVisibilityPolishUpstream } from './intelligence-visibility-polish-analyzer.js';

export {
  analyzeWorkflowPolish,
  getWorkflowPolishAnalysisCount,
  resetWorkflowPolishAnalyzerForTests,
} from './workflow-polish-analyzer.js';
export type { WorkflowPolishUpstream } from './workflow-polish-analyzer.js';

export {
  analyzeProductCoherencePolish,
  getProductCoherencePolishAnalysisCount,
  resetProductCoherencePolishAnalyzerForTests,
} from './product-coherence-polish-analyzer.js';
export type { ProductCoherencePolishUpstream } from './product-coherence-polish-analyzer.js';

export {
  analyzePolishPriority,
  getPriorityAnalysisCount,
  resetPolishPriorityAnalyzerForTests,
} from './polish-priority-analyzer.js';

export {
  buildPolishRoadmap,
  getRoadmapBuildCount,
  resetPolishRoadmapBuilderForTests,
} from './polish-roadmap-builder.js';

export {
  buildAutoPolishAuthority,
  getAuthorityBuildCount,
  resetAutoPolishAuthorityBuilderForTests,
} from './auto-polish-authority-builder.js';

export {
  evaluateAutoPolish,
  getEvaluationCount,
  resetAutoPolishEvaluationForTests,
} from './auto-polish-evaluator.js';

export {
  recordAutoPolishHistory,
  getAutoPolishHistory,
  getAutoPolishHistorySize,
  clearAutoPolishHistory,
  resetAutoPolishHistoryForTests,
} from './bounded-history.js';

export {
  generateAutoPolishReport,
  getReportCount,
  resetAutoPolishReportBuilderForTests,
} from './auto-polish-report-builder.js';

export {
  getDevPulseV2AutoPolishLoop,
  registerAutoPolishLoopWithSurface,
  registerAutoPolishLoopWithFoundation,
  registerAutoPolishLoopWithCapabilityRegistry,
  registerAutoPolishLoopWithFindPanel,
  registerAutoPolishLoopWithUvl,
  registerAutoPolishLoopWithProductRealityChain,
  evaluateAutoPolishLoop,
  getAutoPolishLoopRuntimeReport,
} from './auto-polish-loop.js';

export type { AutoPolishSurfaceSnapshot } from './auto-polish-loop.js';

export function resetAutoPolishLoopForTests(): void {
  resetAutoPolishRegistryForTests();
  resetAutoPolishCacheForTests();
  resetPolishOpportunityCounterForTests();
  resetVisualPolishAnalyzerForTests();
  resetUXPolishAnalyzerForTests();
  resetResponsivePolishAnalyzerForTests();
  resetPreviewPolishAnalyzerForTests();
  resetDiscoverabilityPolishAnalyzerForTests();
  resetFounderUsabilityPolishAnalyzerForTests();
  resetTrustPolishAnalyzerForTests();
  resetIntelligenceVisibilityPolishAnalyzerForTests();
  resetWorkflowPolishAnalyzerForTests();
  resetProductCoherencePolishAnalyzerForTests();
  resetPolishPriorityAnalyzerForTests();
  resetPolishRoadmapBuilderForTests();
  resetAutoPolishAuthorityBuilderForTests();
  resetAutoPolishEvaluationForTests();
  resetAutoPolishHistoryForTests();
  resetAutoPolishReportBuilderForTests();
  resetAutoPolishLoopOrchestrationForTests();
}
