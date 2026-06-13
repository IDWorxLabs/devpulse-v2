/**
 * Product Lifecycle Reality Orchestrator — public API (Phase 26.19).
 */

export {
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN,
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_OWNER_MODULE,
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PHASE,
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT_TITLE,
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_CACHE_KEY_PREFIX,
  PRODUCT_LIFECYCLE_REALITY_CORE_QUESTION,
  MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY,
  UPSTREAM_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  LIFECYCLE_STATE_ORDER,
} from './product-lifecycle-reality-registry.js';

export { PRODUCT_LIFECYCLE_REALITY_STATES, LIFECYCLE_NEXT_ACTIONS } from './product-lifecycle-reality-types.js';

export type {
  ProductLifecycleRealityState,
  LifecycleNextAction,
  LifecycleAuthoritySignal,
  LifecycleSignalCollection,
  LifecycleStageClassification,
  LifecycleGapAnalysis,
  LifecycleRiskAnalysis,
  LifecycleScoreBreakdown,
  LifecycleNextActionResult,
  ProductLifecycleVerdict,
  ProductLifecycleInputSnapshot,
  ProductLifecycleRealityReport,
  ProductLifecycleRealityAssessment,
  AssessProductLifecycleRealityInput,
  ProductLifecycleRealityHistoryEntry,
  ProductLifecycleRealityHistorySummary,
  ProductLifecycleRealityArtifacts,
} from './product-lifecycle-reality-types.js';

export {
  resetProductLifecycleRealityHistoryForTests,
  recordProductLifecycleRealityAssessment,
  getProductLifecycleRealityHistorySize,
  buildProductLifecycleRealityHistorySummary,
} from './product-lifecycle-reality-history.js';

export {
  assessProductLifecycleReality,
  buildProductLifecycleRealityArtifacts,
  resetProductLifecycleRealityCounterForTests,
  resetProductLifecycleRealityOrchestratorModuleForTests,
} from './product-lifecycle-reality-orchestrator.js';

export {
  buildProductLifecycleRealityReportMarkdown,
  formatProductLifecycleRealitySummary,
} from './product-lifecycle-report-builder.js';

export { collectLifecycleSignals } from './lifecycle-signal-collector.js';
export { classifyLifecycleStage } from './lifecycle-stage-classifier.js';
export { analyzeLifecycleGaps } from './lifecycle-gap-analyzer.js';
export { analyzeLifecycleRisk } from './lifecycle-risk-analyzer.js';
export { determineLifecycleNextAction } from './lifecycle-next-action-engine.js';
export { computeProductLifecycleVerdict, computeLifecycleScores } from './product-lifecycle-verdict-engine.js';
