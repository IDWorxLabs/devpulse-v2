/**
 * Phase 26.90 — Product Readiness Completion Boundary Repair (V1).
 */

export {
  PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS,
  PRODUCT_READINESS_COMPLETE,
  PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION,
  PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_CACHE_KEY_PREFIX,
  COMPLETION_CHAIN_STEPS,
  PRODUCT_READINESS_COMPLETION_FAILURE_CLASSES,
} from './product-readiness-completion-boundary-repair-registry.js';

export type {
  ProductReadinessCompletionFailureClass,
  ChatStressSettlementAudit,
  ProductReadinessCompletionDetection,
  StageTransitionAnalysis,
  CompletionBoundaryRepairPlan,
  ProductReadinessCompletionBoundaryRepairReport,
  ProductReadinessCompletionBoundaryRepairAssessment,
  AssessProductReadinessCompletionBoundaryRepairInput,
  ApplyProductReadinessCompletionBoundaryRepairInput,
} from './product-readiness-completion-boundary-repair-types.js';

export {
  auditChatStressSettlement,
  isProductReadinessRule1Satisfied,
} from './chat-stress-settlement-auditor.js';

export {
  detectProductReadinessCompletion,
  hasProductReadinessCompleteEventEmitted,
  markProductReadinessCompleteEventEmitted,
  resetProductReadinessCompleteEventEmissionForTests,
} from './product-readiness-completion-detector.js';

export { analyzeStageTransition } from './stage-transition-analyzer.js';
export { planCompletionBoundaryRepair } from './completion-boundary-repair-planner.js';

export {
  recordProductReadinessCompletionBoundaryRepair,
  getProductReadinessCompletionBoundaryRepairHistory,
  getLatestProductReadinessCompletionBoundaryRepair,
  resetProductReadinessCompletionBoundaryRepairHistoryForTests,
} from './product-readiness-completion-history.js';

export {
  buildProductReadinessCompletionBoundaryRepairReportMarkdown,
  buildProductReadinessCompletionRepairReportMarkdown,
  buildProductReadinessCompletionValidationMarkdown,
} from './product-readiness-completion-report-builder.js';

export {
  assessProductReadinessCompletionBoundaryRepair,
  applyProductReadinessCompletionBoundaryRepair,
  emitProductReadinessCompleteOnce,
  propagateProductReadinessCompletionBoundariesSync,
  reconcileProductReadinessCompletionBoundaryOnSnapshot,
  resetProductReadinessCompletionBoundaryRepairCounterForTests,
  resetProductReadinessCompletionBoundaryRepairModuleForTests,
} from './product-readiness-completion-boundary-repair-authority.js';
