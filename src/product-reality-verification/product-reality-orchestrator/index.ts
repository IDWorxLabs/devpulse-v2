/**
 * Product Reality Orchestrator — public exports.
 */

import { resetProductRealityRegistryForTests } from './product-reality-registry.js';
import { resetProductRealityCacheForTests } from './product-reality-cache.js';
import { resetProductRealityModelCountersForTests } from './product-reality-model.js';
import { resetExperienceAggregationBuilderForTests } from './experience-aggregation-builder.js';
import { resetAuthorityConflictDetectorForTests } from './authority-conflict-detector.js';
import { resetLaunchBlockerAnalyzerForTests } from './launch-blocker-analyzer.js';
import { resetReleaseReadinessAnalyzerForTests } from './release-readiness-analyzer.js';
import { resetFounderPriorityAnalyzerForTests } from './founder-priority-analyzer.js';
import { resetProductRealityRoadmapBuilderForTests } from './roadmap-builder.js';
import { resetProductRealityAuthorityBuilderForTests } from './product-reality-authority-builder.js';
import { resetProductRealityEvaluationForTests } from './product-reality-evaluator.js';
import { resetProductRealityHistoryForTests } from './bounded-history.js';
import { resetProductRealityReportBuilderForTests } from './product-reality-report-builder.js';
import { resetProductRealityOrchestratorForTests as resetOrchestrationForTests } from './product-reality-orchestrator.js';

export {
  PRODUCT_REALITY_ORCHESTRATOR_PASS_TOKEN,
  PRODUCT_REALITY_ORCHESTRATOR_PASS,
  PRODUCT_REALITY_OWNER_MODULE,
  DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE,
  MAX_LAUNCH_BLOCKERS,
  MAX_AUTHORITY_CONFLICTS,
  MAX_FOUNDER_PRIORITIES,
  PRODUCT_REALITY_AGGREGATE_PASS,
  PRODUCT_REALITY_AUTHORITY_PASS,
  PRODUCT_REALITY_SCORING_PASS,
  PRODUCT_REALITY_VERDICT_PASS,
  PRODUCT_REALITY_REPORTING_PASS,
  PRODUCT_REALITY_ROADMAP_PASS,
  CONFLICT_DETECTION_PASS,
  BLOCKER_ANALYSIS_PASS,
  RELEASE_READINESS_PASS,
  FOUNDER_PRIORITY_PASS,
  PRODUCT_REALITY_QUESTION_SIGNALS,
  isProductRealityQuestion,
  resolveProductRealityVerdict,
  clampScore,
} from './product-reality-types.js';

export type {
  ProductRealityVerdict,
  ReleaseReadiness,
  ConflictSeverity,
  BlockerSeverity,
  PriorityTier,
  ResponsiveRealityReport,
  UpstreamReportBundle,
  ProductRealityAggregate,
  AuthorityConflict,
  ConflictDetectionResult,
  LaunchBlocker,
  BlockerAnalysisResult,
  ReleaseReadinessResult,
  FounderPriority,
  FounderPriorityResult,
  ProductRealityRoadmap,
  ProductRealityAuthority,
  ProductRealityScore,
  ProductRealityResult,
  ProductRealityRecord,
  ProductRealityEvaluation,
  ProductRealityHistoryEntry,
  ProductRealityReport,
  ProductRealityInput,
  ProductRealityResultBundle,
  ProductRealityRuntimeReport,
} from './product-reality-types.js';

export {
  createAuthorityConflict,
  createLaunchBlocker,
  createFounderPriority,
  boundList,
  mergeBounded,
  MAX_ITEMS_PER_ANALYZER,
  resetProductRealityModelCountersForTests,
} from './product-reality-model.js';

export { getProductRealityCacheStats, resetProductRealityCacheForTests } from './product-reality-cache.js';

export {
  registerProductRealityRecord,
  getProductRealityRecord,
  lookupProductRealityByProjectId,
  lookupProductRealityByVerdict,
  listProductRealityRecords,
  getProductRealityRecordCount,
  resetProductRealityRegistryForTests,
} from './product-reality-registry.js';

export {
  buildProductRealityAggregate,
  deriveResponsiveRealityReport,
  getAggregateBuildCount,
  resetExperienceAggregationBuilderForTests,
} from './experience-aggregation-builder.js';

export {
  detectAuthorityConflicts,
  getConflictDetectionCount,
  resetAuthorityConflictDetectorForTests,
} from './authority-conflict-detector.js';

export {
  analyzeLaunchBlockers,
  getBlockerAnalysisCount,
  resetLaunchBlockerAnalyzerForTests,
} from './launch-blocker-analyzer.js';

export {
  analyzeReleaseReadiness,
  getReleaseReadinessCount,
  resetReleaseReadinessAnalyzerForTests,
} from './release-readiness-analyzer.js';

export {
  analyzeFounderPriorities,
  getFounderPriorityCount,
  resetFounderPriorityAnalyzerForTests,
} from './founder-priority-analyzer.js';

export {
  buildProductRealityRoadmap,
  getRoadmapBuildCount,
  resetProductRealityRoadmapBuilderForTests,
} from './roadmap-builder.js';

export {
  buildProductRealityAuthority,
  getAuthorityBuildCount,
  resetProductRealityAuthorityBuilderForTests,
} from './product-reality-authority-builder.js';

export {
  buildProductRealityScore,
  buildProductRealityResult,
  evaluateProductReality,
  getEvaluationCount,
  resetProductRealityEvaluationForTests,
} from './product-reality-evaluator.js';

export {
  recordProductRealityHistory,
  getProductRealityHistory,
  getProductRealityHistorySize,
  clearProductRealityHistory,
  resetProductRealityHistoryForTests,
} from './bounded-history.js';

export {
  generateProductRealityReport,
  getReportCount,
  resetProductRealityReportBuilderForTests,
} from './product-reality-report-builder.js';

export {
  getDevPulseV2ProductRealityOrchestrator,
  registerProductRealityOrchestratorWithSurface,
  registerProductRealityOrchestratorWithFoundation,
  registerProductRealityOrchestratorWithCapabilityRegistry,
  registerProductRealityOrchestratorWithFindPanel,
  registerProductRealityOrchestratorWithUvl,
  registerProductRealityOrchestratorWithProductRealityChain,
  evaluateProductRealityOrchestrator,
  getProductRealityOrchestratorRuntimeReport,
} from './product-reality-orchestrator.js';

export type { ProductRealitySurfaceSnapshot } from './product-reality-orchestrator.js';

export function resetProductRealityOrchestratorForTests(): void {
  resetProductRealityRegistryForTests();
  resetProductRealityCacheForTests();
  resetProductRealityModelCountersForTests();
  resetExperienceAggregationBuilderForTests();
  resetAuthorityConflictDetectorForTests();
  resetLaunchBlockerAnalyzerForTests();
  resetReleaseReadinessAnalyzerForTests();
  resetFounderPriorityAnalyzerForTests();
  resetProductRealityRoadmapBuilderForTests();
  resetProductRealityAuthorityBuilderForTests();
  resetProductRealityEvaluationForTests();
  resetProductRealityHistoryForTests();
  resetProductRealityReportBuilderForTests();
  resetOrchestrationForTests();
}
